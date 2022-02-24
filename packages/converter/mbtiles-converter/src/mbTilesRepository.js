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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
exports.__esModule = true;
exports.MBTilesRepository = void 0;
var sqlite3_1 = require("sqlite3");
var util = require("util");
var MBTilesRepository = /** @class */ (function () {
    function MBTilesRepository(fileName) {
        this.fileName = fileName;
    }
    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    MBTilesRepository.prototype.getTilesByRowMajorOrder = function (zoom, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var db, query, tiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect(this.fileName)];
                    case 1:
                        db = _a.sent();
                        query = "SELECT tile_column as column, tile_row as row, tile_data as data  FROM ".concat(MBTilesRepository.TILES_TABLE_NAME, " WHERE zoom_level = ").concat(zoom);
                        if (!limit) return [3 /*break*/, 3];
                        query += " AND tile_column >= ".concat(limit.minTileCol, " AND tile_column <= ").concat(limit.maxTileCol, " AND tile_row >= ").concat(limit.minTileRow, " AND tile_row<= ").concat(limit.maxTileRow);
                        query += " ORDER BY tile_row, tile_column ASC";
                        return [4 /*yield*/, util.promisify(db.all.bind(db))(query)];
                    case 2:
                        tiles = _a.sent();
                        return [2 /*return*/, this.hasMissingTiles(limit, tiles)
                                ? this.addMissingTiles(limit, tiles)
                                : tiles];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    MBTilesRepository.prototype.getTilesByRowMajorOrderBatched = function (zoom, limit, batchSize) {
        if (batchSize === void 0) { batchSize = 50000; }
        return __asyncGenerator(this, arguments, function getTilesByRowMajorOrderBatched_1() {
            var db, query, offset, limitQuery, tiles, numTiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, __await(this.connect(this.fileName))];
                    case 1:
                        db = _a.sent();
                        query = "SELECT tile_column as column, tile_row as row, tile_data as data  FROM ".concat(MBTilesRepository.TILES_TABLE_NAME, " WHERE zoom_level = ").concat(zoom);
                        if (limit) {
                            query += " AND tile_column >= ".concat(limit.minTileCol, " AND tile_column <= ").concat(limit.maxTileCol, " AND tile_row >= ").concat(limit.minTileRow, " AND tile_row<= ").concat(limit.maxTileRow);
                        }
                        query += " ORDER BY tile_row, tile_column ASC";
                        offset = 0;
                        _a.label = 2;
                    case 2:
                        limitQuery = " ".concat(query, " LIMIT ").concat(batchSize, " OFFSET ").concat(offset, ";");
                        return [4 /*yield*/, __await(util.promisify(db.all.bind(db))(limitQuery))];
                    case 3:
                        tiles = _a.sent();
                        numTiles = tiles.length;
                        if (!(numTiles === 0)) return [3 /*break*/, 5];
                        db.close();
                        return [4 /*yield*/, __await(void 0)];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5: return [4 /*yield*/, __await(this.hasMissingTiles(limit, tiles)
                            ? this.addMissingTiles(limit, tiles)
                            : tiles)];
                    case 6: 
                    //TODO: not working for a fragment size larger then the batch size
                    return [4 /*yield*/, _a.sent()];
                    case 7:
                        //TODO: not working for a fragment size larger then the batch size
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        offset += batchSize;
                        return [3 /*break*/, 2];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    MBTilesRepository.prototype.hasMissingTiles = function (limit, tiles) {
        var expectedNumTiles = (limit.maxTileCol - limit.minTileCol + 1) *
            (limit.maxTileRow - limit.minTileRow + 1);
        var actualNumTiles = tiles.length;
        return expectedNumTiles !== actualNumTiles;
    };
    //TODO: find proper solution with empty mvt tile -> when adding size 0
    MBTilesRepository.prototype.addMissingTiles = function (limit, tiles) {
        var paddedTiles = [];
        var _loop_1 = function (row) {
            var _loop_2 = function (col) {
                if (!tiles.some(function (tile) { return tile.row === row && tile.column === col; })) {
                    var emptyTile = new Uint8Array();
                    paddedTiles.push({ column: col, row: row, data: emptyTile });
                }
                else {
                    paddedTiles.push(tiles.shift());
                }
            };
            for (var col = limit.minTileCol; col <= limit.maxTileCol; col++) {
                _loop_2(col);
            }
        };
        for (var row = limit.minTileRow; row <= limit.maxTileRow; row++) {
            _loop_1(row);
        }
        return paddedTiles;
    };
    MBTilesRepository.prototype.getTile = function (zoom, row, column) {
        return __awaiter(this, void 0, void 0, function () {
            var db, query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect(this.fileName)];
                    case 1:
                        db = _a.sent();
                        query = "SELECT tile_column as column, tile_row as row, tile_data as data  FROM ".concat(MBTilesRepository.TILES_TABLE_NAME, " WHERE zoom_level = ").concat(zoom, " AND tile_column = ").concat(column, " AND tile_row = ").concat(row, ";");
                        return [4 /*yield*/, util.promisify(db.all.bind(db))(query)];
                    case 2:
                        rows = _a.sent();
                        return [2 /*return*/, rows[0]];
                }
            });
        });
    };
    MBTilesRepository.prototype.connect = function (dbPath) {
        return new Promise(function (resolve, reject) {
            var db = new sqlite3_1.Database(dbPath, sqlite3_1.OPEN_READONLY, function (err) {
                if (err) {
                    reject(err.message);
                    return;
                }
                resolve(db);
            });
        });
    };
    MBTilesRepository.TILES_TABLE_NAME = "tiles";
    return MBTilesRepository;
}());
exports.MBTilesRepository = MBTilesRepository;
