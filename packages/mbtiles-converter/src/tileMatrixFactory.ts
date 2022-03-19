import { Metadata } from "@com-tiles/spec";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { SpaceFillingCurveOrdering } from "@com-tiles/spec/types/spaceFillingCurveOrdering";

export type LngLat = [lon: number, lat: number];
export type BoundingBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

const WMQ_TILE_MATRIX_CRS = "WebMercatorQuad";
const DEFAULT_SFC = "RowMajor";

export default function createWmqTileMatrixSet(
    tileMatrices: TileMatrix[],
    fragmentOrdering: SpaceFillingCurveOrdering = DEFAULT_SFC,
    tileOrdering: SpaceFillingCurveOrdering = DEFAULT_SFC,
): Metadata["tileMatrixSet"] {
    return {
        tileMatrixCRS: WMQ_TILE_MATRIX_CRS,
        fragmentOrdering,
        tileOrdering,
        tileMatrix: tileMatrices,
    };
}

/*
 * Based on the OGC Two Dimensional Tile Matrix Set draft.
 * See https://docs.opengeospatial.org/is/17-083r2/17-083r2.html
 * */
export class TileMatrixFactory {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    static createWebMercatorQuadFromLatLon(zoom: number, bounds: BoundingBox, aggregationCoefficient = 6): TileMatrix {
        const minTileCol = TileMatrixFactory.lon2tile(bounds[0], zoom);
        const minTileRow = TileMatrixFactory.lat2tile(bounds[1], zoom);
        //TODO: quick and dirty hack -> find proper solution
        const maxTileCol = TileMatrixFactory.lon2tile(bounds[2] - 0.00000001, zoom);
        const maxTileRow = TileMatrixFactory.lat2tile(bounds[3], zoom);

        return TileMatrixFactory.createWebMercatorQuad(
            zoom,
            { minTileCol, minTileRow, maxTileCol, maxTileRow },
            aggregationCoefficient,
        );
    }

    /*
     * see https://docs.opengeospatial.org/is/17-083r2/17-083r2.html#62
     * */
    static createWebMercatorQuad(
        zoom: number,
        limits: TileMatrix["tileMatrixLimits"],
        aggregationCoefficient = 6,
    ): TileMatrix {
        /* Y-axis goes downwards in the XYZ tiling scheme */
        return {
            zoom,
            aggregationCoefficient,
            tileMatrixLimits: {
                minTileCol: limits.minTileCol,
                minTileRow: limits.minTileRow,
                maxTileCol: limits.maxTileCol,
                maxTileRow: limits.maxTileRow,
            },
        };
    }

    /*
     * see https://docs.opengeospatial.org/is/17-083r2/17-083r2.html#63
     * */
    static createWorldCRS84Quad(
        zoom: number,
        limits: TileMatrix["tileMatrixLimits"],
        aggregationCoefficient = 6,
    ): TileMatrix {
        throw new Error("Not implemented yet.");
    }

    private static lon2tile(lon: number, zoom: number): number {
        return Math.floor(((lon + 180) / 360) * 2 ** zoom);
    }

    /* MBTiles uses tms global-mercator profile */
    private static lat2tile(lat: number, zoom: number): number {
        const xyz = Math.floor(
            ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
                2 ** zoom,
        );
        return 2 ** zoom - xyz - 1;
    }
}
