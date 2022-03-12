import maplibregl from "maplibre-gl";
import * as provider from "@com-tiles/provider";
import { TileContent } from "@com-tiles/provider";

interface XyzIndex {
    x: number;
    y: number;
    z: number;
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
     *
     */
    static register(tileContent = TileContent.MVT): void {
        let comtCache: provider.ComtCache;

        maplibregl.addProtocol("comt", (params, tileHandler) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [tileUrl, url, z, x, y] = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            const cancellationToken = new provider.CancellationToken();
            const xyzIndex = {
                x: parseInt(x, 10),
                y: parseInt(y, 10),
                z: parseInt(z, 10),
            };

            if (!comtCache) {
                provider.ComtCache.create(url, TileContent.MVT, false).then((cache) => {
                    comtCache = cache;
                    MapLibreComtProvider.fetchTile(comtCache, xyzIndex, tileHandler, cancellationToken);
                });
            } else {
                MapLibreComtProvider.fetchTile(comtCache, xyzIndex, tileHandler, cancellationToken);
            }

            return { cancel: () => cancellationToken.cancel() };
        });
    }

    private static fetchTile(comtCache: provider.ComtCache, xyzIndex: XyzIndex, tileHandler, cancellationToken): void {
        comtCache
            .getTile(xyzIndex.z, xyzIndex.x, xyzIndex.y, cancellationToken)
            .then((tile) => tileHandler(null, tile, null, null));
    }
}
