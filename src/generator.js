import sqlite3 from "sqlite3";
import fs from "fs";
//import util from "util";

const fileName = "../dist/test.cot"
const mbTilesFile = "../data/zurich.mbtiles";
const db = new sqlite3.Database(mbTilesFile);

const magic = "COMT";
const metadata = await getMetadata();
const numTiles = await getNumberOfTiles();
const numIndexEntries = numTiles;
const tiles = await getTiles();
const index = buildIndex(tiles);

createComTile(fileName, metadata, index, tiles);

debugger;

function createComTile(fileName, metadata, index, tiles){
    //TODO: add magic at beginning of the file
    //TODO: add metdata

    //TOTO: use buffer for endianness -> writeInt32LE
    const stream = fs.createWriteStream(fileName, { encoding: 'binary' });

    //write magic
    stream.write(magic);

    //Add metadata
    //stream.write(metadata.minZoom);
    //stream.write(metadata.maxZoom);
    //stream.write(new Float64Array([metadata.bounds]));
    //const buffer = Buffer.alloc(32);
    //buffer.write
    /*
    * for(const coord of metadata.bounds){
        stream.write(coord);
    }
    * */
    const metadataJson = JSON.stringify(metadata);
    const indexBuffer = Buffer.alloc(tiles.length * 8);
    for(let i = 0; i< index.length; i++){
        const offset = i * 8;
        indexBuffer.writeUInt32LE(index[i].offset, offset);
        indexBuffer.writeUInt32LE(index[i].size, offset + 4);
    }

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
    for(const tile of tiles){
        const size = tile.length;
        index.push({offset, size});
        offset += size;
    }

    return index;
}

function getTiles(){
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

function getNumberOfTiles(){
    //return util.promisify(db.get)("SELECT count(*) from map;");
    return new Promise((resolve, reject) => {
        db.get("SELECT count(*) from map;", (err, row) => {
            resolve(row);
        });
    });
}

function getMetadata(){
    return new Promise((resolve, reject) => {
        db.all("SELECT name, value FROM metadata;", (err, rows) => {
            if(err){
                reject(err);
                return;
            }

            const metadata = {};
            for(const row of rows){
                const name = row.name;
                switch(row.name){
                    case "bounds":
                        metadata.bounds = row.value.split(",").map(value => parseFloat(value.trim()));
                        break;
                    case "minzoom":
                        metadata.minZoom = parseInt(row.value, 10);
                        break;
                    case "maxzoom":
                        metadata.maxZoom = parseInt(row.value, 10);
                        break;
                }
            }
            resolve(metadata);
        });
    });
}

class Metadata{

    constructor(bounds, minZoom, maxZoom) {
        this.bounds = bounds;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
    }

    get bounds() {
        return this.bounds;
    }

    get minZoom(){
        return this.minZoom;
    }

    get maxZoom(){
        return this.maxZoom;
    }
}


