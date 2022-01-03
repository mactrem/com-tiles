import {TileMatrix} from "@com-tiles/spec/types/tileMatrix";
import {SpaceFillingCurveOrdering} from "@com-tiles/spec/types/spaceFillingCurveOrdering";
import {Metadata} from "@com-tiles/spec";

export type LngLat = [lon: number, lat: number];
export type BoundingBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

//TODO: define name of the crs in the JSON schema
const tileMatrixCRS = "WebMercatorQuad ";
export default function createWMQTileMatrixSet(tileMatrices: TileMatrix[],
                                               fragmentOrdering: SpaceFillingCurveOrdering = "RowMajor",
                                       indexRecordOrdering: SpaceFillingCurveOrdering = "RowMajor",
                                       tileOrdering: SpaceFillingCurveOrdering = "RowMajor"): Metadata["tileMatrixSet"]{
    return {
        tileMatrixCRS,
        fragmentOrdering,
        tileOrdering,
        tileMatrixSet: tileMatrices
    }
}



/*
* Corresponds to the Tiled Coordinate Reference Systems of MapML
* see https://maps4html.org/MapML/spec/#tiled-coordinate-reference-systems-0
* */
export class TileMatrixFactory{
    private constructor(){}

    /*
    *
    * see https://docs.opengeospatial.org/is/17-083r2/17-083r2.html#62
    * Y-axis goes downwards like XYZ tiling scheme
    * */
    static createWebMercatorQuad(zoom, bounds: BoundingBox, aggregationCoefficient: number = 6): TileMatrix{
        const minTileCol = TileMatrixFactory.lon2tile(bounds[0], zoom);
        const minTileRow = TileMatrixFactory.lat2tile(bounds[1], zoom);
        const maxTileCol = TileMatrixFactory.lon2tile(bounds[2], zoom);
        const maxTileRow = TileMatrixFactory.lat2tile(bounds[3], zoom);
        //const matrixWidth = maxTileCol - minTileCol + 1;
        /* Y-axis goes downwards in the XYZ tiling scheme */
        //const matrixHeight = minTileRow -maxTileRow + 1;

        return {
            zoom,
            aggregationCoefficient,
            tileMatrixLimits: {
                minTileCol,
                minTileRow,
                maxTileCol,
                maxTileRow
            }
        }
    }

    /*
    * see https://docs.opengeospatial.org/is/17-083r2/17-083r2.html#63
    * */
    static createWorldCRS84Quad(): TileMatrix{
        throw new Error("Not implemented yet.");
    }

    private static lon2tile(lon,zoom): number{
        return Math.floor((lon+180)/360 * 2 **zoom);
    }

    //MBtiles uses tms global-mercator profile
    private static lat2tile(lat,zoom): number{
        const xyz = Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 * 2**zoom);
        return 2**zoom - xyz - 1;
    }
}


/*
In a TCRS (Tile matrix CRS), for each resolution, a tilematrix coordinate system groups underlying TCRS pixels into square tiles and
counts tiles with the origin at the upper left corner of the tiled space and increasing right (column axis, horizontal)
and downwards (row axis, vertical) respectively
 */
/*
    * TODO: extracts e.g. zurich can be smaller then the 1024 index cluster size even in high zoom levels -> how to handle?
    * -> always write 1024 as default or the real size of the only cluster
    * */
/*export class TileMatrix{

    constructor(private readonly _zoom: number, private readonly _topLeft: LngLat,
                        private readonly _matrixWidth, private readonly _matrixHeight,
                        private readonly _indexClusterWidth = 1024, private readonly _indexClusterHeight = 1024 ) {
    }


    get zoom(): number{
        return this._zoom;
    }

    get topLeft(): LngLat{
        return this._topLeft;
    }

    get matrixWidth(): number{
        return this._matrixWidth;
    }

    get maxtrixHeight(): number{
        return this._matrixHeight;
    }
}*/

