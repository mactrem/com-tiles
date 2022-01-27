import {calculateIndexOffsetForTile, getFragmentRangeForTile} from "./converter.mjs";
import pako from "./node_modules/pako/dist/pako.esm.mjs"

//const COMT_URL = "http://0.0.0.0:9000/comtiles/test.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=3718FS09AU0CV3T4OGWN%2F20220105%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220105T183958Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiIzNzE4RlMwOUFVMENWM1Q0T0dXTiIsImV4cCI6MTY0MTQxMTU5MywicGFyZW50IjoibWluaW9hZG1pbiJ9.bQ1bU0FLKvws3WhiFYFri7nVdYe4aFbADy9aiPxC1x4Z1soWHCKmfcSfy6083e6eIrMaIqzj-_TlB2NTuKvvJg&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=7ed22d6a8f1be00b7fb99e19137e04a9197b5323299cbef7e9a8e0280fc300ac";
//const COMT_URL = "http://0.0.0.0:9000/comtiles/germany-new4.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=OMT9P4J9V60F416O9J46%2F20220117%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220117T191026Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJPTVQ5UDRKOVY2MEY0MTZPOUo0NiIsImV4cCI6MTY0MjQ1MDIxMiwicGFyZW50IjoibWluaW9hZG1pbiJ9.hMpJ4kbXlnnzQqs8xhNQl5pJjSgghZY7PeBIuaQQmnQEHGp7pKHH07iHIhQIq7cZz673_ATjmPkC5Llmi3-rjg&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=cf4a89b23d7541a25ed3145d2e7a21b16a3465686984e7207ae2e9991ba191e3";
const COMT_URL = "";



/*
*
* -> move to helper package and rename to @com-tiles/provider?
* -> comtLoader
*   -> input -> x/y/z
*   -> output -> tile (ArrayBuffer)
* -> maplibreProtocolHandler
*
* comtLoader -> comtProvider
* -> getFragmentRangeForTile
* -> calculateIndexOffsetForTile
*
* -> TileCache -> ComtCache
*   -> getTile
* * */

(async()=>{
    //const {metadata, partialIndex, indexOffset, dataOffset} = await loadMetadataAndPartialIndex(COMT_URL);
    const map = new maplibregl.Map({
        container: "map",
        style: "http://localhost:8081/data/style.json",
        //center: [8.529727, 47.371622],
        center: [16.335668227571986, 48.18343081801389],
        zoom: 0
    });

    createMap(metadata, partialIndex, indexOffset, dataOffset, COMT_URL);
})();

const COMT_PROTOCOL_ID = "comt";

const fragmentCache = new Map();
const pendingRequestCache = new Map();

/**
 *
 * @param comtUrl Url to the object storage where the COMTiles archive is hosted.
 */
