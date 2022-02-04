#!/usr/bin/env node
import sqlite3 from "sqlite3";
import fs from "fs";
import program from "commander";
import { WebMercatorQuadMetadataBuilder } from "./metadataBuilder";
import { Metadata } from "@comt/spec";
import { createIndexInRowMajorOrder, IndexEntry } from "./indexFactory";
import { MBTilesRepository } from "./mbTilesRepository";
import { toBytesLE } from "./utils";

import { version } from "../package.json";

program
  .version(version)
  .option(
    "-i, --inputFilePath <path>",
    "specify path and filename of the MBTiles database"
  )
  .option(
    "-o, --outputFilePath <path>",
    "specify path and filename of the COMT archive file"
  )
  .parse(process.argv);

const options = program.opts();
if (!options.inputFilePath || !options.outputFilePath) {
  throw new Error("Please specify the inputFilePath and the outputFilePath.");
}

const MAGIC = "COMT";
const VERSION = 1;
const INDEX_ENTRY_TILE_SIZE = 4;

(async () => {
  const mbTilesFilename = options.inputFilePath;
  const db = new sqlite3.Database(mbTilesFilename);
  const metadata = await createMetadata(db);

  const repo = new MBTilesRepository(mbTilesFilename);
  const index = await createIndexInRowMajorOrder(
    repo,
    metadata.tileMatrixSet.tileMatrix
  );

  await createComTileArchive(program.outputFilePath, metadata, index, repo);
})();

async function createComTileArchive(
  fileName: string,
  metadata: Metadata,
  index: IndexEntry[],
  repo: MBTilesRepository
) {
  const stream = fs.createWriteStream(fileName, {
    encoding: "binary",
    highWaterMark: 1_000_000,
  });

  const metadataJson = JSON.stringify(metadata);
  const indexEntrySize = INDEX_ENTRY_TILE_SIZE + metadata.tileOffsetBytes;
  const numBytesIndex = index.length * indexEntrySize;
  writeHeader(stream, metadataJson.length, numBytesIndex);

  writeMetadata(stream, metadataJson);

  writeIndex(stream, numBytesIndex, index);

  await writeTiles(stream, index, repo);

  stream.end();
}

function writeHeader(
  stream: fs.WriteStream,
  metadataLength: number,
  indexLength: number
) {
  stream.write(MAGIC);

  const versionBuffer = Buffer.alloc(4);
  versionBuffer.writeUInt32LE(VERSION);
  stream.write(versionBuffer);

  const metadataLengthBuffer = Buffer.alloc(4);
  metadataLengthBuffer.writeUInt32LE(metadataLength);
  stream.write(metadataLengthBuffer);

  const indexLengthBuffer = toBytesLE(indexLength, 5);
  stream.write(indexLengthBuffer);
}

function writeMetadata(stream: fs.WriteStream, metadataJson: string) {
  stream.write(metadataJson, "utf-8");
}

function writeIndex(
  stream: fs.WriteStream,
  numBytesIndex: number,
  index: IndexEntry[]
) {
  const indexBuffer = Buffer.alloc(numBytesIndex);

  const indexEntrySize = numBytesIndex / index.length;
  for (let i = 0; i < index.length; i++) {
    const offset = i * indexEntrySize;
    toBytesLE(index[i].offset, 5).copy(indexBuffer, offset);
    indexBuffer.writeUInt32LE(index[i].size, offset + 5);
  }

  stream.write(indexBuffer);
}

async function writeTiles(
  stream: fs.WriteStream,
  index: IndexEntry[],
  tileRepository: MBTilesRepository
) {
  let i = 0;
  let partialBuffer = new Buffer(0);
  const lastTileIndex = index.length - 1;
  const batchSize = 5000;
  for (const { zoom, row, column, size } of index) {
    if (size > 0) {
      const { data } = await tileRepository.getTile(zoom, row, column);
      const tileBuffer = Buffer.from(data);
      //TODO: preallocate -> add total size to IndexEntry
      partialBuffer = Buffer.concat([partialBuffer, tileBuffer]);

      if (i % batchSize === 0 || i === lastTileIndex) {
        const canContinue = stream.write(partialBuffer);
        if (!canContinue) {
          await new Promise((resolve) => {
            stream.once("drain", resolve);
          });
        }

        partialBuffer = new Buffer(0);
      }
    }

    i++;
  }
}

function createMetadata(db: sqlite3.Database): Promise<Metadata> {
  return new Promise((resolve, reject) => {
    db.all("SELECT name, value FROM metadata;", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const metadataBuilder = new WebMercatorQuadMetadataBuilder();
      for (const row of rows) {
        switch (row.name) {
          case "name":
            metadataBuilder.setName(row.value);
            break;
          case "bounds":
            metadataBuilder.setBoundingBox(
              row.value.split(",").map((value) => parseFloat(value.trim()))
            );
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

      const metadata = metadataBuilder.build();
      resolve(metadata);
    });
  });
}
