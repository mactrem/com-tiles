"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
exports.createIndexInRowMajorOrder = void 0;
/**
 *
 * Create an index where the fragments and the index entries of a fragment are arranged in row-major order.
 *
 * @param tileRepository Repository for accessing the tiles
 * @param tileMatrixSet Describes the bounds of the tileset
 * @returns Collection of {@link IndexEntry}
 */
function createIndexInRowMajorOrder(tileRepository, tileMatrixSet) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function () {
        var index, minZoom, maxZoom, zoom, tileMatrix, limits, tileIndex, offset, tileBatches, tileBatches_1, tileBatches_1_1, tileBatch, _i, tileBatch_1, _b, data, row, column, size, e_1_1, numIndexEntriesPerFragment, numIndexEntriesPerFragmentSide, fragmentMinColIndex, fragmentMinRowIndex, fragmentMaxColIndex, fragmentMaxRowIndex, numFragmentsCol, numFragmentsRow, denseFragmentBounds, fragmentRow, fragmentCol, sparseFragmentBounds, tiles, _c, tiles_1, _d, column, row, data, size, tileIndex, offset;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    index = [];
                    minZoom = tileMatrixSet[0].zoom;
                    maxZoom = tileMatrixSet[tileMatrixSet.length - 1].zoom;
                    zoom = minZoom;
                    _e.label = 1;
                case 1:
                    if (!(zoom <= maxZoom)) return [3 /*break*/, 22];
                    tileMatrix = tileMatrixSet[zoom];
                    limits = tileMatrix.tileMatrixLimits;
                    if (!!useIndexFragmentation(tileMatrix)) return [3 /*break*/, 14];
                    tileIndex = index.length - 1;
                    offset = index.length
                        ? index[tileIndex].offset + index[tileIndex].size
                        : 0;
                    tileBatches = tileRepository.getTilesByRowMajorOrderBatched(zoom, tileMatrix.tileMatrixLimits);
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 7, 8, 13]);
                    tileBatches_1 = (e_1 = void 0, __asyncValues(tileBatches));
                    _e.label = 3;
                case 3: return [4 /*yield*/, tileBatches_1.next()];
                case 4:
                    if (!(tileBatches_1_1 = _e.sent(), !tileBatches_1_1.done)) return [3 /*break*/, 6];
                    tileBatch = tileBatches_1_1.value;
                    for (_i = 0, tileBatch_1 = tileBatch; _i < tileBatch_1.length; _i++) {
                        _b = tileBatch_1[_i], data = _b.data, row = _b.row, column = _b.column;
                        size = data.length;
                        index.push({ offset: offset, size: size, zoom: zoom, row: row, column: column });
                        offset += size;
                    }
                    _e.label = 5;
                case 5: return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 13];
                case 7:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 13];
                case 8:
                    _e.trys.push([8, , 11, 12]);
                    if (!(tileBatches_1_1 && !tileBatches_1_1.done && (_a = tileBatches_1["return"]))) return [3 /*break*/, 10];
                    return [4 /*yield*/, _a.call(tileBatches_1)];
                case 9:
                    _e.sent();
                    _e.label = 10;
                case 10: return [3 /*break*/, 12];
                case 11:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 12: return [7 /*endfinally*/];
                case 13: return [3 /*break*/, 21];
                case 14:
                    numIndexEntriesPerFragment = Math.pow(4, tileMatrix.aggregationCoefficient);
                    numIndexEntriesPerFragmentSide = Math.sqrt(numIndexEntriesPerFragment);
                    fragmentMinColIndex = Math.floor(limits.minTileCol / numIndexEntriesPerFragmentSide);
                    fragmentMinRowIndex = Math.floor(limits.minTileRow / numIndexEntriesPerFragmentSide);
                    fragmentMaxColIndex = Math.floor(limits.maxTileCol / numIndexEntriesPerFragmentSide);
                    fragmentMaxRowIndex = Math.floor(limits.maxTileRow / numIndexEntriesPerFragmentSide);
                    numFragmentsCol = fragmentMaxColIndex - fragmentMinColIndex + 1;
                    numFragmentsRow = fragmentMaxRowIndex - fragmentMinRowIndex + 1;
                    denseFragmentBounds = {
                        minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
                        minTileRow: fragmentMinRowIndex * numIndexEntriesPerFragmentSide,
                        maxTileCol: (fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide - 1,
                        maxTileRow: (fragmentMinRowIndex + 1) * numIndexEntriesPerFragmentSide - 1
                    };
                    fragmentRow = 0;
                    _e.label = 15;
                case 15:
                    if (!(fragmentRow < numFragmentsRow)) return [3 /*break*/, 21];
                    fragmentCol = 0;
                    _e.label = 16;
                case 16:
                    if (!(fragmentCol < numFragmentsCol)) return [3 /*break*/, 19];
                    sparseFragmentBounds = calculateSparseFragmentBounds(limits, denseFragmentBounds);
                    return [4 /*yield*/, tileRepository.getTilesByRowMajorOrder(zoom, sparseFragmentBounds)];
                case 17:
                    tiles = _e.sent();
                    for (_c = 0, tiles_1 = tiles; _c < tiles_1.length; _c++) {
                        _d = tiles_1[_c], column = _d.column, row = _d.row, data = _d.data;
                        size = data.length;
                        tileIndex = index.length - 1;
                        offset = index.length
                            ? index[tileIndex].offset + index[tileIndex].size
                            : 0;
                        //TODO: set offset 0 when size=0?
                        index.push({ offset: offset, size: size, zoom: zoom, row: row, column: column });
                    }
                    /*for await (const tileBatch of tileBatches) {
                      if (
                        tileBatch.some(
                          (b) => zoom === 11 && b.column === 1158 && b.row == 1600
                        )
                      ) {
                        debugger;
                      }
          
                      for (const { column, row, data } of tileBatch) {
                        const size = data.length;
                        const tileIndex = index.length - 1;
                        const offset = index.length
                          ? index[tileIndex].offset + index[tileIndex].size
                          : 0;
                        //TODO: set offset 0 when size=0?
                        index.push({ offset, size, zoom, row, column });
          
                        if (zoom === 11 && column === 1158 && row == 1600) {
                          debugger;
                        }
                      }
                    }*/
                    //TODO: use only one assignment via index multiplication
                    /* increment column and keep row */
                    Object.assign(denseFragmentBounds, {
                        minTileCol: denseFragmentBounds.maxTileCol + 1,
                        maxTileCol: denseFragmentBounds.maxTileCol + numIndexEntriesPerFragmentSide
                    });
                    _e.label = 18;
                case 18:
                    fragmentCol++;
                    return [3 /*break*/, 16];
                case 19:
                    /* reset column and increment row */
                    denseFragmentBounds = {
                        minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
                        minTileRow: denseFragmentBounds.maxTileRow + 1,
                        maxTileCol: (fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide - 1,
                        maxTileRow: denseFragmentBounds.maxTileRow + numIndexEntriesPerFragmentSide
                    };
                    _e.label = 20;
                case 20:
                    fragmentRow++;
                    return [3 /*break*/, 15];
                case 21:
                    zoom++;
                    return [3 /*break*/, 1];
                case 22: return [2 /*return*/, index];
            }
        });
    });
}
exports.createIndexInRowMajorOrder = createIndexInRowMajorOrder;
function calculateSparseFragmentBounds(tileSetLimits, denseFragmentLimits) {
    var sparseFragmentLimits = __assign({}, denseFragmentLimits);
    if (tileSetLimits.minTileCol > denseFragmentLimits.minTileCol) {
        sparseFragmentLimits.minTileCol = tileSetLimits.minTileCol;
    }
    if (tileSetLimits.minTileRow > denseFragmentLimits.minTileRow) {
        sparseFragmentLimits.minTileRow = tileSetLimits.minTileRow;
    }
    if (tileSetLimits.maxTileCol < denseFragmentLimits.maxTileCol) {
        sparseFragmentLimits.maxTileCol = tileSetLimits.maxTileCol;
    }
    if (tileSetLimits.maxTileRow < denseFragmentLimits.maxTileRow) {
        sparseFragmentLimits.maxTileRow = tileSetLimits.maxTileRow;
    }
    return sparseFragmentLimits;
}
function useIndexFragmentation(tileMatrix) {
    return tileMatrix.aggregationCoefficient !== -1;
}