export async function addComtParser(comtUrl: string){
    //TODO: attribute that idea with github snippet
    maplibregl.addProtocol(COMT_PROTOCOL_ID, async (params, callback) => {
        //load partial index first



        let result = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
        const [tileUrl, url, z, x, y] = result;
        //console.info(`${z}/${x}/${y}`);

        //get data offset from partial index -> use utils lib -> convert to tms from xyz for using the utils lib
        const tmsY = (1 << parseInt(z)) - parseInt(y) - 1;
        const limit = metadata.tileMatrixSet.tileMatrixSet[z].tileMatrixLimits;
        if(x < limit.minTileCol || x > limit.maxTileCol || tmsY < limit.minTileRow || tmsY > limit.maxTileRow){
            console.info("Requested tile not within the boundary ot the TileSet.");
            callback(null, new Uint8Array(0), null, null);
            return;
        }

        let tileOffset;
        let tileSize;
        /*
        * -> Get tile from LRU Cache -> start with simple growing cache
        * -> If tile not in index request the fragment
        * */
        const [offset, index] = calculateIndexOffsetForTile(metadata, parseInt(z), parseInt(x), tmsY);
        if(offset >= partialIndex.byteLength){
            const fragmentRange = getFragmentRangeForTile(metadata, parseInt(z), parseInt(x), tmsY);

            let indexFragmentBuffer;
            if(fragmentCache.has(fragmentRange.index)){
                indexFragmentBuffer = fragmentCache.get(fragmentRange.index);
            }
            else{
                console.info("Query index fragment");
                //console.time("indexFragmentQuery" + x + y + z);

                //TODO: now the index fragment is queried for every tile -> cache ongoing request
                //requestCache.set()

                const startOffset = indexOffset + fragmentRange.startOffset;
                const endOffset = indexOffset + fragmentRange.endOffset;
                indexFragmentBuffer = await fetch(comtUrl, {
                    headers: {
                        'range': `bytes=${startOffset}-${endOffset}`,
                    },
                }).then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                });

                fragmentCache.set(fragmentRange.index, indexFragmentBuffer);
                //console.timeEnd("indexFragmentQuery" + x + y + z);
            }

            const indexEntrySize = 9;
            const relativeFragmentOffset = (index - fragmentRange.index) * indexEntrySize;
            tileOffset = convert5BytesLEToNumber(indexFragmentBuffer, relativeFragmentOffset);
            tileSize = new DataView(indexFragmentBuffer).getUint32(relativeFragmentOffset + 5, true);
        }
        else{
            //const tileOffset = indexView.getUint32(offset, true);
            tileOffset = convert5BytesLEToNumber(partialIndex, offset);
            tileSize = new DataView(partialIndex).getUint32(offset + 5, true);
        }
        //console.log(`Current index: ${index}`);
        //console.log(`Next tile offset: ${tileOffset+tileSize}`);

        const absoluteTileOffset = dataOffset + tileOffset;
        fetch(comtUrl, {
            headers: {
                'range': `bytes=${absoluteTileOffset}-${absoluteTileOffset+tileSize-1}`,
            },
        }).then(response => {
            if (response.ok) {
                return response.arrayBuffer();
            }
        }).then(buffer=>{
            const arr = new Uint8Array(buffer);
            const uncompressedBuffer = pako.ungzip(arr);
            callback(null, uncompressedBuffer, null, null);
        });

        return { cancel: () => console.log("Canceling the tile request is not implemented (yet).")  };
    });
}

