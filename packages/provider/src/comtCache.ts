import pako from "pako";
import { Metadata } from "@comt/spec";
import ComtIndex, { FragmentRange } from "./comtIndex";
import LruCache from "./lruCache";
import { convertUInt40LEToNumber } from "./utils";

interface Header {
    indexOffset: number;
    dataOffset: number;
    metadata: Metadata;
    partialIndex: ArrayBuffer;
}

interface IndexEntry {
    offset: number;
    size: number;
}

export type Callback = () => void;

export class CancellationToken {
    private readonly subscribers: Callback[] = [];

    cancel(): void {
        this.subscribers.forEach((subscriber) => subscriber());
    }

    register(callback: Callback): void {
        this.subscribers.push(callback);
    }

    unregister(callback: Callback) {
        const index = this.subscribers.indexOf(callback);
        this.subscribers.splice(index, 1);
    }
}

class IndexCache {
    private static readonly INDEX_ENTRY_NUM_BYTES = 9;
    /* 7 zoom levels (8-14) * 4 fragments per zoom */
    private static readonly MAX_ENTRIES_LRU_CACHE = 28;
    private readonly fragmentedIndex = new LruCache<number, { fragmentRange: FragmentRange; indexEntries: Uint8Array }>(
        IndexCache.MAX_ENTRIES_LRU_CACHE,
    );
    private readonly comtIndex: ComtIndex;

    /*
     * The partial index is always kept in memory and can be mixed up with fragmented and unfragmented tile matrices.
     * For the index fragments which are added to the cache a LRU cache is used.
     * Through this procedure there can be redundant index entries in the partial index and the LRU cache
     * when the last fragment of the partial index is incomplete, but in general this doesn't matter.
     * */
    constructor(
        private readonly metadata: Metadata,
        private readonly partialIndex = new Uint8Array(0),
        private readonly cacheSize?: number,
    ) {
        this.comtIndex = new ComtIndex(this.metadata);
    }

    setIndexFragment(fragmentRange: FragmentRange, indexEntries: Uint8Array): void {
        const index = fragmentRange.startOffset;
        this.fragmentedIndex.put(index, { fragmentRange, indexEntries });
    }

    /**
     * @param zoom
     * @param x
     * @param y Tms order
     * @returns Relative offset and size of the specified tile in the data section.
     */
    get(zoom: number, x: number, y: number): IndexEntry {
        //TODO: get rid of that redundant method call
        const { index } = this.comtIndex.calculateIndexOffsetForTile(zoom, x, y);
        const { startOffset, index: fragmentStartIndex } = this.comtIndex.getFragmentRangeForTile(zoom, x, y);

        const indexOffset = index * IndexCache.INDEX_ENTRY_NUM_BYTES;
        if (indexOffset <= this.partialIndex.byteLength - IndexCache.INDEX_ENTRY_NUM_BYTES) {
            return this.createIndexEntry(indexOffset, this.partialIndex);
        }

        const indexFragment = this.fragmentedIndex.get(startOffset);
        if (!indexFragment) {
            return null;
        }

        const relativeFragmentOffset = (index - fragmentStartIndex) * IndexCache.INDEX_ENTRY_NUM_BYTES;
        return this.createIndexEntry(relativeFragmentOffset, indexFragment.indexEntries);
    }

    private createIndexEntry(indexOffset: number, indexEntries: Uint8Array): IndexEntry {
        const indexBuffer = indexEntries.buffer;
        const offset = convertUInt40LEToNumber(indexBuffer, indexOffset);
        const size = new DataView(indexBuffer).getUint32(indexOffset + 5, true);
        return { offset, size };
    }
}

export enum TileContent {
    MVT,
    PNG,
}

export default class ComtCache {
    private static readonly SUPPORTED_VERSION = 1;
    private static readonly INITIAL_CHUNK_SIZE = 2 ** 19; //512k
    private static readonly METADATA_OFFSET_INDEX = 17;
    private static readonly SUPPORTED_TILE_MATRIX_CRS = "WebMercatorQuad";
    private static readonly SUPPORTED_ORDERING = "RowMajor";
    private static readonly INDEX_ENTRY_NUM_BYTES = 9;
    private indexCache: IndexCache = null;
    private comtIndex: ComtIndex = null;
    private readonly requestCache = new Map<number, Promise<ArrayBuffer>>();

