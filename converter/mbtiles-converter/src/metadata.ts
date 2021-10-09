import TileMatrixSet, {BoundingBox, TileMatrix, TileMatrixFactory} from "./tileMatrixSet";

const VERSION = "1.0";

export interface Metadata{
    version: string;
    attribution: string;
    /**
     * From MBTiles spec:
     * File format of the tile data: pbf, jpg, png, webp, or an IETF media type for other formats.
     * pbf as a format refers to gzip-compressed vector tile data in Mapbox Vector Tile format.
     * */
    tileFormat: string;
    tileMatrixSet: TileMatrixSet;
}

export class OSMTileMetadataBuilder{
    private version: string = VERSION;
    private minZoom: number = 0;
    private maxZoom: number = 14;
    private tileFormat: string = "pbf";
    private attribution: string = "";
    private bbox: BoundingBox;

    setVersion(version: string): OSMTileMetadataBuilder{
        this.version = version;
        return this;
    }

    setMinZoom(minZoom: number){
        this.minZoom = minZoom;
        return this;
    }

    setMaxZoom(maxZoom: number){
        this.maxZoom = maxZoom;
        return this;
    }

    setBoundingBox(bbox: BoundingBox){
        this.bbox = bbox;
        return this;
    }

    setTileFormat(tileFormat: string){
        this.tileFormat = tileFormat;
        return this;
    }

    setAttribution(attribution: string){
        this.attribution = attribution;
        return this;
    }

    /*
    * The boundary is in all TileMatrix (zoom levels) instances of the TileMatrixSet the same.
    * TODO: Add additional attributes of a mbtiles database e.g. pxel_scale, name, description, id, json with the vector layers
    * A distinction must be made between:
    * - COMTiles metadata
    * - Tile data metdadata like MVT because additional metadata are needed -> separate version, json with vector layers
    *   -> additional optional fields has to be possible like in the MBTiles format -> https://github.com/mapbox/mbtiles-spec/blob/master/1.3/spec.md
    * */
    build(): Metadata{
        if(!this.bbox){
            throw new Error("No bounding box specified for the TileMatrixSet.");
        }

        const tileMatrices: TileMatrix[] = [];
        for(let zoom = this.minZoom; zoom <= this.maxZoom; zoom++){
            const tileMatrix = TileMatrixFactory.createOsmTile(zoom, this.bbox);
            tileMatrices.push(tileMatrix);
        }

        const tileMatrixSet = new TileMatrixSet(tileMatrices);
        return {
            version: this.version,
            attribution: this.attribution,
            tileFormat: this.tileFormat,
            tileMatrixSet
        }
    }
}