async function createMap(metadata, partialIndex, indexOffset, dataOffset, comtUrl){
    //TODO: attribute that idea with github snippet
    maplibregl.addProtocol('comt', async (params, callback) => {
        let result = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
        const [tileUrl, url, z, x, y] = result;
        //console.info(`${z}/${x}/${y}`);

        //get data offset from partial index -> use utils lib -> convert to tms from xyz for using the utils lib
        const tmsY = (1 << parseInt(z)) - parseInt(y) - 1;
        const limit = metadata.tileMatrixSet.tileMatrixSet[z].tileMatrixLimits;
        if(x < limit.minTileCol || x > limit.maxTileCol || tmsY < limit.minTileRow || tmsY > limit.maxTileRow){
            console.info("Requested tile not within the boundary ot the TileSet.");
            callback(null, new Uint8Array(0), null, null);
            return;
        }

        let tileOffset;
        let tileSize;
        /*
        * -> Get tile from LRU Cache -> start with simple growing cache
        * -> If tile not in index request the fragment
        * */
        const [offset, index] = calculateIndexOffsetForTile(metadata, parseInt(z), parseInt(x), tmsY);
        if(offset >= partialIndex.byteLength){
            const fragmentRange = getFragmentRangeForTile(metadata, parseInt(z), parseInt(x), tmsY);

            let indexFragmentBuffer;
            if(fragmentCache.has(fragmentRange.index)){
                indexFragmentBuffer = fragmentCache.get(fragmentRange.index);
            }
            else{
                console.info("Query index fragment");
                //console.time("indexFragmentQuery" + x + y + z);

                //TODO: now the index fragment is queried for every tile -> cache ongoing request
                //requestCache.set()

                const startOffset = indexOffset + fragmentRange.startOffset;
                const endOffset = indexOffset + fragmentRange.endOffset;
                indexFragmentBuffer = await fetch(comtUrl, {
                    headers: {
                        'range': `bytes=${startOffset}-${endOffset}`,
                    },
                }).then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                });

                fragmentCache.set(fragmentRange.index, indexFragmentBuffer);
                //console.timeEnd("indexFragmentQuery" + x + y + z);
            }

            const indexEntrySize = 9;
            const relativeFragmentOffset = (index - fragmentRange.index) * indexEntrySize;
            tileOffset = convert5BytesLEToNumber(indexFragmentBuffer, relativeFragmentOffset);
            tileSize = new DataView(indexFragmentBuffer).getUint32(relativeFragmentOffset + 5, true);
        }
        else{
            //const tileOffset = indexView.getUint32(offset, true);
            tileOffset = convert5BytesLEToNumber(partialIndex, offset);
            tileSize = new DataView(partialIndex).getUint32(offset + 5, true);
        }
        //console.log(`Current index: ${index}`);
        //console.log(`Next tile offset: ${tileOffset+tileSize}`);

        const absoluteTileOffset = dataOffset + tileOffset;
        fetch(comtUrl, {
            headers: {
                'range': `bytes=${absoluteTileOffset}-${absoluteTileOffset+tileSize-1}`,
            },
        }).then(response => {
            if (response.ok) {
                return response.arrayBuffer();
            }
        }).then(buffer=>{
            const arr = new Uint8Array(buffer);
            const uncompressedBuffer = pako.ungzip(arr);
            callback(null, uncompressedBuffer, null, null);
        });

        return { cancel: () => console.log("Canceling the tile request is not implemented (yet).")  };
    });

    const map = new maplibregl.Map({
        container: "map",
        style: "http://localhost:8081/data/style.json",
        //center: [8.529727, 47.371622],
        center: [16.335668227571986, 48.18343081801389],
        zoom: 0
    });
}

async function loadMetadataAndPartialIndex(url){
    //TODO: size to small when vector layers are included
    //const maxMetadataSize = 1<<15; //32768;
    //const initialChunkSize = 2 ** 19; //512k
    //const initialChunkSize = 2 ** 22; //4mb
    const initialChunkSize = 2 ** 14;

    const buffer = await fetch(url, {
        headers: {
            //'content-type': 'multipart/byteranges',
            //TODO: what should be the default size for fetching the metadata
            //'range': `bytes=0-${MAX_METADATA_SIZE-1}`,
            'range': `bytes=0-${initialChunkSize-1}`,
        },
    }).then(response => {
        if (response.ok) {
            return response.arrayBuffer();
        }
    });

    const dataView = new DataView(buffer);
    //TODO: add version
    const metadataSize = dataView.getUint32(4, true);
    //TODO: not needed anymore when metadata and part of the index are fetched at once
    /*if(metadataSize > MAX_METADATA_SIZE){
            throw Error(`Size of the metadata document is larger then ${MAX_METADATA_SIZE} bytes`);
    }*/
    //const indexSize = dataView.getUint32(8, true);
    const indexSize = convert5BytesLEToNumber(buffer, 8);
    //console.info(`Index size: ${indexSize/1024/1924} mb`);

    const metadataStartIndex = 13;
    const metadataBuffer = buffer.slice(metadataStartIndex, (metadataStartIndex + metadataSize));
    const textDecoder = new TextDecoder("utf-8");
    const metadataDocument = textDecoder.decode(metadataBuffer);
    const metadata = JSON.parse(metadataDocument);
    //const tileMatrixSet = metadata.tileMatrixSet;
    //TODO: check for tileMatrixCRS and RowMajor
    //const limits = tileMatrixSet.tileMatrixSet;

    //get first 500k of the index
    //build an index LRU cache where the initial 0-8 and the further requested tiles are stored

    const indexOffset = metadataStartIndex + metadataSize;
    const indexEntrySize = 9;
    //get rid of a potential last incomplete index offset
    const endOffset = indexOffset + Math.floor((initialChunkSize - indexOffset) / indexEntrySize) * indexEntrySize;
    const partialIndex = buffer.slice(indexOffset, endOffset);

    const dataOffset = indexOffset + indexSize;
    return {metadata, partialIndex, indexOffset, dataOffset};
}

