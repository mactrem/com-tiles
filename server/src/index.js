import fs from "fs";
import express from "express";
import calculateRangeIndex from "./comtIndex.js";
//const calculateRangeIndex = require("./comtIndex");

const fileName = "../dist/test.cot";

const stream = fs.createReadStream(fileName);

/*
* - read the first 500k of the index
* - load parts of the index in a specific area and cache
* */

const metadataStartIndex = 12;
const metadata = await readMetadata();
const bounds = metadata.metadata.bounds;
const indexBuffer = readIndex(metadata.metadataLength);


const app = express();

//Zurich -> 12/2144/1434
app.get('/tiles/:z/:x/:y', (req, res) => {
    const zoom = parseInt(req.params.z, 10);
    const x = parseInt(req.params.x, 10);
    const y = parseInt(req.params.y, 10);

    const index = calculateRangeIndex(bounds, zoom, x, y);
    const indexOffset = index * 8;
    const startIndex = indexBuffer.readUInt32LE(indexOffset);
    const size = indexBuffer.readUInt32LE(indexOffset + 4);

    const tileOffset = metadataStartIndex + metadata.metadataLength + indexBuffer.length + startIndex;
    const tile = readTile(tileOffset, size)

    res.send("Test");

    res.writeHead(200, {
        "Content-Type": "application/x-protobuf",
        "Content-Length": tile.length
    });

    res.end(tile);
})

app.listen(8080);

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

    return indexBuffer;
}

function readTile(offset, size){
    const fd = fs.openSync(fileName, "r");
    const buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, offset);

    return buffer;
}
