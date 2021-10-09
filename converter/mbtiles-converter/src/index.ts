import sqlite3 from "sqlite3";
import fs from "fs";
import {OSMTileMetadataBuilder} from "./metadata";
import * as path from "path";

const fileName = path.join(__dirname, "../test.cot")
const mbTilesFile = path.resolve("data/zurich.mbtiles");

const magic = "COMT";

(async()=>{
    const db = new sqlite3.Database(mbTilesFile)

    const metadata = await createMetadata(db);
    //const numTiles = await getNumberOfTiles(db);
    const tiles = await getTiles(db);

    const index = buildIndex(tiles);
    createComTile(fileName, metadata, index, tiles);
})();

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

function buildIndex(tiles){
    const index = [];
    let offset = 0;

    //TODO: cluster tiles for every zoom level -> clusterWidth and clusterHeight
    for(const tile of tiles){
        const size = tile.length;
        index.push({offset, size});
        offset += size;
    }

    return index;
}

function getTiles(db: sqlite3.Database){
    return new Promise((resolve, reject) => {
        //TODO: batch read
        //TODO: check if tms or xyz order for the y-axis -> here tms is assumed
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

function createMetadata(db: sqlite3.Database){
    return new Promise((resolve, reject) => {
        db.all("SELECT name, value FROM metadata;", (err, rows) => {
            if(err){
                reject(err);
                return;
            }

            const metadataBuilder = new OSMTileMetadataBuilder();
            for(const row of rows){
                switch(row.name){
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
                }
            }

            const metadata = metadataBuilder.build();
            resolve(metadata);
        });
    });
}