    /**
     *
     * @param comtUrl Url to an object storage where the COMT archive is hosted.
     * @param prefetchHeader Specifies if the header should be fetched during construction of the class and before
     *          the first tile is requested.
     */
    private constructor(private readonly comtUrl: string, private header?: Header) {
        if (header) {
            this.initIndex(header);
        }
    }

    /**
     * @param comtUrl Url to object storage where the COMTiles archive is hosted.
     * @param tileContent Content type of the map tiles.
     * @param prefetchHeader Specifies if the header should be prefetched or lazy loaded.
     */
    static async create(comtUrl: string, tileContent = TileContent.MVT, prefetchHeader = true): Promise<ComtCache> {
        if (tileContent !== TileContent.MVT) {
            throw new Error("Only Mapbox Vector Tiles are currently supported as content of a map tile.");
        }

        const header = prefetchHeader ? await ComtCache.loadHeader(comtUrl) : null;
        return new ComtCache(comtUrl, header);
    }

    /**
     * Fetches a map tile with the given XYZ index from the specified COMTiles archive.
     *
     * @param zoom Zoom level for the specific tile.
     * @param x X index for the specific tile.
     * @param y Y index for the specific, axis goes down (XYZ tiling scheme)
     * @param cancellationToken For aborting the tile request.
     */
    async getTile(zoom: number, x: number, y: number, cancellationToken?: CancellationToken): Promise<ArrayBuffer> {
        /* Lazy load the header on the first tile request */
        if (!this.header) {
            //TODO: avoid redundant header requests
            this.header = await ComtCache.loadHeader(this.comtUrl);
            this.initIndex(this.header);
        }

        const { metadata } = this.header;
        /* COMTiles uses the y-axis alignment of the TMS spec which is flipped compared to xyz */
        const tmsY = (1 << zoom) - y - 1;
        const limit = metadata.tileMatrixSet.tileMatrix[zoom].tileMatrixLimits;
        if (x < limit.minTileCol || x > limit.maxTileCol || tmsY < limit.minTileRow || tmsY > limit.maxTileRow) {
            console.trace("Requested tile not within the boundary ot the TileSet.");
            return new Uint8Array(0);
        }

        const indexEntry =
            this.indexCache.get(zoom, x, tmsY) ?? (await this.fetchIndexEntry(zoom, x, tmsY, cancellationToken));
        const absoluteTileOffset = this.header.dataOffset + indexEntry.offset;
        /* Return an empty array if the tile is missing */
        return indexEntry.size ? this.fetchMVT(absoluteTileOffset, indexEntry.size) : new Uint8Array(0);
    }

    private async fetchIndexEntry(
        zoom: number,
        x: number,
        y: number,
        cancellationToken: CancellationToken,
    ): Promise<IndexEntry> {
        const fragmentRange = this.comtIndex.getFragmentRangeForTile(zoom, x, y);

        let indexFragment: ArrayBuffer;
        /* avoid redundant requests to the same index fragment */
        if (!this.requestCache.has(fragmentRange.startOffset)) {
            console.info(
                `Fetch fragment with index offset ${(fragmentRange.startOffset / 1024 / 1024).toFixed(
                    2,
                )} MB for tile ${zoom}/${x}/${y}`,
            );

            const startOffset = this.header.indexOffset + fragmentRange.startOffset;
            const endOffset = this.header.indexOffset + fragmentRange.endOffset;
            const indexEntryRequest = ComtCache.fetchBinaryData(
                this.comtUrl,
                startOffset,
                endOffset,
                cancellationToken,
            );
            this.requestCache.set(fragmentRange.startOffset, indexEntryRequest);

            try {
                indexFragment = await indexEntryRequest;
            } finally {
                this.requestCache.delete(fragmentRange.startOffset);
            }
        } else {
            indexFragment = await this.requestCache.get(fragmentRange.startOffset);
        }

        //TODO: refactor -> get rid of get call on index fragment for calculation
        this.indexCache.setIndexFragment(fragmentRange, new Uint8Array(indexFragment));
        return this.indexCache.get(zoom, x, y);
    }

    private initIndex(header: Header): void {
        this.indexCache = new IndexCache(this.header.metadata, new Uint8Array(this.header.partialIndex));
        this.comtIndex = new ComtIndex(header.metadata);
    }