function convert5BytesLEToNumber(buffer,offset){
    const slicedBuffer = new Uint8Array(buffer.slice(offset, offset + 5));
    const convertedBuffer = new Uint8Array([slicedBuffer[0], slicedBuffer[1], slicedBuffer[2], slicedBuffer[3],
        slicedBuffer[4], 0, 0, 0]).buffer;
    const view = new DataView(convertedBuffer);
    return Number(view.getBigUint64(0, true));
}



interface Header{
    indexOffset: number,
    dataOffset: number,
    metadata: MetaData,
    partialIndex: ArrayBuffer
}

export default class ComtCache{
    private static readonly INITIAL_CHUNK_SIZE = 2 ** 19; //512k
    private static METADATA_OFFSET_INDEX = 13; //TODO: reference spec
    private static SUPPORTED_TILE_MATRIX_CRS = "WebMercatorQuad";
    private static SUPPORTED_ORDERING = "RowMajor";
    private static INDEX_ENTRY_NUM_BYTES = 9;

    private readonly indexCache: IndexCache;

    /**
     *
     * @param comtUrl Url to an object storage where the COMT archive is hosted.
     * @param prefetchHeader Specifies if the header should be fetched during construction of the class and before
     *          the first tile is requested.
     */
    private constructor(private readonly comtUrl: string, private header?: Header) {
        this.indexCache = new IndexCache();

        if(header){
            header.metadata.tileMatrixSet
            this.indexCache.set(header.partialIndex);
        }
    }

    static async create(comtUrl: string, prefetchHeader: true): Promise<ComtCache>{
        const header = prefetchHeader? (await ComtCache.loadHeader()) : null;
        return new ComtCache(comtUrl, header);
    }


