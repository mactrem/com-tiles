"use strict";
exports.__esModule = true;
exports.TileMatrixFactory = void 0;
var tileMatrixCRS = "WebMercatorQuad";
function createWMQTileMatrixSet(tileMatrices, fragmentOrdering, indexRecordOrdering, tileOrdering) {
    if (fragmentOrdering === void 0) { fragmentOrdering = "RowMajor"; }
    if (indexRecordOrdering === void 0) { indexRecordOrdering = "RowMajor"; }
    if (tileOrdering === void 0) { tileOrdering = "RowMajor"; }
    return {
        tileMatrixCRS: tileMatrixCRS,
        fragmentOrdering: fragmentOrdering,
        tileOrdering: tileOrdering,
        tileMatrix: tileMatrices
    };
}
exports["default"] = createWMQTileMatrixSet;
/*
 * Corresponds to the Tiled Coordinate Reference Systems of MapML
 * see https://maps4html.org/MapML/spec/#tiled-coordinate-reference-systems-0
 * */
var TileMatrixFactory = /** @class */ (function () {
    function TileMatrixFactory() {
    }
    /*
     *
     * see https://docs.opengeospatial.org/is/17-083r2/17-083r2.html#62
     * Y-axis goes downwards like XYZ tiling scheme
     * */
    TileMatrixFactory.createWebMercatorQuad = function (zoom, bounds, aggregationCoefficient) {
        if (aggregationCoefficient === void 0) { aggregationCoefficient = 6; }
        var minTileCol = TileMatrixFactory.lon2tile(bounds[0], zoom);
        var minTileRow = TileMatrixFactory.lat2tile(bounds[1], zoom);
        var maxTileCol = TileMatrixFactory.lon2tile(bounds[2], zoom);
        var maxTileRow = TileMatrixFactory.lat2tile(bounds[3], zoom);
        /* Y-axis goes downwards in the XYZ tiling scheme */
        return {
            zoom: zoom,
            aggregationCoefficient: aggregationCoefficient,
            tileMatrixLimits: {
                minTileCol: minTileCol,
                minTileRow: minTileRow,
                maxTileCol: maxTileCol,
                maxTileRow: maxTileRow
            }
        };
    };
    /*
     * see https://docs.opengeospatial.org/is/17-083r2/17-083r2.html#63
     * */
    TileMatrixFactory.createWorldCRS84Quad = function () {
        throw new Error("Not implemented yet.");
    };
    TileMatrixFactory.lon2tile = function (lon, zoom) {
        return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    };
    /* MBTiles uses tms global-mercator profile */
    TileMatrixFactory.lat2tile = function (lat, zoom) {
        var xyz = Math.floor(((1 -
            Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
                Math.PI) /
            2) *
            Math.pow(2, zoom));
        return Math.pow(2, zoom) - xyz - 1;
    };
    return TileMatrixFactory;
}());
exports.TileMatrixFactory = TileMatrixFactory;
