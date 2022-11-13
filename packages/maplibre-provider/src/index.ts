import maplibregl from "maplibre-gl";
import { CancellationToken, XyzIndex, ComtCache, HeaderFetchStrategy } from "@com-tiles/provider";

/*
 * The individual tile requests get batched to improve performance and in particular to reduce the storage costs.
 * This can reduce the number of tile requests up to 90%.
 * */
export enum TileFetchStrategy {
    BATCHED = "BATCHED",
    SINGLE = "SINGLE",
}

/**
 * The MapLibreComtProvider class has currently the following limitations regarding support of the COMTiles spec:
 * - The only supported TileMatrixCRS is WebMercatorQuad
 * - Only Mapbox vector tiles are supported as content of a map tile and no raster formats (PNG, WebP)
 * - The only supported space-filling curve type for the order of the index fragments and tiles is row-major
 * - Only index fragments can be loaded after the initial fetch.
 *   So with the first initial fetch all the unfragmented part of the index has to be fetched and can't be lazy loaded.
 */
export class MapLibreComtProvider {

    comtCaches: Map<string, ComtCache>;
    tileFetchStrategy: string;
    
    constructor(tileFetchStrategy = TileFetchStrategy.BATCHED) {
        this.comtCaches = new Map();
        this.tileFetchStrategy = tileFetchStrategy === TileFetchStrategy.BATCHED ? 'getTileWithBatchRequest' : 'getTile';
    }

    getCache(url) {
        let cache = this.comtCaches.get(url);
        if (!cache) {
            cache = ComtCache.createSync(url);
            this.comtCaches.set(url, cache);
        }
        return cache;
    }

    protocol = (params, callback) => {
        if (params.type === 'json') {
            const tilejson = { tiles: [params.url + "/{z}/{x}/{y}"] }
            callback(null, tilejson, null, null);
            return {
                cancel: () => {},
            };
        }
        else {
            const cancellationToken = new CancellationToken();
            const [, url, z, x, y] = params.url.match(/\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            const xyzIndex = {
                x: parseInt(x, 10),
                y: parseInt(y, 10),
                z: parseInt(z, 10),
            };
            this.getCache(url)[this.tileFetchStrategy](xyzIndex, cancellationToken)
                .then((tile) => callback(null, tile, null, null));
            return {
                cancel: () => {
                    cancellationToken.cancel();
                },
            };
        }
    }

    /**
     * Adds a COMT provider to MapLibre for displaying the map tiles of a COMTiles archive.
     * The COMT provider will be used when a source with a comt:// schema is used in a Mapbox style.
     */
    register(): void {
        maplibregl.addProtocol("comt", this.protocol);
    }
}