    /**
     *
     * @param zoom Zoom level
     * @param x
     * @param y Y axis goes down
     */
    async getTile(zoom: number, x: number, y: number, cancel?: () => void): ArrayBuffer{
        /*
        * -> fetch header and partialIndex
        * -> partialIndex is the unfragmented index which is calculated by the TileMatrixLImits
        * -> store partialIndex and fragments in LRU cache
        * -> use a RequestCache to reduce number of request
        *
        * */

        this.header ??= await ComtCache.loadHeader();


        //get data offset from partial index -> use utils lib -> convert to tms from xyz for using the utils lib
        const tmsY = (1 << zoom) - y - 1;
        const limit = this.metadata.tileMatrixSet.tileMatrixSet[zoom].tileMatrixLimits; //TODO: rename tileMatrixSet.tileMatrixSet
        if(x < limit.minTileCol || x > limit.maxTileCol || tmsY < limit.minTileRow || tmsY > limit.maxTileRow){
            //console.info("Requested tile not within the boundary ot the TileSet.");
            return new Uint8Array(0);
        }

        let tileOffset;
        let tileSize;
        /*
        * -> Get tile from LRU Cache -> start with simple growing cache
        * -> If tile not in index request the fragment
        * */
        const [offset, index] = calculateIndexOffsetForTile(metadata, parseInt(z), parseInt(x), tmsY);
        /*if(offset >= partialIndex.byteLength){
            const fragmentRange = getFragmentRangeForTile(metadata, parseInt(z), parseInt(x), tmsY);

            let indexFragmentBuffer;
            if(fragmentCache.has(fragmentRange.index)){
                indexFragmentBuffer = fragmentCache.get(fragmentRange.index);
            }
            else{
                console.info("Query index fragment");
                //console.time("indexFragmentQuery" + x + y + z);

                //TODO: now the index fragment is queried for every tile -> cache ongoing request
                //requestCache.set()

                const startOffset = indexOffset + fragmentRange.startOffset;
                const endOffset = indexOffset + fragmentRange.endOffset;
                indexFragmentBuffer = await fetch(comtUrl, {
                    headers: {
                        'range': `bytes=${startOffset}-${endOffset}`,
                    },
                }).then(response => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                });

                fragmentCache.set(fragmentRange.index, indexFragmentBuffer);
                //console.timeEnd("indexFragmentQuery" + x + y + z);
            }

            const indexEntrySize = 9;
            const relativeFragmentOffset = (index - fragmentRange.index) * indexEntrySize;
            tileOffset = convert5BytesLEToNumber(indexFragmentBuffer, relativeFragmentOffset);
            tileSize = new DataView(indexFragmentBuffer).getUint32(relativeFragmentOffset + 5, true);
        }
        else{
            //const tileOffset = indexView.getUint32(offset, true);
            tileOffset = convert5BytesLEToNumber(partialIndex, offset);
            tileSize = new DataView(partialIndex).getUint32(offset + 5, true);
        }*/
        //console.log(`Current index: ${index}`);
        //console.log(`Next tile offset: ${tileOffset+tileSize}`);

        if(this.indexCache.has(index)){

        }
        else{
            //fetch
        }

        const absoluteTileOffset = dataOffset + tileOffset;
        return this.fetchTile(absoluteTileOffset, tileSize);
    }

    private static async fetchHeader(): ArrayBuffer{
        //TODO: calculate chunk size based on TileSetMatrix
        return this.fetchBinaryData(0, (ComtCache.INITIAL_CHUNK_SIZE - 1));
    }

    private async fetchBinaryData(firstBytePos: number, lastBytePos: number): ArrayBuffer{
        const response = await fetch(this.comtUrl, {
            headers: {
                "range": `bytes=${firstBytePos}-${lastBytePos}`,
            }
        });

        if(!response.ok){
            throw new Error(response.statusText);
        }

        return response.arrayBuffer();
    }

    private static async loadHeader(): Promise<Header> {
        const buffer = await ComtCache.fetchHeader();

        const view = new DataView(buffer);
        const metadataSize = view.getUint32(4, true); //TODO: add version
        const indexSize = this.convert5BytesLEToNumber(buffer, 8);

        const indexOffset = ComtCache.METADATA_OFFSET_INDEX  + metadataSize;
        const metadataBuffer = buffer.slice(ComtCache.METADATA_OFFSET_INDEX, indexOffset);
        const metadataDocument = new TextDecoder().decode(metadataBuffer);
        const metadata = JSON.parse(metadataDocument);

        this.validateTileMatrixSet(metadata.tileMatrixSet);

        /* truncate last potential incomplete IndexEntry */
        const numCompleteIndexEntries = Math.floor((ComtCache.INITIAL_CHUNK_SIZE - indexOffset) / ComtCache.INDEX_ENTRY_NUM_BYTES);
        const endOffset = indexOffset + numCompleteIndexEntries * ComtCache.INDEX_ENTRY_NUM_BYTES;
        //TODO: partial index also contains index fragments
        const partialIndex = buffer.slice(indexOffset, endOffset);

        const dataOffset = indexOffset + indexSize;
        return {indexOffset, dataOffset, metadata, partialIndex};
    }

