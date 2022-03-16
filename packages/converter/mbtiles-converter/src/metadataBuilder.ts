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
    private bbox: BoundingBox | TileMatrix["tileMatrixLimits"][];
    private minZoom = 0;
    private maxZoom = 14;
    private layers = "";

    setName(name: string): WebMercatorQuadMetadataBuilder {
        this.name = name;
        return this;
    }

    setDescription(description: string): WebMercatorQuadMetadataBuilder {
        this.description = description;
        return this;
    }

    setAttribution(attribution: string): WebMercatorQuadMetadataBuilder {
        this.attribution = attribution;
        return this;
    }

    setTileOffsetBytes(offset: number): WebMercatorQuadMetadataBuilder {
        this.tileOffsetBytes = offset;
        return this;
    }

    setTileFormat(tileFormat: TileFormat): WebMercatorQuadMetadataBuilder {
        this.tileFormat = tileFormat;
        return this;
    }

    setBoundingBox(bbox: BoundingBox | TileMatrix["tileMatrixLimits"][]): WebMercatorQuadMetadataBuilder {
        this.bbox = bbox;
        return this;
    }

    setMinZoom(zoom: number): WebMercatorQuadMetadataBuilder {
        this.minZoom = zoom;
        return this;
    }

    setMaxZoom(zoom: number): WebMercatorQuadMetadataBuilder {
        this.maxZoom = zoom;
        return this;
    }

    /**
     * see https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md#user-content-vector-tileset-metadata
     * */
    setLayers(layers: string): WebMercatorQuadMetadataBuilder {
        this.layers = layers;
        return this;
    }

    /**
     *
     * The boundary is in all TileMatrix (zoom levels) instances the same.
     * Zoom 0 to 7 are not fragmented and have an aggregation factor of -1.
     * Zoom 8 to 14 have an aggregation factor of 6.
     */
    async build(): Promise<Metadata> {
        if (!this.name || !this.bbox) {
            throw new Error("No name or bounding box specified for the tileset.");
        }

        const tileMatrices: TileMatrix[] = [];
        for (let zoom = this.minZoom; zoom <= this.maxZoom; zoom++) {
            const aggregationCoefficient = zoom <= 7 ? -1 : 6;

            let tileMatrix: TileMatrix;
            if (this.isTileMatrixLimits(this.bbox)) {
                tileMatrix = TileMatrixFactory.createWebMercatorQuad(zoom, this.bbox[zoom], aggregationCoefficient);
            } else {
                tileMatrix = TileMatrixFactory.createWebMercatorQuadFromLatLon(zoom, this.bbox, aggregationCoefficient);
            }

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

    private isTileMatrixLimits(
        bbox: BoundingBox | TileMatrix["tileMatrixLimits"][],
    ): bbox is TileMatrix["tileMatrixLimits"][] {
        const props: (keyof TileMatrix["tileMatrixLimits"])[] = [
            "minTileRow",
            "minTileCol",
            "maxTileRow",
            "maxTileCol",
        ];
        return props.every((prop) => Object.prototype.hasOwnProperty.call(bbox[0], prop));
    }
}
