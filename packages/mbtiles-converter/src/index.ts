#!/usr/bin/env node
import fs from "fs";
import { program } from "commander";
import { Metadata } from "@com-tiles/spec";
import { MBTilesRepository } from "./mbTilesRepository";
import { calculateNumTiles, toBytesLE } from "./utils.js";
import pkg from "../package.json";
import MapTileProvider, { RecordType } from "./tileProvider";
import Logger from "./logger";
import pako from "pako";
import { ComtIndex } from "@com-tiles/provider";

program
    .version(pkg.version)
    .option("-i, --inputFilePath <path>", "specify path and filename of the MBTiles database")
    .option("-o, --outputFilePath <path>", "specify path and filename of the COMT archive file")
    .option(
        "-z, --pyramidMaxZoom <number>",
        "specify to which zoom level a compressed pyramid for the index is used. Defaults to 7.",
    )
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
const ABSOLUTE_FRAGMENT_OFFSET_BYTE_LENGTH = 5;
const INDEX_ENTRY_SIZE_BYTE_LENGTH = 3;
const MAX_ZOOM_DB_QUERY = parseInt(options.maxZoomDbQuery) || 8;
const MAX_PYRAMID_ZOOM_DEFAULT = 7;
const FRAGMENT_AGGREGATION_COEFFICIENT_DEFAULT = 6;
/* Max size of a tile is limited to 16 mb */
const MAX_TILE_SIZE = 2 << 23;

(async () => {
    const logger = new Logger();
    const mbTilesFilename = options.inputFilePath;
    const comTilesFilename = options.outputFilePath;
    const pyramidMaxZoom = options.pyramidMaxZoom ?? MAX_PYRAMID_ZOOM_DEFAULT;

    logger.info(`Converting the MBTiles file ${mbTilesFilename} to a COMTiles archive.`);
    await createComTileArchive(mbTilesFilename, comTilesFilename, pyramidMaxZoom, logger);
    logger.info(`Successfully saved the COMTiles archive in ${comTilesFilename}.`);
})();

async function createComTileArchive(
    mbTilesFilename: string,
    comTilesFileName: string,
    pyramidMaxZoom: number,
    logger: Logger,
) {
    const repo = await MBTilesRepository.create(mbTilesFilename);
    const metadata = await repo.getMetadata(pyramidMaxZoom, FRAGMENT_AGGREGATION_COEFFICIENT_DEFAULT);

    /**
     * Query the TileMatrixLimits for the lower zoom levels from the db.
     * It's common to have more tiles as an overview in the lower zoom levels then specified in the bounding box of the MBTiles metadata.
     * This is a trade-off because querying the limits for all zoom levels from the db takes very long.
     */
    const filteredTileMatrixSet = metadata.tileMatrixSet.tileMatrix.filter(
        (tileMatrix) => tileMatrix.zoom <= MAX_ZOOM_DB_QUERY,
    );
    for (const tileMatrix of filteredTileMatrixSet) {
        tileMatrix.tileMatrixLimits = await repo.getTileMatrixLimits(tileMatrix.zoom);
    }

    const tileMatrixSet = metadata.tileMatrixSet;
    const metadataJson = JSON.stringify(metadata);

    const stream = fs.createWriteStream(comTilesFileName, {
        encoding: "binary",
        highWaterMark: 1_000_000,
    });

    logger.info("Writing the header and metadata to the COMTiles archive.");
    writeHeader(stream, metadataJson.length);
    writeMetadata(stream, metadataJson);

    const tileProvider = new MapTileProvider(repo, tileMatrixSet.tileMatrix);
    logger.info("Writing the index to the COMTiles archive.");
    const indexStats = await writeIndex(stream, tileProvider, metadata, pyramidMaxZoom);
    console.info(indexStats);

    logger.info("Writing the map tiles to the the COMTiles archive.");
    //await writeTiles(stream, tileProvider);

    stream.end();
    await repo.dispose();

    //stream = fs.createWriteStream(comTilesFileName, { flags: "r+", start: 12 });
    //const indexLengthBuffer = toBytesLE(indexByteLength, 5);
    //stream.write(indexLengthBuffer);
    stream.end();
}

/*
 * Structure of the header:
 * Magic (char[4] | Version (uint32) | Metadata Length (uint32) | Index Tile Pyramid Length (uint32) | Index Fragment Length (uint64)
 * */
function writeHeader(stream: fs.WriteStream, metadataByteLength: number) {
    stream.write(MAGIC);

    const versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32LE(VERSION);
    stream.write(versionBuffer);

    const metadataLengthBuffer = Buffer.alloc(4);
    metadataLengthBuffer.writeUInt32LE(metadataByteLength);
    stream.write(metadataLengthBuffer);

    //TODO: add pyramid length and fragment length
    /* Reserve the bytes but write the real index size later when the full index is written to disk.
     *  Calculating the index size results in a false size */
    const pyramidIndexLength = Buffer.alloc(4);
    stream.write(pyramidIndexLength);
    const fragmentedIndexLength = Buffer.alloc(8);
    stream.write(fragmentedIndexLength);
}

function writeMetadata(stream: fs.WriteStream, metadataJson: string) {
    stream.write(metadataJson, "utf-8");
}

