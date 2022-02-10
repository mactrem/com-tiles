import {calculateIndexOffsetForTile, getFragmentRangeForTile} from "./converter.mjs";
import pako from "./node_modules/pako/dist/pako.esm.mjs"

//const COMT_URL = "http://0.0.0.0:9000/comtiles/test.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=3718FS09AU0CV3T4OGWN%2F20220105%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220105T183958Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiIzNzE4RlMwOUFVMENWM1Q0T0dXTiIsImV4cCI6MTY0MTQxMTU5MywicGFyZW50IjoibWluaW9hZG1pbiJ9.bQ1bU0FLKvws3WhiFYFri7nVdYe4aFbADy9aiPxC1x4Z1soWHCKmfcSfy6083e6eIrMaIqzj-_TlB2NTuKvvJg&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=7ed22d6a8f1be00b7fb99e19137e04a9197b5323299cbef7e9a8e0280fc300ac";
//const COMT_URL = "http://0.0.0.0:9000/comtiles/germany-new4.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=OMT9P4J9V60F416O9J46%2F20220117%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220117T191026Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJPTVQ5UDRKOVY2MEY0MTZPOUo0NiIsImV4cCI6MTY0MjQ1MDIxMiwicGFyZW50IjoibWluaW9hZG1pbiJ9.hMpJ4kbXlnnzQqs8xhNQl5pJjSgghZY7PeBIuaQQmnQEHGp7pKHH07iHIhQIq7cZz673_ATjmPkC5Llmi3-rjg&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=cf4a89b23d7541a25ed3145d2e7a21b16a3465686984e7207ae2e9991ba191e3";
//const COMT_URL = "http://0.0.0.0:9000/comtiles/europe-new5.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=E4MUFH2RLPK2J12QCBW0%2F20220119%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220119T192424Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJFNE1VRkgyUkxQSzJKMTJRQ0JXMCIsImV4cCI6MTY0MjYyMTE3MSwicGFyZW50IjoibWluaW9hZG1pbiJ9.hP19DjZ6kesHndtm94GCJhc2UUnT7e5e5nkvo8OQB9Aamq-_axGh84o67LTUG3vD5sdaIz98vnzkMwZe-7_40Q&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=39ddaf67fe299bd4a4080cc0e4e65ff452f108c75dc62999b752e7506a06d901";
const COMT_URL = "http://0.0.0.0:9000/comtiles/germany-new4.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=D1VYDA8F0U350XVJGQAX%2F20220121%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220121T103420Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJEMVZZREE4RjBVMzUwWFZKR1FBWCIsImV4cCI6MTY0Mjc2NDg1NiwicGFyZW50IjoibWluaW9hZG1pbiJ9.jFn6TWfmpbOcSSHkWkTxoQubuM3pSdYbShNUayDPdxyQ1UBGQltES2v97Q8qB0-I4sn4MHGmJmqUZuBwK0rMIg&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=75b1b7eefc1c57bcea1e3e7a2db045c96ec589e9c9afb20dd594c259367758b8";

(async()=>{
    const {metadata, partialIndex, indexOffset, dataOffset} = await loadMetadataAndPartialIndex(COMT_URL);

    createMap(metadata, partialIndex, indexOffset, dataOffset, COMT_URL);
})();

const fragmentCache = new Map();

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
            //console.info("Requested tile not within the boundary ot the TileSet.");
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

                //TODO: europe calculates a  float
                const startOffset = parseInt(indexOffset + fragmentRange.startOffset);
                const endOffset = parseInt(indexOffset + fragmentRange.endOffset);
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

