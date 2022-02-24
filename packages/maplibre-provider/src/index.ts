import maplibregl from "maplibre-gl";
import * as provider from "@comt/provider";

interface XyzIndex {
    x: number;
    y: number;
    z: number;
}

export default class MapLibreComtProvider {
    /**
     * Adds a COMT provider to MapLibre.
     * The COMT provider will be used when a source with a comt:// schema is used in a Mapbox style.
     */
    static register(): void {
        let comtCache: provider.ComtCache;

        maplibregl.addProtocol("comt", (params, tileHandler) => {
            const [tileUrl, url, z, x, y] = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
            const cancellationToken = new provider.CancellationToken();
            //TODO: extract comtUrl from url
            const xyzIndex = {
                x: parseInt(x, 10),
                y: parseInt(y, 10),
                z: parseInt(z, 10),
            };

            if (!comtCache) {
                provider.ComtCache.create(url).then((cache) => {
                    comtCache = cache;
                    MapLibreComtProvider.fetchTile(comtCache, xyzIndex, tileHandler, cancellationToken);
                });
            } else {
                MapLibreComtProvider.fetchTile(comtCache, xyzIndex, tileHandler, cancellationToken);
            }

            return { cancel: () => cancellationToken.cancel() };
        });
    }

    static fetchTile(comtCache: provider.ComtCache, xyzIndex: XyzIndex, tileHandler, cancellationToken): void {
        comtCache
            .getTile(xyzIndex.z, xyzIndex.x, xyzIndex.y, cancellationToken)
            .then((tile) => tileHandler(null, tile, null, null));
    }
}