//TODO: refactor -> split in two methods
async function writeIndex(
    stream: fs.WriteStream,
    tileProvider: MapTileProvider,
    metadata: Metadata,
    pyramidMaxZoom = MAX_PYRAMID_ZOOM_DEFAULT,
): Promise<[pyramidSectionLength: number, fragmentSectionLength: number]> {
    const comtIndex = new ComtIndex(metadata);
    const tiles = tileProvider.getTilesInRowMajorOrder(RecordType.SIZE);

    const pyramidSet = metadata.tileMatrixSet.tileMatrix.filter((set) => set.zoom <= pyramidMaxZoom);
    const numIndexEntriesPyramid = calculateNumTiles(pyramidSet);
    const tileIterator = tiles[Symbol.asyncIterator]();
    const indexPyramidBuffer = Buffer.alloc(numIndexEntriesPyramid * INDEX_ENTRY_SIZE_BYTE_LENGTH);
    for (let i = 0; i < numIndexEntriesPyramid; i++) {
        const tileInfo = (await tileIterator.next()).value;
        //TODO: also check for padding missing tiles
        const size = tileInfo.size;
        validateTileSize(size);
        toBytesLE(size, INDEX_ENTRY_SIZE_BYTE_LENGTH).copy(indexPyramidBuffer, i * INDEX_ENTRY_SIZE_BYTE_LENGTH);
    }
    const compressedIndexPyramid = pako.deflate(indexPyramidBuffer);
    await writeBuffer(stream, compressedIndexPyramid);

    //TODO: is aggregationCoefficient really needed? -> replace with something like is compressed or compressedTilePyramid flag
    /*
     * Magic | Version | Metadata Length | Redundant Fragment Length | Index Tile Pyramid Length | Index Fragment Length | Metadata | Index | Data
     * -> Header is Magic, Version, Metadata Length, Pyramid Length and Fragment Length
     * -> Header | Metadata | Index | Data
     * -> because the tile pyramid is compressed we need the actual size
     * -> tile pyramid always has to be full zoom levels
     * -> tile pyramid is always fully fetched
     * - write compressed tile pyramid -> calculate pyramid size and write to the header
     * - write fragments with a absolute offset and only a size per index record
     * */
    let previousFragmentIndex = -1;
    let dataSectionOffset = compressedIndexPyramid.length;
    let tile;
    let previousIndex = -1;
    let indexFragmentLength = 0;
    while (((tile = await tileIterator.next()), !tile.done)) {
        const { zoom, column, row, size, fragmentIndex } = tile;
        validateTileSize(size);

        /* First tile in a new fragment  */
        if (fragmentIndex > previousFragmentIndex) {
            const absoluteFragmentOffset = toBytesLE(dataSectionOffset, ABSOLUTE_FRAGMENT_OFFSET_BYTE_LENGTH);
            await writeBuffer(stream, absoluteFragmentOffset);

            indexFragmentLength += ABSOLUTE_FRAGMENT_OFFSET_BYTE_LENGTH;
        }

        const { index: currentIndex } = comtIndex.calculateIndexOffsetForTile(zoom, column, row);
        const padding = currentIndex - previousIndex - 1;
        /* Add a padding in the index for the missing tiles in the MBTiles database */
        if (padding > 0) {
            for (let i = 0; i < padding; i++) {
                await writeBuffer(stream, toBytesLE(0, INDEX_ENTRY_SIZE_BYTE_LENGTH));
            }
        }

        const indexEntry = toBytesLE(size, INDEX_ENTRY_SIZE_BYTE_LENGTH);
        await writeBuffer(stream, indexEntry);

        indexFragmentLength += INDEX_ENTRY_SIZE_BYTE_LENGTH;
        dataSectionOffset += size;
        previousFragmentIndex = fragmentIndex;
        previousIndex = currentIndex;
    }

    return [compressedIndexPyramid.length, indexFragmentLength];
}

function validateTileSize(tileSize: number): void {
    if (tileSize > MAX_TILE_SIZE) {
        throw new Error(`The maximum size of a tile is limited to ${MAX_TILE_SIZE / 1024 / 1024} Mb.`);
    }
}

/*async function writeIndexEntry(
    stream: fs.WriteStream,
    offset: number,
    tileLength: number,
    tileOffsetByteLength: number,
    indexEntryByteLength: number,
): Promise<void> {
    const buffer = Buffer.alloc(indexEntryByteLength);
    toBytesLE(offset, tileOffsetByteLength).copy(buffer, 0);
    buffer.writeUInt32LE(tileLength, tileOffsetByteLength);
    await writeBuffer(stream, buffer);
}*/

async function writeTiles(stream: fs.WriteStream, tileProvider: MapTileProvider): Promise<void> {
    const tiles = tileProvider.getTilesInRowMajorOrder(RecordType.TILE);

    /* Batching the tile writes did not bring the expected performance gain because allocating the buffer
     * for the tile batches was too expensive. So we simplified again to single tile writes. */
    for await (const { data: tile } of tiles) {
        const tileLength = tile.byteLength;
        if (tileLength > 0) {
            const tileBuffer = Buffer.from(tile);
            await writeBuffer(stream, tileBuffer);
        }
    }
}

async function writeBuffer(stream: fs.WriteStream, buffer: Buffer | Uint8Array): Promise<void> {
    const canContinue = stream.write(buffer);
    if (!canContinue) {
        await new Promise((resolve) => {
            stream.once("drain", resolve);
        });
    }
}
