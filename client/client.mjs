import {calculateIndexOffsetForTile} from "./converter.mjs";
import pako from "./node_modules/pako/dist/pako.esm.mjs"

const COMT_URL = "http://0.0.0.0:9000/comtiles/test.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=3718FS09AU0CV3T4OGWN%2F20220105%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220105T183958Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiIzNzE4RlMwOUFVMENWM1Q0T0dXTiIsImV4cCI6MTY0MTQxMTU5MywicGFyZW50IjoibWluaW9hZG1pbiJ9.bQ1bU0FLKvws3WhiFYFri7nVdYe4aFbADy9aiPxC1x4Z1soWHCKmfcSfy6083e6eIrMaIqzj-_TlB2NTuKvvJg&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=7ed22d6a8f1be00b7fb99e19137e04a9197b5323299cbef7e9a8e0280fc300ac";

(async()=>{
    const {metadata, partialIndex, dataOffset} = await loadMetadataAndPartialIndex(COMT_URL);

    createMap(metadata, partialIndex, dataOffset, COMT_URL);
})();


async function createMap(metadata, partialIndex, dataOffset, comtUrl){
    //TODO: attribute with pmtiles
    let re = new RegExp(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/)
    maplibregl.addProtocol('comt', (params, callback) => {
        let result = params.url.match(re);
        const comTilesUrl = result[1];
        const z = result[2];
        const x = result[3];
        const y = result[4];

        //get data offset from partial index -> use utils lib -> convert to tms from xyz for using the utils lib
        const tmsY = 2**z - y -1;
        //const [offset, index] = calculateIndexOffsetForTile(metadata, z, x, tmsY);
        const [offset, index] = calculateIndexOffsetForTile(metadata, 0, 0,0 );

        if(offset >= partialIndex.byteLength){
            throw Error("Fetching index fragments not implemented yet.");
        }

        const indexView = new DataView(partialIndex);
        const tileOffset = indexView.getUint32(offset, true);
        const tileSize = indexView.getUint32(offset + 4, true);

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
            const unzippedBuffer = pako.ungzip(arr);
            callback(null, unzippedBuffer, null, null);
        });

        //return { cancel: () => { console.log("Cancel not implemented") } };
    });

    const map = new maplibregl.Map({
        container: "map",
        style: "http://localhost:8081/data/style.json",
        center: [8.529727, 47.371622],
        zoom: 10
    });
}

async function loadMetadataAndPartialIndex(url){
    //TODO: size to small when vector layers are included
    const maxMetadataSize = 1<<15; //32768;
    const initialChunkSize = 2 ** 19; //512k

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
    const indexSize = dataView.getUint32(8, true);
    const metadataStartIndex = 12;
    const metadataBuffer = buffer.slice(metadataStartIndex, (metadataStartIndex + metadataSize));
    const textDecoder = new TextDecoder("utf-8");
    const metadataDocument = textDecoder.decode(metadataBuffer);
    const metadata = JSON.parse(metadataDocument);
    //const tileMatrixSet = metadata.tileMatrixSet;
    //TODO: check for tileMatrixCRS and RowMajor
    //const limits = tileMatrixSet.tileMatrixSet;

    //get first 500k of the index
    //build an index LRU cache where the initial 0-8 and the further requested tiles are stored

    const indexOffset = 12 + metadataSize;
    const indexEntrySize = 8;
    //get rid of a potential last incomplete index offset
    const endOffset = indexOffset + Math.floor((initialChunkSize - indexOffset) / indexEntrySize) * indexEntrySize;
    const partialIndex = buffer.slice(indexOffset, endOffset);

    const dataOffset = indexOffset + indexSize;
    return {metadata, partialIndex, dataOffset};
}

