import sqlite3 from "sqlite3";
import fs from "fs";
import {WebMercatorQuadMetadataBuilder} from "./metadataBuilder";
import * as path from "path";
import {Metadata} from "@com-tiles/spec";
import {createIndexInRowMajorOrder, IndexEntry} from "./indexFactory";
import {MBTilesRepository} from "./mbTilesRepository";

const fileName = path.join(__dirname, "../test.cot")
const mbTilesFile = path.resolve("data/zurich.mbtiles");

const magic = "COMT";

(async()=>{
    const db = new sqlite3.Database(mbTilesFile)
    const metadata = await createMetadata(db);
    //const tiles = await getTilesByRowMajorOrder(db);
    const repo = new MBTilesRepository(mbTilesFile);

    //TODO: return index and tile via generator and write batches at once in a file
    //TODO: not all tiles in the lower zoom levels are queried because the bounds are calculated
    const index = await createIndexInRowMajorOrder(repo, metadata.tileMatrixSet.tileMatrixSet)

    createComTileArchive(fileName, metadata, index);
})();

function createComTileArchive(fileName: string, metadata: Metadata, index: IndexEntry[]){
    const stream = fs.createWriteStream(fileName, { encoding: 'binary' });

    const metadataJson = JSON.stringify(metadata);
    const indexLengthInBytes = index.length * (4 + metadata.tileOffsetBytes);
    writeHeader(stream, metadataJson.length, indexLengthInBytes);
    writeMetadata(stream, metadataJson);
    writeIndex(stream, indexLengthInBytes, index);
}

function writeHeader(stream: fs.WriteStream, metadataLength: number, indexLength: number){
    stream.write(magic);
    const buffer = Buffer.alloc(4);
    //TODO: the other stuff also has to be written in le byte order
    buffer.writeUInt32LE(metadataLength);
    stream.write(buffer);
    //TODO: Index size can be variable -> 4 or 5 bytes
    const indexLengthBuffer = Buffer.alloc(4);
    indexLengthBuffer.writeUInt32LE(indexLength);
    stream.write(indexLengthBuffer);
}

function writeMetadata(stream: fs.WriteStream, metadataJson: string){
    stream.write(metadataJson, "utf-8" );
}

function writeIndex(stream: fs.WriteStream, indexLengthInBytes: number, index: IndexEntry[]){
    const indexBuffer = Buffer.alloc(indexLengthInBytes);
    for(let i = 0; i< index.length; i++){
        const offset = i * 8;
        indexBuffer.writeUInt32LE(index[i].offset, offset);
        //how to write 5 or more bytes to a buffer
        //TODO: set offsetSize in the metadata document
        //TODO: offset is count at beginning of the data section -> write in the specification
        //TODO: with 4 bytes only 4GB can be stored -> rename from tileOffsetBytes to tile data size in bytes?
        indexBuffer.writeUInt32LE(index[i].size, offset + 4);
    }

    stream.write(indexBuffer);
}

/*
* - create metadata
*   -> bbox
*   -> per Zoom clusterSize (e.g. 4096), startIndexColumn/Row, numColumns/Rows, cluster order defaults to Hilbert Curve
* - write magic
* - write metadata size
* - write index and data in separate buffer in parallel
* - merge index and data buffer
* */
function createComTile(fileName, metadata, index, tiles){
    //TODO: add magic at beginning of the file
    //TODO: add metdata
    //TOTO: use buffer for endianness -> writeInt32LE
    const stream = fs.createWriteStream(fileName, { encoding: 'binary' });

    const metadataJson = JSON.stringify(metadata);

    //TODO: could be more then 8 bytes
    const indexBuffer = Buffer.alloc(tiles.length * 8);
    for(let i = 0; i< index.length; i++){
        const offset = i * 8;
        indexBuffer.writeUInt32LE(index[i].offset, offset);
        indexBuffer.writeUInt32LE(index[i].size, offset + 4);
    }

    //write magic
    stream.write(magic);

    //write metadata and index size
    const buffer = Buffer.alloc(4);
    //TODO: the other stuff also has to be written in le byte order
    buffer.writeUInt32LE(metadataJson.length);
    stream.write(buffer);
    const indexLengthBuffer = Buffer.alloc(4);
    indexLengthBuffer.writeUInt32LE(indexBuffer.length);
    stream.write(indexLengthBuffer);

    //Add metadata
    stream.write(metadataJson, "utf-8" );
    //Add index
    stream.write(indexBuffer);

    //only write tiles which are intersecting with the bounding box
    for(const tile of tiles){
        stream.write(tile);
    }

    stream.on('error', (e) => {
        console.log(e);
    });
    /*stream.on('finish', () => {
    stream.write(tiles);
});*/

    stream.end();
}

function buildIndex(tiles, tileMatrixSet: Metadata["tileMatrixSet"]["tileMatrixSet"]){
    const index = [];
    let offset = 0;


    //TODO: cluster tiles for every zoom level -> clusterWidth and clusterHeight
    //TODO: use ArrayBuffer
    //TODO: caclulte fragments and sparse fragements
    for(const tile of tiles){
        const size = tile.length;
        index.push({offset, size});
        offset += size;
    }

    return index;
}

/**
* Ordered by zoomLevel, tileRow and tileColumn in ascending order which is row-major order
* */
function getTilesByRowMajorOrder(db: sqlite3.Database){
    return new Promise((resolve, reject) => {
        //TODO: batch read
        db.all("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles ORDER BY zoom_level, tile_row, tile_column ASC;", (err, tiles) => {
            if(err){
                reject(err);
                return;
            }

            resolve(tiles.map(tile => tile.tile_data));
        });
    })
}

function getNumberOfTiles(db: sqlite3.Database){
    //return util.promisify(db.get)("SELECT count(*) from map;");
    return new Promise((resolve, reject) => {
        db.get("SELECT count(*) from map;", (err, row) => {
            resolve(row);
        });
    });
}

function createMetadata(db: sqlite3.Database): Promise<Metadata>{
    return new Promise((resolve, reject) => {
        db.all("SELECT name, value FROM metadata;", (err, rows) => {
            if(err){
                reject(err);
                return;
            }

            const metadataBuilder = new WebMercatorQuadMetadataBuilder();
            for(const row of rows){
                switch(row.name){
                    case "name":
                        metadataBuilder.setName(row.value);
                        break;
                    case "bounds":
                        metadataBuilder.setBoundingBox(row.value.split(",").map(value => parseFloat(value.trim())));
                        break;
                    case "minzoom":
                        metadataBuilder.setMinZoom(parseInt(row.value, 10));
                        break;
                    case "maxzoom":
                        metadataBuilder.setMaxZoom(parseInt(row.value, 10));
                        break;
                    case "format":
                        metadataBuilder.setTileFormat(row.value);
                        break;
                    case "attribution":
                        metadataBuilder.setAttribution(row.value);
                        break;
                    case "json":
                        metadataBuilder.setLayers(row.value);
                        break;
                }
            }

            //metadataBuilder.set
            const metadata = metadataBuilder.build();
            resolve(metadata);
        });
    });
}


