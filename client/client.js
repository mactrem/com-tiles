import {calculateIndexOffsetForTile} from "client/converter";

calculateIndexOffsetForTile();
//TODO: attribute with pmtiles
let re = new RegExp(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/)
maplibregl.addProtocol('comt', (params, callback) => {
    let result = params.url.match(re);
    const comTilesUrl = result[1]
    const z = result[2]
    const x = result[3]
    const y = result[4]

    //get data offset from partial index -> use utils lib -> convert to tms from xyz for using the utils lib

    //callback(null,arr,null,null)

    return { cancel: () => { console.log("Cancel not implemented") } };
});

/* const map = new maplibregl.Map({
    container: 'map',
    style: 'http://localhost:8081/data/style.json',
    center: [8.529727, 47.371622],
    zoom: 10
});*/

//TODO: size to small when vector layers are included
const MAX_METADATA_SIZE = 1<<15; //32768;
const INITIAL_CHUNK_SIZE = 2 ** 19; //512k

fetch("http://0.0.0.0:9000/comtiles/test.cot?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=3UHM90BI91WNFRYLW1C8%2F20220105%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220105T144552Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiIzVUhNOTBCSTkxV05GUllMVzFDOCIsImV4cCI6MTY0MTM5NzUzOCwicGFyZW50IjoibWluaW9hZG1pbiJ9.hVTWRT4vcD2rc9LYItyZzbHbQGQWGb96-FNt586JMng3HMRBzzz6-vTbBNJCBwlyyvAw8ekraqKMm5XnRkkTEw&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=39e41ca2f8dc435c3f9bfe9d5d575cccdb289200500f298532d2186303e41db7", {
    headers: {
        //'content-type': 'multipart/byteranges',
        //TODO: what should be the default size for fetching the metadata
        //'range': `bytes=0-${MAX_METADATA_SIZE-1}`,
        'range': `bytes=0-${INITIAL_CHUNK_SIZE-1}`,
    },
}).then(response => {
    if (response.ok) {
        return response.arrayBuffer();
    }
}).then(buffer => {
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

    const tileMatrixSet = metadata.tileMatrixSet;
    //TODO: check for tileMatrixCRS and RowMajor
    const limits = tileMatrixSet.tileMatrixSet;

    //get first 500k of the index
    //build an index LRU cache where the initial 0-8 and the further requested tiles are stored

    const indexOffset = 12 + metadataSize;
    const indexEntrySize = 8;
    //get rid of a potential last incomplete index offset
    const endOffset = indexOffset + Math.floor((INITIAL_CHUNK_SIZE - indexOffset) / indexEntrySize) * indexEntrySize;
    const partialIndex = buffer.slice(indexOffset, endOffset);

});