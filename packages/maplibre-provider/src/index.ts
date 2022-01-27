import maplibregl from "maplibre-gl";
import ComtCache, { CancellationToken } from "@comt/provider";

let comtCache: ComtCache;
export default function registerComtProtocolHandler() {
    maplibregl.addProtocol("comt", (params, callback) => {
        const result = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
        const [tileUrl, url, z, x, y] = result;

        const cancellationToken = new CancellationToken();

        //TODO: extract comtUrl from url
        if (!comtCache) {
            ComtCache.create(url).then((c) => {
                comtCache = c;
                queryTile(z, x, y, callback, cancellationToken);
            });
        } else {
            queryTile(z, x, y, callback, cancellationToken);
        }

        return { cancel: cancellationToken.cancel };
    });
}

/*let comtCache: ComtCache;
maplibregl.addProtocol("comt", (params, callback) => {
    const result = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
    const [tileUrl, url, z, x, y] = result;

    const cancellationToken = new CancellationToken();

    //TODO: extract comtUrl from url
    if (!comtCache) {
        ComtCache.create(url).then((c) => {
            comtCache = c;
            queryTile(z, x, y, callback, cancellationToken);
        });
    } else {
        queryTile(z, x, y, callback, cancellationToken);
    }

    return { cancel: cancellationToken.cancel };
});*/

function queryTile(z, x, y, callback, cancellationToken) {
    comtCache
        .getTile(parseInt(z), parseInt(x), parseInt(y), cancellationToken)
        .then((tile) => callback(null, tile, null, null));
}

/*maplibregl.addProtocol("comt", async (params, callback) => {
    const result = params.url.match(/comt:\/\/(.+)\/(\d+)\/(\d+)\/(\d+)/);
    const [tileUrl, url, z, x, y] = result;

    //TODO: extract comtUrl from url
    comtCache ??= await ComtCache.create(url);
    const cancellationToken = new CancellationToken();
    const tile = await comtCache.getTile(parseInt(z), parseInt(x), parseInt(y), cancellationToken);
    callback(null, tile, null, null);

    return { cancel: cancellationToken.cancel };
});*/
