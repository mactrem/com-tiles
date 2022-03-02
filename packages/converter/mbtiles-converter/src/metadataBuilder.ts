import { Metadata } from "@com-tiles/spec";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { TileFormat } from "@com-tiles/spec/types/tileFormat";
import createWmqTileMatrixSet, { BoundingBox, TileMatrixFactory } from "./tileMatrixFactory";

export default class WebMercatorQuadMetadataBuilder {
    private name = "";
    private description = "";
    private attribution = "";
    private tileOffsetBytes = 5;
    private tileFormat: TileFormat = "pbf";
    private bbox: BoundingBox;
    private minZoom = 0;
    private maxZoom = 14;
    private layers = "";

    setName(name: string) {
        this.name = name;
        return this;
    }

    setDescription(description: string) {
        this.description = description;
        return this;
    }

    setAttribution(attribution: string) {
        this.attribution = attribution;
        return this;
    }

    setTileOffsetBytes(offset: number) {
        this.tileOffsetBytes = offset;
        return this;
    }

    setTileFormat(tileFormat: TileFormat) {
        this.tileFormat = tileFormat;
        return this;
    }

    setBoundingBox(bbox: BoundingBox) {
        this.bbox = bbox;
        return this;
    }

    setMinZoom(zoom: number) {
        this.minZoom = zoom;
        return this;
    }

    setMaxZoom(zoom: number) {
        this.maxZoom = zoom;
        return this;
    }

    /**
     * see https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md#user-content-vector-tileset-metadata
     * */
    setLayers(layers: string) {
        this.layers = layers;
        return this;
    }

    /*
     * The boundary is in all TileMatrix (zoom levels) instances the same.
     * Zoom 0 to 7 are not fragmented and have an aggregation factor of -1.
     * Zoom 8 to 14 have an aggregation factor of 6.
     * */
    build(): Metadata {
        if (!this.name || !this.bbox) {
            throw new Error("No name or bounding box specified for the TileMatrixBuilder.");
        }

        const tileMatrices: TileMatrix[] = [];
        for (let zoom = this.minZoom; zoom <= this.maxZoom; zoom++) {
            const aggregationCoefficient = zoom <= 7 ? -1 : 6;
            const tileMatrix = TileMatrixFactory.createWebMercatorQuad(zoom, this.bbox, aggregationCoefficient);
            tileMatrices.push(tileMatrix);
        }

        const tileMatrixSet = createWmqTileMatrixSet(tileMatrices);
        return {
            name: this.name,
            description: this.description,
            attribution: this.attribution,
            tileOffsetBytes: this.tileOffsetBytes,
            tileFormat: this.tileFormat,
            layers: this.layers,
            tileMatrixSet,
        };
    }
}