    private static fetchHeader(comtUrl: string): Promise<ArrayBuffer> {
        return ComtCache.fetchBinaryData(comtUrl, 0, ComtCache.INITIAL_CHUNK_SIZE - 1);
    }

    private static async fetchBinaryData(
        url: string,
        firstBytePos: number,
        lastBytePos: number,
        cancellationToken?: CancellationToken,
    ): Promise<ArrayBuffer> {
        const { signal, abort } = new AbortController();
        if (cancellationToken) {
            cancellationToken.register(abort);
        }

        const response = await fetch(url, {
            headers: {
                range: `bytes=${firstBytePos}-${lastBytePos}`,
            },
            signal,
        });
        cancellationToken?.unregister(abort);

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        return response.arrayBuffer();
    }

    private static async loadHeader(comtUrl: string): Promise<Header> {
        const buffer = await ComtCache.fetchHeader(comtUrl);

        const view = new DataView(buffer);

        const version = view.getUint32(4, true);
        if (version !== ComtCache.SUPPORTED_VERSION) {
            throw new Error("The specified version of the COMT archive is not supported.");
        }

        const metadataSize = view.getUint32(8, true);
        const indexSize = convertUInt40LEToNumber(buffer, 12);

        const indexOffset = ComtCache.METADATA_OFFSET_INDEX + metadataSize;
        const metadataBuffer = buffer.slice(ComtCache.METADATA_OFFSET_INDEX, indexOffset);
        const metadataDocument = new TextDecoder().decode(metadataBuffer);
        const metadata = JSON.parse(metadataDocument);

        const numCompleteIndexEntries = Math.floor(
            (ComtCache.INITIAL_CHUNK_SIZE - indexOffset) / ComtCache.INDEX_ENTRY_NUM_BYTES,
        );
        this.validateMetadata(metadata, numCompleteIndexEntries);

        /* truncate last potential incomplete IndexEntry */
        const endOffset = indexOffset + numCompleteIndexEntries * ComtCache.INDEX_ENTRY_NUM_BYTES;
        const partialIndex = buffer.slice(indexOffset, endOffset);

        const dataOffset = indexOffset + indexSize;
        return { indexOffset, dataOffset, metadata, partialIndex };
    }

    private static validateMetadata(metadata: Metadata, downloadedUnfragmentedIndexEntries: number): void {
        if (metadata.tileFormat !== "pbf") {
            throw new Error("Currently pbf (MapboxVectorTiles) is the only supported tileFormat.");
        }

        const tileMatrixSet = metadata.tileMatrixSet;
        const supportedOrdering = [undefined, ComtCache.SUPPORTED_ORDERING];
        if (
            ![tileMatrixSet.fragmentOrdering, tileMatrixSet.tileOrdering].every((ordering) =>
                supportedOrdering.some((o) => o === ordering),
            )
        ) {
            throw new Error(`The only supported fragment and tile ordering is ${ComtCache.SUPPORTED_ORDERING}`);
        }

        if (
            tileMatrixSet.tileMatrixCRS !== undefined &&
            tileMatrixSet?.tileMatrixCRS.trim().toLowerCase() !== ComtCache.SUPPORTED_TILE_MATRIX_CRS.toLowerCase()
        ) {
            throw new Error(`The only supported TileMatrixCRS is ${ComtCache.SUPPORTED_TILE_MATRIX_CRS}.`);
        }

        const unfragmentedIndexEntries = tileMatrixSet.tileMatrix
            .filter((tm) => tm.aggregationCoefficient === -1)
            .reduce((numIndexEntries, tm) => {
                const limits = tm.tileMatrixLimits;
                return (
                    numIndexEntries +
                    (limits.maxTileCol - limits.minTileCol + 1) * (limits.maxTileRow - limits.minTileRow + 1)
                );
            }, 0);
        /* Currently only index fragments can be loaded after the initial fetch */
        if (unfragmentedIndexEntries > downloadedUnfragmentedIndexEntries) {
            throw new Error(
                "The unfragmented part (aggregationCoefficient=-1) of the index has to be part of the initial fetch. Only index fragments can be reloaded",
            );
        }
    }

    private async fetchMVT(tileOffset: number, tileSize: number): Promise<Uint8Array> {
        const buffer = await ComtCache.fetchBinaryData(this.comtUrl, tileOffset, tileOffset + tileSize - 1);
        const compressedTile = new Uint8Array(buffer);
        return pako.ungzip(compressedTile);
    }
}
