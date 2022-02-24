#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var sqlite3_1 = require("sqlite3");
var fs_1 = require("fs");
var commander_1 = require("commander");
var metadataBuilder_1 = require("./metadataBuilder");
var indexFactory_1 = require("./indexFactory");
var mbTilesRepository_1 = require("./mbTilesRepository");
var utils_1 = require("./utils");
var package_json_1 = require("../package.json");
commander_1["default"]
    .version(package_json_1.version)
    .option("-i, --inputFilePath <path>", "specify path and filename of the MBTiles database")
    .option("-o, --outputFilePath <path>", "specify path and filename of the COMT archive file")
    .parse(process.argv);
var options = commander_1["default"].opts();
if (!options.inputFilePath || !options.outputFilePath) {
    throw new Error("Please specify the inputFilePath and the outputFilePath.");
}
var MAGIC = "COMT";
var VERSION = 1;
var INDEX_ENTRY_TILE_SIZE = 4;
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var mbTilesFilename, db, metadata, repo, index;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.info(new Date());
                mbTilesFilename = options.inputFilePath;
                db = new sqlite3_1["default"].Database(mbTilesFilename);
                return [4 /*yield*/, createMetadata(db)];
            case 1:
                metadata = _a.sent();
                console.time("createIndex");
                repo = new mbTilesRepository_1.MBTilesRepository(mbTilesFilename);
                return [4 /*yield*/, (0, indexFactory_1.createIndexInRowMajorOrder)(repo, metadata.tileMatrixSet.tileMatrix)];
            case 2:
                index = _a.sent();
                console.timeEnd("createIndex");
                return [4 /*yield*/, createComTileArchive(commander_1["default"].outputFilePath, metadata, index, repo)];
            case 3:
                _a.sent();
                console.info(new Date());
                return [2 /*return*/];
        }
    });
}); })();
function createComTileArchive(fileName, metadata, index, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var stream, metadataJson, indexEntrySize, numBytesIndex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stream = fs_1["default"].createWriteStream(fileName, {
                        encoding: "binary",
                        highWaterMark: 1000000
                    });
                    console.time("header");
                    metadataJson = JSON.stringify(metadata);
                    indexEntrySize = INDEX_ENTRY_TILE_SIZE + metadata.tileOffsetBytes;
                    numBytesIndex = index.length * indexEntrySize;
                    writeHeader(stream, metadataJson.length, numBytesIndex);
                    writeMetadata(stream, metadataJson);
                    console.timeEnd("header");
                    console.time("index");
                    console.info("Creating index.");
                    writeIndex(stream, numBytesIndex, index);
                    console.timeEnd("index");
                    console.time("tiles");
                    console.info("Creating tiles.");
                    return [4 /*yield*/, writeTiles(stream, index, repo)];
                case 1:
                    _a.sent();
                    stream.end();
                    console.timeEnd("tiles");
                    return [2 /*return*/];
            }
        });
    });
}
function writeHeader(stream, metadataLength, indexLength) {
    stream.write(MAGIC);
    var versionBuffer = Buffer.alloc(4);
    versionBuffer.writeUInt32LE(VERSION);
    stream.write(versionBuffer);
    var metadataLengthBuffer = Buffer.alloc(4);
    metadataLengthBuffer.writeUInt32LE(metadataLength);
    stream.write(metadataLengthBuffer);
    var indexLengthBuffer = (0, utils_1.toBytesLE)(indexLength, 5);
    stream.write(indexLengthBuffer);
}
function writeMetadata(stream, metadataJson) {
    stream.write(metadataJson, "utf-8");
}
function writeIndex(stream, numBytesIndex, index) {
    var indexBuffer = Buffer.alloc(numBytesIndex);
    var indexEntrySize = numBytesIndex / index.length;
    for (var i = 0; i < index.length; i++) {
        var offset = i * indexEntrySize;
        (0, utils_1.toBytesLE)(index[i].offset, 5).copy(indexBuffer, offset);
        indexBuffer.writeUInt32LE(index[i].size, offset + 5);
    }
    stream.write(indexBuffer);
}
function writeTiles(stream, index, tileRepository) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, index_1, _a, zoom, row, column, size, data, tileBuffer, canContinue;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0, index_1 = index;
                    _b.label = 1;
                case 1:
                    if (!(_i < index_1.length)) return [3 /*break*/, 5];
                    _a = index_1[_i], zoom = _a.zoom, row = _a.row, column = _a.column, size = _a.size;
                    if (!(size > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, tileRepository.getTile(zoom, row, column)];
                case 2:
                    data = (_b.sent()).data;
                    tileBuffer = Buffer.from(data);
                    canContinue = stream.write(tileBuffer);
                    if (!!canContinue) return [3 /*break*/, 4];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            stream.once("drain", resolve);
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function writeTilesTest(stream, index, tileRepository) {
    return __awaiter(this, void 0, void 0, function () {
        var i, lastTileIndex, batchSize, partialBuffer, tileOffset, _i, index_2, _a, zoom, row, column, size, data, tileBuffer, canContinue, partialBufferEnd;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    i = 0;
                    lastTileIndex = index.length - 1;
                    batchSize = 200;
                    partialBuffer = preallocateBuffer(index, 0, index.length + 1 < batchSize ? index.length : batchSize);
                    tileOffset = 0;
                    _i = 0, index_2 = index;
                    _b.label = 1;
                case 1:
                    if (!(_i < index_2.length)) return [3 /*break*/, 5];
                    _a = index_2[_i], zoom = _a.zoom, row = _a.row, column = _a.column, size = _a.size;
                    if (!(size > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, tileRepository.getTile(zoom, row, column)];
                case 2:
                    data = (_b.sent()).data;
                    tileBuffer = Buffer.from(data);
                    //TODO: preallocate -> add total size to IndexEntry
                    tileBuffer.copy(partialBuffer, tileOffset);
                    tileOffset += tileBuffer.length;
                    //TODO: not working for 1 tile -> no problem but find proper solution
                    if ((i > 0 && i % batchSize === 0) || i === lastTileIndex) {
                        canContinue = stream.write(partialBuffer);
                        /*if (!canContinue) {
                          await new Promise((resolve) => {
                            stream.once("drain", resolve);
                          });
                        }*/
                        if (i !== lastTileIndex) {
                            partialBufferEnd = i +
                                (lastTileIndex - i + 1 >= batchSize
                                    ? batchSize
                                    : lastTileIndex - i);
                            partialBuffer = preallocateBuffer(index, i + 1, partialBufferEnd);
                            tileOffset = 0;
                        }
                    }
                    _b.label = 3;
                case 3:
                    i++;
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function preallocateBuffer(index, startIndex, endIndex) {
    var bufferSize = 0;
    for (var i = startIndex; i <= endIndex; i++) {
        bufferSize += index[i].size;
    }
    return Buffer.alloc(bufferSize);
}
function createMetadata(db) {
    return new Promise(function (resolve, reject) {
        db.all("SELECT name, value FROM metadata;", function (err, rows) {
            if (err) {
                reject(err);
                return;
            }
            var metadataBuilder = new metadataBuilder_1.WebMercatorQuadMetadataBuilder();
            for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                var row = rows_1[_i];
                switch (row.name) {
                    case "name":
                        metadataBuilder.setName(row.value);
                        break;
                    case "bounds":
                        metadataBuilder.setBoundingBox(row.value.split(",").map(function (value) { return parseFloat(value.trim()); }));
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
            var metadata = metadataBuilder.build();
            resolve(metadata);
        });
    });
}
