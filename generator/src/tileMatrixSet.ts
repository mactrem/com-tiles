export enum CurveType{
    ROW_MAJOR = "Row-Major",
    HILBERT= "Hilbert",
    Z_ORDER= "Z-Order"
}

export enum TileMatrixCRS{
    OSMTILE = "OSMTILE",
    WGS84 = "WGS84"
}

export type LngLat = [lon: number, lat: number];
export type BoundingBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

export default class TileMatrixSet{
    constructor(private readonly _tileMatrix: TileMatrix[], private _tileMatrixCRS: TileMatrixCRS = TileMatrixCRS.OSMTILE,
                private readonly _indexCurveType = CurveType.ROW_MAJOR, private readonly _dataCurveType = CurveType.ROW_MAJOR) {
    }
}

/*
In a TCRS (Tile matrix CRS), for each resolution, a tilematrix coordinate system groups underlyingTCRS pixels into square tiles and
counts tiles with the origin at the upper left corner of the tiled space and increasing right (column axis, horizontal)
and downwards (row axis, vertical) respectively
 */
export class TileMatrix{
    /*
    * TODO: extracts e.g. zurich can be smaller then the 1024 index cluster size even in high zoom levels -> how to handle?
    * -> always write 1024 as default or the real size of the only cluster
    * */
    constructor(private readonly _zoom: number, private readonly _topLeft: LngLat,
                        private readonly _matrixWidth, private readonly _matrixHeight,
                        private readonly _indexClusterWidth = 1024, private readonly _indexClusterHeight = 1024 ) {
    }

    static lon2tile(lon,zoom): number{
        return Math.floor((lon+180)/360 * 2 **zoom);
    }

    static lat2tile(lat,zoom): number{
        return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 * 2**zoom);
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
}

/*
* Corresponds to the Tiled Coordinate Reference Systems of MapML
* see https://maps4html.org/MapML/spec/#tiled-coordinate-reference-systems-0
* */
export class TileMatrixFactory{
    private constructor(){}

    /*
    * see https://maps4html.org/MapML/spec/#tiled-coordinate-reference-systems-0#OSMTILE
    * */
    static createOsmTile(zoom, bounds: BoundingBox): TileMatrix{
        const startIndexColumn = TileMatrixFactory.lon2tile(bounds[0], zoom);
        const startIndexRow = TileMatrixFactory.lat2tile(bounds[1], zoom);
        const endIndexColumn = TileMatrixFactory.lon2tile(bounds[2], zoom);
        const endIndexRow = TileMatrixFactory.lat2tile(bounds[3], zoom);
        const matrixWidth = endIndexColumn - startIndexColumn + 1;
        /* Y-axis goes downwards in the XYZ tiling scheme */
        const matrixHeight = startIndexRow -endIndexRow + 1;

        return new TileMatrix(zoom, bounds.slice(0, 2) as LngLat, matrixHeight, matrixWidth)
    }

    /*
    * see https://maps4html.org/MapML/spec/#tiled-coordinate-reference-systems-0#WGS84
    * */
    static createWgs84(): TileMatrix{
        throw new Error("Not implemented yet.");
    }

    private static lon2tile(lon,zoom): number{
        return Math.floor((lon+180)/360 * 2 **zoom);
    }

    private static lat2tile(lat,zoom): number{
        return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 * 2**zoom);
    }
}

