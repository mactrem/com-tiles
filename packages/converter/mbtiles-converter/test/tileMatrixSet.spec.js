"use strict";
exports.__esModule = true;
var tileMatrixSetBuilder_1 = require("../src/tileMatrixSetBuilder");
describe("TileMatrixFactory", function () {
    it("should create OSMTile", function () {
        var zoom = 4;
        var topLeft = [0, 66.513260]; //8,4
        var bottomRight = [134.999998, -40.979897]; //13,9
        var bbox = topLeft.concat(bottomRight);
        var tileMatrix = tileMatrixSetBuilder_1.TileMatrixFactory.createWebMercatorQuad(zoom, bbox);
        /*expect(tileMatrix.zoom).toBe(zoom);
        expect(tileMatrix.topLeft).toEqual(topLeft);
        expect(tileMatrix.matrixWidth).toBe(5);
        expect(tileMatrix.maxtrixHeight).toBe(5);*/
    });
});
