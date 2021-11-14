import TileMatrixSetBuilder, {BoundingBox, TileMatrixFactory} from "./tileMatrixSetBuilder";
import {Metadata} from "@com-tiles/spec";
import createWMQTileMatrixSet from "./tileMatrixSetBuilder";
import {TileMatrix} from "@com-tiles/spec/types/tileMatrix";



export class WebMercatorQuadMetadataBuilder {
    private name: string;
    private description = "";
    private attribution = "";
    private tileOffsetBytes = 4;
    private tileFormat: Metadata["tileFormat"] = "pbf";
    private bbox: BoundingBox;
    private minZoom =  0;
    private maxZoom = 14;
    private layers = "";

    setName(name: string){
        this.name = name;
        return this;
    }

    setDescription(description: string){
        this.description = description;
        return this;
    }

    setAttribution(attribution: string){
        this.attribution = attribution;
        return this;
    }

    setTileOffsetBytes(offset: number){
        this.tileOffsetBytes = offset;
        return this;
    }

    setTileFormat(tileFormat: Metadata["tileFormat"]){
        this.tileFormat = tileFormat;
        return this;
    }

    setBoundingBox(bbox: BoundingBox){
        this.bbox = bbox;
        return this;
    }

    setMinZoom(zoom: number){
        this.minZoom = zoom;
        return this;
    }

    setMaxZoom(zoom: number){
        this.maxZoom = zoom;
        return this;
    }

    /**
    * see https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md#user-content-vector-tileset-metadata
    * */
    setLayers(layers: string){
        this.layers = layers;
        return this;
    }

    /*
    * The boundary is in all TileMatrix (zoom levels) instances of the TileMatrixBuilder the same.
    * TODO: Add additional attributes of a mbtiles database e.g. pxel_scale, name, description, id, json with the vector layers
    * A distinction must be made between:
    * - COMTiles metadata
    * - Tile data metdadata like MVT because additional metadata are needed -> separate version, json with vector layers
    *   -> additional optional fields has to be possible like in the MBTiles format -> https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md
    * - Zoom 0 - 8 have no aggregation factor, 9 - 14 an aggregation factor of 6
    * */
    build(): Metadata{
        if(!this.name || !this.bbox ){
            throw new Error("No name or bounding box specified for the TileMatrixBuilder.");
        }

        const tileMatrices: TileMatrix[] = [];
        for(let zoom = this.minZoom; zoom <= this.maxZoom; zoom++){
            const aggregationCoefficient = zoom <=8 ? -1 : 6;
            const tileMatrix = TileMatrixFactory.createWebMercatorQuad(zoom, this.bbox, aggregationCoefficient);
            tileMatrices.push(tileMatrix);
        }

        const tileMatrixSet = createWMQTileMatrixSet(tileMatrices);
        return {
            name: this.name,
            description: this.description,
            attribution: this.attribution,
            tileOffsetBytes: this.tileOffsetBytes,
            tileFormat: this.tileFormat,
            layers: this.layers,
            tileMatrixSet
        }
    }
}