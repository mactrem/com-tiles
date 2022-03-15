import maplibregl from "maplibre-gl";
import * as provider from "@com-tiles/provider";
import { TileContent, CancellationToken } from "@com-tiles/provider";

interface XyzIndex {
    x: number;
    y: number;
    z: number;
}

export enum TileFetchStrategy {
    BATCHED,
    SINGLE,
}

export class MapLibreComtProvider {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    private initComtCache = false;

    /**
     * Adds a COMT provider to MapLibre.
     * The COMT provider will be used when a source with a comt:// schema is used in a Mapbox style.
     *
     * @param tileContent Content type of the map tiles.
     * Only Mapbox Vector Tiles are currently supported as content of a map tile.
     * @param tileFetchStrategy Specifies if the tiles should be fetched in batches or tile by tile.
     */
    static register(tileContent = TileContent.MVT, tileFetchStrategy = TileFetchStrategy.BATCHED): void {
        let comtCache: provider.ComtCache;
        //TODO: refactor
        let fetchTiles: (...params: any) => Promise<Uint8Array>;

        maplibregl.addProtocol("comt", (params, tileHandler) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [tileUrl, url, z, x, y] = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            console.log("fetching %s/%s/%s %s", z, x, y, new Date().getTime());

            const cancellationToken = new provider.CancellationToken();
            const xyzIndex = {
                x: parseInt(x, 10),
                y: parseInt(y, 10),
                z: parseInt(z, 10),
            };

            if (!comtCache) {
                provider.ComtCache.create(url, tileContent, false).then((cache) => {
                    comtCache = cache;

                    fetchTiles = (
                        tileFetchStrategy === TileFetchStrategy.BATCHED
                            ? comtCache.getTileWithBatchedRequest
                            : comtCache.getTile
                    ).bind(comtCache);
                    MapLibreComtProvider.fetchTile(xyzIndex, tileHandler, cancellationToken, fetchTiles);
                });
            } else {
                MapLibreComtProvider.fetchTile(xyzIndex, tileHandler, cancellationToken, fetchTiles);
            }

            return { cancel: () => cancellationToken.cancel() };
        });
    }

    private static fetchTile(
        xyzIndex: XyzIndex,
        tileHandler,
        cancellationToken: CancellationToken,
        fetchTiles: (...params: any) => Promise<Uint8Array>,
    ): void {
        fetchTiles(xyzIndex.z, xyzIndex.x, xyzIndex.y, cancellationToken).then((tile) =>
            tileHandler(null, tile, null, null),
        );
    }
}
