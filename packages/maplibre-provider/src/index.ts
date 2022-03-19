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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * Adds a COMT provider to MapLibre for displaying the map tiles of a COMTiles archive.
     * The COMT provider will be used when a source with a comt:// schema is used in a Mapbox style.
     *
     * @param tileFetchStrategy Specifies if the tiles should be fetched in batches or tile by tile.
     */
    static register(tileFetchStrategy = TileFetchStrategy.BATCHED): void {
        let comtCache: ComtCache;
        let fetchTiles: (index: XyzIndex, token: CancellationToken) => Promise<Uint8Array>;
        maplibregl.addProtocol("comt", (params, tileHandler) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [tileUrl, url, z, x, y] = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            const cancellationToken = new CancellationToken();
            const xyzIndex = {
                x: parseInt(x, 10),
                y: parseInt(y, 10),
                z: parseInt(z, 10),
            };

            if (!comtCache) {
                ComtCache.create(url, HeaderFetchStrategy.LAZY).then((cache) => {
                    comtCache = cache;

                    fetchTiles = (
                        tileFetchStrategy === TileFetchStrategy.BATCHED
                            ? comtCache.getTileWithBatchRequest
                            : comtCache.getTile
                    ).bind(comtCache);
                    MapLibreComtProvider.fetchTile(xyzIndex, tileHandler, cancellationToken, fetchTiles);
                });
            } else {
                MapLibreComtProvider.fetchTile(xyzIndex, tileHandler, cancellationToken, fetchTiles);
            }

            return {
                cancel: () => {
                    cancellationToken.cancel();
                },
            };
        });
    }

    private static fetchTile(
        xyzIndex: XyzIndex,
        tileHandler,
        cancellationToken: CancellationToken,
        fetchTiles: (index: XyzIndex, token: CancellationToken) => Promise<Uint8Array>,
    ): void {
        fetchTiles(xyzIndex, cancellationToken).then((tile) => tileHandler(null, tile, null, null));
    }
}
