#!/usr/bin/env node
import fs from "fs";
import program from "commander";
import { MBTilesRepository } from "./mbTilesRepository";
import { calculateNumTiles, toBytesLE } from "./utils.js";
import pkg from "../package.json";
import MapTileProvider, { DataContent, Tile } from "./tileProvider";
import Logger from "./logger";
import { ComtIndex } from "@com-tiles/provider";
import { Metadata } from "@com-tiles/spec";

program
    .version(pkg.version)
    .option("-i, --inputFilePath <path>", "specify path and filename of the MBTiles database")
    .option("-o, --outputFilePath <path>", "specify path and filename of the COMT archive file")
    .option(
        "-m, --maxZoomDbQuery <number>",
        "specify to which zoom level the TileMatrixLimits should be queried from the db and not calculated based on the bounds",
    )
    .parse(process.argv);

const options = program.opts();
if (!options.inputFilePath || !options.outputFilePath) {
    throw new Error("Please specify the inputFilePath and the outputFilePath.");
}

const MAGIC = "COMT";
const VERSION = 1;
const INDEX_ENTRY_SIZE_BYTE_LENGTH = 4;
const MAX_ZOOM_DB_QUERY = parseInt(options.maxZoomDbQuery) || 8;

(async () => {
    const logger = new Logger();
    const mbTilesFilename = options.inputFilePath;
    const comTilesFilename = program.outputFilePath;

    logger.info(`Converting the MBTiles file ${mbTilesFilename} to a COMTiles archive.`);
    await createComTileArchive(mbTilesFilename, comTilesFilename, logger);
    logger.info(`Successfully saved the COMTiles archive in ${comTilesFilename}.`);
})();

async function createComTileArchive(mbTilesFilename: string, comTilesFileName: string, logger: Logger) {
    const repo = await MBTilesRepository.create(mbTilesFilename);
    //TODO: on planet scale -> maxColumn 1 to much
    const metadata = await repo.getMetadata();
    /**
     * Query the TileMatrixLimits for the lower zoom levels from the db.
     * It's common to have more tiles as an overview in the lower zoom levels then specified in the bounding box of the MBTiles metadata.
     * This is a trade off because querying the limits for all zoom levels from the db takes very long.
     */
    const filteredTileMatrixSet = metadata.tileMatrixSet.tileMatrix.filter(
        (tileMatrix) => tileMatrix.zoom <= MAX_ZOOM_DB_QUERY,
    );
    for (const tileMatrix of filteredTileMatrixSet) {
        tileMatrix.tileMatrixLimits = await repo.getTileMatrixLimits(tileMatrix.zoom);
    }

    const tileMatrixSet = metadata.tileMatrixSet.tileMatrix;
    const metadataJson = JSON.stringify(metadata);

    const indexEntryByteLength = INDEX_ENTRY_SIZE_BYTE_LENGTH + metadata.tileOffsetBytes;
    const numIndexEntries = calculateNumTiles(tileMatrixSet);
    const indexByteLength = indexEntryByteLength * numIndexEntries;

    const stream = fs.createWriteStream(comTilesFileName, {
        encoding: "binary",
        highWaterMark: 1_000_000,
    });

    logger.info("Writing the header and metadata to the COMTiles archive.");
    writeHeader(stream, metadataJson.length, indexByteLength);
    writeMetadata(stream, metadataJson);

    const tileProvider = new MapTileProvider(repo, tileMatrixSet);
    logger.info("Writing the index to the COMTiles archive.");
    await writeIndex(stream, tileProvider, metadata, indexEntryByteLength);

    logger.info("Writing the map tiles to the the COMTiles archive.");
    await writeTiles(stream, tileProvider);

    stream.end();
    await repo.dispose();

    const writeStream = fs.createWriteStream(comTilesFileName, { flags: "r+", start: 12 });
    const indexLengthBuffer = toBytesLE(indexByteLengthCalculated, 5);
    writeStream.write(indexLengthBuffer);
    console.log("Diff: ", indexByteLengthCalculated - indexByteLength);
}

let dataSectionStart = 0;
function writeHeader(stream: fs.WriteStream, metadataByteLength: number, indexByteLength: number) {
    stream.write(MAGIC);

    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32LE(VERSION);
    stream.write(versionBuffer);

    const metadataLengthBuffer = Buffer.alloc(4);
    metadataLengthBuffer.writeUInt32LE(metadataByteLength);
    stream.write(metadataLengthBuffer);
    console.log("metadata: ", metadataByteLength);
    dataSectionStart = 17 + metadataByteLength;

    const indexLengthBuffer = toBytesLE(indexByteLength, 5);
    stream.write(indexLengthBuffer);

    console.log("indexLength ", indexByteLength);
}

function writeMetadata(stream: fs.WriteStream, metadataJson: string) {
    stream.write(metadataJson, "utf-8");
}

let indexByteLengthCalculated = 0;
async function writeIndex(
    stream: fs.WriteStream,
    tileProvider: MapTileProvider,
    metadata: Metadata,
    indexEntryByteLength: number,
) {
    const comtIndex = new ComtIndex(metadata);
    const tiles = tileProvider.getTilesInRowMajorOrder(DataContent.SIZE);

    const tileOffsetByteLength = indexEntryByteLength - 4;
    let dataSectionOffset = 0;
    let previousIndex = 0;
    let j = 0;
    for await (const { zoom, column, row, size: tileLength } of tiles) {
        const { index: currentIndex } = comtIndex.calculateIndexOffsetForTile(zoom, column, row);
        //TODO: also handle the first tile if missing
        const padding = currentIndex - previousIndex - 1;
        /* Add a padding in the index for the missing tiles in the MBTiles database */
        if (padding > 0) {
            for (let i = 0; i < padding; i++) {
                //console.info(padding);
                await writeIndexEntry(stream, 0, 0, tileOffsetByteLength, indexEntryByteLength);
                j++;
            }
        }

        await writeIndexEntry(stream, dataSectionOffset, tileLength, tileOffsetByteLength, indexEntryByteLength);

        dataSectionOffset += tileLength;
        previousIndex = currentIndex;
        j++;
    }

    indexByteLengthCalculated = j * indexEntryByteLength;
    dataSectionStart += indexByteLengthCalculated;
    console.log("DataSectionStart: ", dataSectionStart);
}

async function writeIndexEntry(
    stream: fs.WriteStream,
    offset: number,
    tileLength: number,
    tileOffsetByteLength: number,
    indexEntryByteLength: number,
): Promise<void> {
    const buffer = Buffer.alloc(indexEntryByteLength);
    toBytesLE(offset, tileOffsetByteLength).copy(buffer, 0);
    buffer.writeUInt32LE(tileLength, tileOffsetByteLength);

    const canContinue = stream.write(buffer);
    if (!canContinue) {
        await new Promise((resolve) => {
            stream.once("drain", resolve);
        });
    }
}

async function writeTiles(stream: fs.WriteStream, tileProvider: MapTileProvider) {
    const tiles = tileProvider.getTilesInRowMajorOrder(DataContent.TILE);

    /* Batching the tile writes did not bring the expected performance gain because allocating the buffer
     * for the tile batches was to expensive. So we simplified again to single tile writes. */
    for await (const { data: tile } of tiles) {
        const tileLength = tile.byteLength;

        if (tileLength === 0) {
            debugger;
        }

        if (tileLength > 0) {
            const tileBuffer = Buffer.from(tile);
            const canContinue = stream.write(tileBuffer);
            if (!canContinue) {
                await new Promise((resolve) => {
                    stream.once("drain", resolve);
                });
            }
        }
    }
}
