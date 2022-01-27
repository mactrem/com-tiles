import fs from "fs";
import express from "express";
import cors from "cors";
import calculateRangeIndex from "./comtIndex.js";
import * as path from "path";
import vt from "@mapbox/vector-tile";
import Protobuf from 'pbf';
import {calculateIndexOffsetForTile} from "@com-tiles/utils";
//use --experimental-json-modules
import tilesJson from "./tiles.json";
import * as zlib from "zlib";

const fileName = path.resolve("./data/austria.cot")

//const stream = fs.createReadStream(fileName);

/*
* - read the first 500k of the index
* - load parts of the index in a specific area and cache
* */

const metadataStartIndex = 12;
const metadata = await readMetadata();
const bounds = metadata.metadata.bounds;
const indexBuffer = readIndex(metadata.metadataLength);

const app = express();
app.use(cors())

//TODO: get size from metadata document
const INDEX_ENTRY_SIZE = 8;

//Zurich -> 12/2144/1434 -> http://localhost:8080/tiles/12/2144/1434
app.get('/tiles/:z/:x/:y', (req, res) => {
    const zoom = parseInt(req.params.z, 10);
    const x = parseInt(req.params.x, 10);
    const y = parseInt(req.params.y, 10);

    //const index = calculateRangeIndex(bounds, zoom, x, y);
    //TODO: refactor metadata

    //convert xyz to tms
    const tmsY = 2** zoom - y - 1;
    const [byteOffset, indexOffset] = calculateIndexOffsetForTile(metadata.metadata, zoom, x, tmsY);
    const {offset, size} = indexBuffer[indexOffset];

    const tileOffset = metadataStartIndex + metadata.metadataLength + (indexBuffer.length * INDEX_ENTRY_SIZE) + offset;
    const tile = readTile(tileOffset, size)

    analyzeTile(tile);

    res.writeHead(200, {
        "Content-Type": "application/x-protobuf",
        "Content-Length": tile.length,
        "Content-Encoding": "gzip"
    });

    res.end(tile);
})

app.get('/tiles/tiles.json', (req, res) => {
    res.end(JSON.stringify(tilesJson));
})

app.listen(8080);

function analyzeTile(data){
    const result = zlib.unzipSync(data);
    const proto = new Protobuf(result);
    const tile = new vt.VectorTile(proto);

    console.log(tile);
}

function readMetadata(){
    const stream = fs.createReadStream(fileName);

    return new Promise(((resolve, reject) => {
        stream.on('data', chunk => {
            const metadataLength = chunk.readInt32LE(4);
            //TODO: check if metadata are lager then the 65k chunk size -> should be not possible
            //chunk.toString(encoding, start, end);
            const metadata = JSON.parse(chunk.toString("utf-8" , metadataStartIndex, metadataStartIndex + metadataLength));
            resolve({metadataLength, metadata});

            stream.destroy();
        });
    }));
}

function readIndex(metadataLength){
    const fd = fs.openSync(fileName, "r");
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 8);
    const indexLength = buffer.readUInt32LE(0);

    const indexBuffer = Buffer.alloc(indexLength);
    const offset = metadataStartIndex + metadataLength;
    fs.readSync(fd, indexBuffer, 0, indexLength, offset);

    const indexEntries = [];
    const numIndexEntries = indexBuffer.length / 8;
    for(let i = 0; i  < numIndexEntries; i++){
        const bufferOffset = i * 8;
        const offset =  indexBuffer.readUInt32LE(bufferOffset);
        const size = indexBuffer.readUInt32LE(bufferOffset + 4);
        indexEntries.push({offset, size});
    }

    return indexEntries;
}

function readTile(offset, size){
    const fd = fs.openSync(fileName, "r");
    const buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, offset);

    return buffer;
}
