import express from "express";
import cors from "cors";
import { program } from "commander";
import * as path from "path";
import provider from "@com-tiles/provider";
import { TileFormat } from "@com-tiles/spec/types/tileFormat";
import { ComtReader } from "./comtReader.js";

const SUPPORTED_TILE_FORMAT: TileFormat = "pbf";

program
    .option("-f, --fileName <path>", "specify path and filename of the COMTiles archive file")
    .option("-p, --port", "specify the port to bind the server")
    .parse(process.argv);

const options = program.opts();
if (!options.fileName) {
    throw new Error("Please specify the fileName of the COMTiles archive file.");
}

const fileName = options.fileName;
const port = options.port ?? 8080;

const comtReader = new ComtReader(fileName);
const { metadata, metadataByteLength } = await comtReader.readMetadata();
if (metadata.tileFormat !== SUPPORTED_TILE_FORMAT) {
    throw new Error(`${SUPPORTED_TILE_FORMAT} is currently the only supported tile format.`);
}
const indexEntries = await comtReader.readIndex(metadataByteLength, metadata.tileOffsetBytes);
const index = new provider.ComtIndex(metadata);

const app = express();
app.use(cors());
app.use(express.static(path.resolve("./", "assets")));

app.get("/tiles/:z(\\d+)/:x(\\d+)/:y(\\d+).pbf", async (req, res) => {
    const zoom = parseInt(req.params.z, 10);
    const x = parseInt(req.params.x, 10);
    const y = parseInt(req.params.y, 10);

    try {
        const tile = await comtReader.readTile(index, indexEntries, metadataByteLength, { zoom, x, y });

        res.writeHead(200, {
            "Content-Type": "application/x-protobuf",
            "Content-Length": tile.byteLength,
            "Content-Encoding": "gzip",
        });
        res.end(tile);
    } catch (e) {
        res.sendStatus(404);
    }
});

app.listen(port);
