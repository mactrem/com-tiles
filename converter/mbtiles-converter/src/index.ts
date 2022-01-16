import sqlite3 from "sqlite3";
import fs from "fs";
import {WebMercatorQuadMetadataBuilder} from "./metadataBuilder";
import * as path from "path";
import {Metadata} from "@com-tiles/spec";
import {createIndexInRowMajorOrder, IndexEntry} from "./indexFactory";
import {MBTilesRepository} from "./mbTilesRepository";
import {convertNumberToBufferLE} from "./utils";


/*
* austria.cot -> 2.9GB -> austria.cot compressed -> 2.8 -> no real impact when compressing vector tile
* austria metadata -> 13 kb uncompressed -> 1kb compressed
* austria index -> 762kb uncompressed -> 496kb compressed -> 1/3 reduced in size
* europe index -> 147Mb uncompressed -> 56MB compressed -> 2/3 reduced in size
*
* 512kb -> 220 milliseconds to load in tests
*
* Header (compressed) -> magic, version, metadataLength, fragmentTableLength, indexLength, metadata, fragmentTable
* -> compressed header without fragmentTable -> 1kb
* -> fragmentTable without compression 390kb -> with compression 260kb?
* Body -> index (fragments compressed), data
*  -> index 0-8 -> 256kb uncompressed -> 170kb compressed
*  -> store indexTable and index overview (0-8) in one file?
*       -> one file to fetch from s3 -> all information to start
*       -> data file then has only index with fragments
*
* -> Header File
*   -> holds all initial information
*   -> smaller then 500kb
* -> Data File
*   -> holds only fragments
*   -> compressed index fragments
*
* -> Fragment
*   -> 4^6 -> 4096
*   -> 12kb -> compressed 8.2kb? -> does this really bring any advantage?
*   -> 7kb -> 25 milliseconds to load in tests
*   -> when ordered in row major four max 4 fragments only 2 http range requests needed
*       -> 24kb -> 8-16kb compressed?
*
*  -> transfer rate
*    -> Cdn more important then index fragments
*    -> The real enemy of a web page's performance is not the number of bytes transferred; rather, it is network latency
*    -> 5 Mb/s connection (the average connection speed in the US is a little over that) with a ping time to your server of 80ms
*       -> 1x 20 kB files:  80ms latency + 31ms transfer time = 111ms
*       -> 2x 4 kB files:  160ms latency + 13ms transfer time = 173ms
*    -> the latency has decreased by around 30% (from 80ms to approx. 55ms) but the average download rate (mobile)
*       has increased up to 23 MB/s for the lowest rated operator
* */
//const fileName = path.join(__dirname, "../europe.cot")
//const mbTilesFile = path.resolve("data/europe.mbtiles");
const fileName = path.join("/Users/tremmelmarkus/Documents/GitHub/com-tiles/data/germany-new2.cot")
const mbTilesFile = path.resolve("/Users/tremmelmarkus/Documents/GitHub/com-tiles/data/austria.mbtiles");

console.info(fileName);
console.info(mbTilesFile);

const MAGIC = "COMT";
//const VERSION = 1;


/*
//convert number to le bytes e.g. 290
const buffer = Buffer.alloc(5);
//buffer.writeUInt8()
//buffer[0] = 10;
const num = 290;
const hex = num.toString(16);
buffer[0] = 0x01;
//buffer.writeBigInt64LE()

const buff = convertNumberToBufferLE(2000, 5);
console.log(buff);*/


(async()=>{
    console.log(process.memoryUsage());
    console.log("Start converting tiles.");

    const db = new sqlite3.Database(mbTilesFile)
    const metadata = await createMetadata(db);
    //const tiles = await getTilesByRowMajorOrder(db);
    const repo = new MBTilesRepository(mbTilesFile);

    //TODO: return index and tile via generator and write batches at once in a file
    //TODO: not all tiles in the lower zoom levels are queried because the bounds are calculated
    const index = await createIndexInRowMajorOrder(repo, metadata.tileMatrixSet.tileMatrixSet)

    await createComTileArchive(fileName, metadata, index, repo);

    console.log("Finished converting tiles.");
})();

async function createComTileArchive(fileName: string, metadata: Metadata, index: IndexEntry[], repo: MBTilesRepository){
    const stream = fs.createWriteStream(fileName, { encoding: 'binary' });

    const metadataJson = JSON.stringify(metadata);
    const defaultTileSize = 4;
    const indexLengthInBytes = index.length * (defaultTileSize + metadata.tileOffsetBytes);
    writeHeader(stream, metadataJson.length, indexLengthInBytes);
    writeMetadata(stream, metadataJson);
    console.info("Metadata created.");

    writeIndex(stream, indexLengthInBytes, index);
    console.info("Index created.");


    await writeTiles(stream, index, repo);
}

function writeHeader(stream: fs.WriteStream, metadataLength: number, indexLength: number){
    stream.write(MAGIC);
    //TODO: add version
    //const buffer = Buffer.alloc(4);
    //buffer.writeUInt32LE(VERSION);
    //stream.write(buffer);
    //TODO: the other stuff also has to be written in le byte order
    const metadataLengthBuffer = Buffer.alloc(4);
    metadataLengthBuffer.writeUInt32LE(metadataLength);
    stream.write(metadataLengthBuffer);
    //TODO: Index size can be variable -> 4 or 5 bytes -> 4 bytes only 4G max index size
    //const indexLengthBuffer = Buffer.alloc(4);
    //indexLengthBuffer.writeUInt32LE(indexLength)
    const indexLengthBuffer = convertNumberToBufferLE(indexLength, 5);
    stream.write(indexLengthBuffer);
}

function writeMetadata(stream: fs.WriteStream, metadataJson: string){
    stream.write(metadataJson, "utf-8" );
}

function writeIndex(stream: fs.WriteStream, indexLengthInBytes: number, index: IndexEntry[]){
    const indexBuffer = Buffer.alloc(indexLengthInBytes);
    //Quick and dirty implementation -> data section can be max 4 GB and also tile size should be 3 bytes per default
    for(let i = 0; i< index.length; i++){
        const offset = i * 9;
        convertNumberToBufferLE(index[i].offset, 5).copy(indexBuffer, offset);
        //TODO: set offsetSize in the metadata document
        //TODO: offset is count at beginning of the data section -> write in the specification
        //TODO: with 4 bytes only 4GB can be stored -> rename from tileOffsetBytes to tile data size in bytes?
        /*
        * - Every fragment has a offset field
        * - Every index entry has a size
        * */
        indexBuffer.writeUInt32LE(index[i].size, offset + 5);
    }

    stream.write(indexBuffer);
}

async function writeTiles(stream: fs.WriteStream, index: IndexEntry[], tileRepository: MBTilesRepository){
    //const lastTile = index[index.length-1];
    //const dataBufferSize = lastTile.offset + lastTile.size;
    //TODO: doesn't scale
    //const dataBuffer = Buffer.alloc(dataBufferSize);

    //let offset = 0;
    for(const {zoom, row, column} of index){
        const {data} = await tileRepository.getTile(zoom, row, column);
        const tileBuffer = Buffer.from(data);
        //tileBuffer.copy(dataBuffer, offset);
        //offset += tileBuffer.length;

        //TODO: batch query and batch write
        stream.write(tileBuffer);
    }

    //stream.write(dataBuffer);
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

    stream.write(MAGIC);

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


