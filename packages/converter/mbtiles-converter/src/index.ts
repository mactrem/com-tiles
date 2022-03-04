#!/usr/bin/env node
import fs from "fs";
import program from "commander";
import { MBTilesRepository } from "./mbTilesRepository";
import { calculateNumTiles, toBytesLE } from "./utils.js";
import pkg from "../package.json";
import MapTileProvider from "./tileProvider";
import Logger from "./logger";

program
    .version(pkg.version)
    .option("-i, --inputFilePath <path>", "specify path and filename of the MBTiles database")
    .option("-o, --outputFilePath <path>", "specify path and filename of the COMT archive file")
    .parse(process.argv);

const options = program.opts();
if (!options.inputFilePath || !options.outputFilePath) {
    throw new Error("Please specify the inputFilePath and the outputFilePath.");
}

const MAGIC = "COMT";
const VERSION = 1;
const INDEX_ENTRY_SIZE_BYTE_LENGTH = 4;

(async () => {
    const logger = new Logger();
    const mbTilesFilename = options.inputFilePath;
    const comTilesFilename = program.outputFilePath;
    logger.info(`Converting the MBTiles file ${mbTilesFilename} to a COMTiles archive.`);
    await createComTileArchive(mbTilesFilename, comTilesFilename, logger);
    logger.info(`Successfully saved the COMTiles archive in ${comTilesFilename}.`);
})();

async function createComTileArchive(mbTilesFilename: string, comTilesFileName: string, logger: Logger) {
    const stream = fs.createWriteStream(comTilesFileName, {
        encoding: "binary",
        highWaterMark: 1_000_000,
    });

    const repo = await MBTilesRepository.create(mbTilesFilename);
    const metadata = await repo.getMetadata();
    const tileMatrixSet = metadata.tileMatrixSet.tileMatrix;
    const metadataJson = JSON.stringify(metadata);

    const indexEntryByteLength = INDEX_ENTRY_SIZE_BYTE_LENGTH + metadata.tileOffsetBytes;
    const numIndexEntries = calculateNumTiles(tileMatrixSet);
    const indexByteLength = indexEntryByteLength * numIndexEntries;

    logger.info("Writing the header and metadata to the COMTiles archive.");
    writeHeader(stream, metadataJson.length, indexByteLength);
    writeMetadata(stream, metadataJson);

    logger.info("Writing the index to the COMTiles archive.");
    const tileProvider = new MapTileProvider(repo, tileMatrixSet);
    await writeIndex(stream, tileProvider, indexEntryByteLength);

    logger.info("Writing the map tiles to the the COMTiles archive.");
    await writeTiles(stream, tileProvider);

    stream.end();
    await repo.dispose();
}

function writeHeader(stream: fs.WriteStream, metadataByteLength: number, indexByteLength: number) {
    stream.write(MAGIC);

    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32LE(VERSION);
    stream.write(versionBuffer);

    const metadataLengthBuffer = Buffer.alloc(4);
    metadataLengthBuffer.writeUInt32LE(metadataByteLength);
    stream.write(metadataLengthBuffer);

    const indexLengthBuffer = toBytesLE(indexByteLength, 5);
    stream.write(indexLengthBuffer);
}

function writeMetadata(stream: fs.WriteStream, metadataJson: string) {
    stream.write(metadataJson, "utf-8");
}

async function writeIndex(stream: fs.WriteStream, tileProvider: MapTileProvider, indexEntryByteLength: number) {
    const numIndexEntries = calculateNumTiles(tileProvider.tileMatrixSet);
    const indexBufferSize = indexEntryByteLength * numIndexEntries;
    const indexBuffer: Buffer = Buffer.alloc(indexBufferSize);

    const tiles = tileProvider.getTilesInRowMajorOrder();

    const tileOffsetByteLength = indexEntryByteLength - 4;
    let indexBufferOffset = 0;
    let dataSectionOffset = 0;
    for await (const tile of tiles) {
        const tileLength = tile.byteLength;
        const offset = tileLength ? dataSectionOffset : 0;
        /* if the tile is missing in the dataset set size and offset to zero */
        toBytesLE(offset, tileOffsetByteLength).copy(indexBuffer, indexBufferOffset);
        indexBuffer.writeUInt32LE(tileLength, indexBufferOffset + tileOffsetByteLength);
        indexBufferOffset += indexEntryByteLength;
        dataSectionOffset += tileLength;
    }

    stream.write(indexBuffer);
}

async function writeTiles(stream: fs.WriteStream, tileProvider: MapTileProvider) {
    const tiles = tileProvider.getTilesInRowMajorOrder();

    /* Batching the tile writes did not bring the expected performance gain because allocating the buffer
     * for the tile batches was to expensive. So we simplified again to single tile writes. */
    for await (const tile of tiles) {
        const tileLength = tile.byteLength;
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
