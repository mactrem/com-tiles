import pako from "pako";
import { Metadata } from "@comt/spec";
import ComtIndex, { FragmentRange } from "./comtIndex";

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

//TODO: refactor
function convertUInt40LEToNumber(buffer, offset) {
    const slicedBuffer = new Uint8Array(buffer.slice(offset, offset + 5));
    const convertedBuffer = new Uint8Array([
        slicedBuffer[0],
        slicedBuffer[1],
        slicedBuffer[2],
        slicedBuffer[3],
        slicedBuffer[4],
        0,
        0,
        0,
    ]).buffer;
    const view = new DataView(convertedBuffer);
    return Number(view.getBigUint64(0, true));
}

class IndexCache {
    /*
     * The partial index is always kept in memory and can be mixed up with fragmented and unfragmented tile matrices.
     * For the index fragments which are added to the cache a LRU cache is used.
     * Through this procedure there can be redundant index entries in the partial index and the LRU cache
     * when the last fragment of the partial index is incomplete, but in general this doesn't matter.
     * */

    private static readonly INDEX_ENTRY_NUM_BYTES = 9;
    /* 7 zoom levels (8-14) * 4 fragments per zoom */
    private static readonly MAX_ENTRIES_LRU_CACHE = 28;
    private readonly fragmentedIndex: LruCache<number, { fragmentRange: FragmentRange; indexEntries: Uint8Array }>;
    private readonly comtIndex: ComtIndex;

    constructor(
        private readonly metadata: Metadata, //Metadata["tileMatrixSet"],
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
     *
     * @param zoom
     * @param x
     * @param y Tms order
     * @returns Relative offset and size of the specified tile in the data section.
     */
    get(zoom: number, x: number, y: number): IndexEntry {
        //TODO: get rid of that redundant method call
        const [offset, index] = this.comtIndex.calculateIndexOffsetForTile(zoom, x, y);
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
        const offset = convertUInt40LEToNumber(indexEntries, indexOffset);
        const size = new DataView(this.partialIndex.buffer).getUint32(indexOffset + 5, true);
        return { offset, size };
    }

    /**
     *
     * @param index Index of a specific {@lin IndexEntry}.
     */
    /*has(index: number): boolean {
        return true;
    }*/
}

enum TileContent {
    MVT,
    PNG,
}

export class CancellationToken {
    private readonly subscribers = [];

    cancel(): void {
        this.subscribers.forEach((subscriber) => subscriber());
    }

    register(callback: () => void): void {
        this.subscribers.push(callback);
    }

    //TODO: unsubscribe
}

export default class ComtCache {
    private static readonly INITIAL_CHUNK_SIZE = 2 ** 19; //512k
    private static readonly METADATA_OFFSET_INDEX = 17; //TODO: reference spec
    private static readonly SUPPORTED_TILE_MATRIX_CRS = "WebMercatorQuad";
    private static readonly SUPPORTED_ORDERING = "RowMajor";
    private static readonly INDEX_ENTRY_NUM_BYTES = 9;
    //private static readonly MAX_ENTRIES_PARTIAL_INDEX = 21845;
    private indexCache: IndexCache;
    private comtIndex: ComtIndex;
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

    static async create(comtUrl: string, tileContent = TileContent.MVT, prefetchHeader = true): Promise<ComtCache> {
        const header = prefetchHeader ? await ComtCache.loadHeader(comtUrl) : null;
        return new ComtCache(comtUrl, header);
    }

    /**
     *
     * @param zoom Zoom level
     * @param x
     * @param y Y axis goes down
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
        return this.fetchMVT(absoluteTileOffset, indexEntry.size);
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
            const indexEntryRequest = ComtCache.fetchBinaryData(
                this.comtUrl,
                fragmentRange.startOffset,
                fragmentRange.endOffset,
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
        const controller = new AbortController();
        const signal = controller.signal;

        if (cancellationToken) {
            //TODO: use promise insteae -> memory leak
            cancellationToken.register(() => {
                controller.abort();
            });
        }

        const response = await fetch(url, {
            headers: {
                range: `bytes=${firstBytePos}-${lastBytePos}`,
            },
            signal,
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        //unsubscribe from cancellationToken
        return response.arrayBuffer();
    }

    private static async loadHeader(comtUrl: string): Promise<Header> {
        const buffer = await ComtCache.fetchHeader(comtUrl);

        const view = new DataView(buffer);
        const version = view.getUint32(4, true);
        const metadataSize = view.getUint32(8, true);
        const indexSize = convertUInt40LEToNumber(buffer, 12);

        const indexOffset = ComtCache.METADATA_OFFSET_INDEX + metadataSize;
        const metadataBuffer = buffer.slice(ComtCache.METADATA_OFFSET_INDEX, indexOffset);
        const metadataDocument = new TextDecoder().decode(metadataBuffer);
        const metadata = JSON.parse(metadataDocument);

        this.validateMetadata(metadata);

        /* truncate last potential incomplete IndexEntry */
        const numCompleteIndexEntries = Math.floor(
            (ComtCache.INITIAL_CHUNK_SIZE - indexOffset) / ComtCache.INDEX_ENTRY_NUM_BYTES,
        );
        const endOffset = indexOffset + numCompleteIndexEntries * ComtCache.INDEX_ENTRY_NUM_BYTES;
        const partialIndex = buffer.slice(indexOffset, endOffset);
        //const indexCache = new IndexCache(metadata.tileMatrixSet, partialIndex);

        const dataOffset = indexOffset + indexSize;
        return { indexOffset, dataOffset, metadata, partialIndex };
    }

    private static validateMetadata(metadata: Metadata): void {
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

        //TODO: add a warning if unfragmented index is not fully downloaded
        /*const numIndexEntriesPartialIndex = tileMatrixSet.tileMatrix
            .filter((tm) => tm.aggregationCoefficient === -1)
            .reduce((numIndexEntries, tm) => {
                const limits = tm.tileMatrixLimits;
                return (
                    numIndexEntries +
                    (limits.maxTileCol - limits.minTileCol + 1) * (limits.maxTileRow - limits.minTileRow + 1)
                );
            }, 0);
        if (numIndexEntriesPartialIndex > ComtCache.MAX_ENTRIES_PARTIAL_INDEX) {
            throw new Error(
                `Only max ${ComtCache.METADATA_OFFSET_INDEX} index entries without using index fragments are allowed.`,
            );
        }*/
    }

    private async fetchMVT(tileOffset: number, tileSize): Promise<Uint8Array> {
        const buffer = await ComtCache.fetchBinaryData(this.comtUrl, tileOffset, tileOffset + tileSize - 1);
        const compressedTile = new Uint8Array(buffer);
        return pako.ungzip(compressedTile);
    }
}
