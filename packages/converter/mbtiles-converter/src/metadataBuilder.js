"use strict";
exports.__esModule = true;
exports.WebMercatorQuadMetadataBuilder = void 0;
var tileMatrixSetBuilder_1 = require("./tileMatrixSetBuilder");
var tileMatrixSetBuilder_2 = require("./tileMatrixSetBuilder");
var WebMercatorQuadMetadataBuilder = /** @class */ (function () {
    function WebMercatorQuadMetadataBuilder() {
        this.description = "";
        this.attribution = "";
        this.tileOffsetBytes = 5;
        this.tileFormat = "pbf";
        this.minZoom = 0;
        this.maxZoom = 14;
        this.layers = "";
    }
    WebMercatorQuadMetadataBuilder.prototype.setName = function (name) {
        this.name = name;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setDescription = function (description) {
        this.description = description;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setAttribution = function (attribution) {
        this.attribution = attribution;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setTileOffsetBytes = function (offset) {
        this.tileOffsetBytes = offset;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setTileFormat = function (tileFormat) {
        this.tileFormat = tileFormat;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setBoundingBox = function (bbox) {
        this.bbox = bbox;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setMinZoom = function (zoom) {
        this.minZoom = zoom;
        return this;
    };
    WebMercatorQuadMetadataBuilder.prototype.setMaxZoom = function (zoom) {
        this.maxZoom = zoom;
        return this;
    };
    /**
     * see https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md#user-content-vector-tileset-metadata
     * */
    WebMercatorQuadMetadataBuilder.prototype.setLayers = function (layers) {
        this.layers = layers;
        return this;
    };
    /*
     * The boundary is in all TileMatrix (zoom levels) instances of the TileMatrixBuilder the same.
     * A distinction must be made between:
     * - COMTiles metadata
     * - Tile data metdadata like MVT because additional metadata are needed -> separate version, json with vector layers
     *   -> additional optional fields has to be possible like in the MBTiles format -> https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md
     * - Zoom 0 - 7 have no aggregation factor, 8 - 14 an aggregation factor of 6
     * */
    WebMercatorQuadMetadataBuilder.prototype.build = function () {
        if (!this.name || !this.bbox) {
            throw new Error("No name or bounding box specified for the TileMatrixBuilder.");
        }
        var tileMatrices = [];
        for (var zoom = this.minZoom; zoom <= this.maxZoom; zoom++) {
            var aggregationCoefficient = zoom <= 7 ? -1 : 6;
            var tileMatrix = tileMatrixSetBuilder_1.TileMatrixFactory.createWebMercatorQuad(zoom, this.bbox, aggregationCoefficient);
            tileMatrices.push(tileMatrix);
        }
        var tileMatrixSet = (0, tileMatrixSetBuilder_2["default"])(tileMatrices);
        return {
            name: this.name,
            description: this.description,
            attribution: this.attribution,
            tileOffsetBytes: this.tileOffsetBytes,
            tileFormat: this.tileFormat,
            layers: this.layers,
            tileMatrixSet: tileMatrixSet
        };
    };
    return WebMercatorQuadMetadataBuilder;
}());
exports.WebMercatorQuadMetadataBuilder = WebMercatorQuadMetadataBuilder;