    //TODO: add TileMatrixSet type
    private static validateTileMatrixSet(tileMatrixSet): void{
        const supportedOrdering = [undefined, ComtCache.SUPPORTED_ORDERING];
        if(![tileMatrixSet.fragmentOrdering, tileMatrixSet.tileOrdering].every(ordering => supportedOrdering.some(o => o === ordering))){
            throw new Error(`The only supported fragment and tile ordering is ${ComtCache.SUPPORTED_ORDERING}`);
        }

        if(tileMatrixSet.tileMatrixCRS !== undefined && tileMatrixSet?.tileMatrixCRS.trim().toLowerCase() !== ComtCache.SUPPORTED_TILE_MATRIX_CRS.toLowerCase()){
            throw new Error(`The only supported TileMatrixCRS is ${ComtCache.SUPPORTED_TILE_MATRIX_CRS}.`);
        }
    }

    //TODO: refactor
    private static convert5BytesLEToNumber(buffer,offset){
        const slicedBuffer = new Uint8Array(buffer.slice(offset, offset + 5));
        const convertedBuffer = new Uint8Array([slicedBuffer[0], slicedBuffer[1], slicedBuffer[2], slicedBuffer[3],
            slicedBuffer[4], 0, 0, 0]).buffer;
        const view = new DataView(convertedBuffer);
        return Number(view.getBigUint64(0, true));
    }

    private async fetchTile(tileOffset: number, tileSize): ArrayBuffer{
        //"range": `bytes=${absoluteTileOffset}-${absoluteTileOffset+tileSize-1}`,
        const buffer = this.fetchBinaryData(tileOffset, (tileOffset + tileSize -1));
        const compressedTile = new Uint8Array(buffer);
        return pako.ungzip(compressedTile);
    }
}

class IndexCache {

    constructor(private readonly cacheSize?: number) {
    }

    /*
    *
    * -> partialIndex -> Array of IndexEntries
    * -> indexFragments -> Array of IndexEntries with a range for faster lookup?
    *
    * LRU Cache
    * -> Array with Map
    *
    * -> set ArrayBuffer with tileSetLimits?
    *   -> every zoomLevel and fragment has bounds
    *   -> which DataStructure?
    *     -> Option 1 -> Map with xyz -> iterate over partialIndex and all fragments which can be slow -> > 200k entries until zoom 9
    *     -> Option 2 -> Quadtree for bounds for every zoom level?
    *       -> ArrayBuffer with bounds
    *       -> Array for the zoom levels
    *           -> 1. ArrayBuffer if index is not fragmented in that zoom level
    *           -> 2.
    *   -> Or using btree or interval tree on the space fllling curve with the index -> calculate index on the sfc
    *       -> indexRange as bounds on the sfc for the ArrayBuffer
    *   -> LRU cache
    *       -> Pointer with timestamps to IndexEntries
    *       -> Pointer to fragments -> always delete whole fragment because this is atomic for fetching
    *       -> delete only fragments and keep the unfragmented? -> because how to request only parts of the unfragmented index?
    *
    *   -> how to handle if the unfragmented index is not fully downloaded? -> also query index fragment?
    *       -> or throw exception if the calculated number of unfragmented IndexEntries > 200k or so?
    *         -> 350k tiles e.g. 0-9 are 3mb of data
    *         -> 0-7 are 21k tiles with a size of 190k
    *
    *   -> request the partialIndex for all zoom level which have an aggregatinCoefficent from -1
    *       -> if > 21k indexEntries log a warning
    *   -> partialIndex is always cached
    *   -> IndexFragments are cached in a LRU cached
    *       -> IntervalTree for the IndexFragments
    *       -> Array for the LRU cache with the order -> LRU cache is implemented with a double linked list and a hash table
    *
    * */

    set(indexEntries: ArrayBuffer, limit: IndexRange){

    }

    /**
     *
     * @param zoom
     * @param x
     * @param y Tms order
     * @returns Relative offset and size of the specified tile in the data section.
     */
    get(zoom: number, x: number, y: number): Tile{

    }

    has(index: number): boolean{
        return true;
    }
}
