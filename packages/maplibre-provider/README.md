## @com-tiles/maplibre-provider

The `@com-tiles/maplibre-provider` package can be used to access a COMTiles archive hosted on an object storage like AWS S3 directly from the browser 
and display the map tiles based on the MapLibre web mapping framework.

Register the `MapLibreComProvider` before creating a MapLibre map instance
````js
import  { MapLibreComtProvider } from "@com-tiles/maplibre-provider";

MapLibreComtProvider.register();

const map = new maplibregl.Map({
    container: "map",
    style: "http://localhost:4711/assets/style.json",
    center: [0, 0],
    zoom: 0,
});
````

Make sure that the address to the COMTiles archive is added to the sources list in the style definition (style.json) of the map
with a `comt://` prefix like in the following example
````json
"test-source": {
    "type": "vector",
    "tiles": [
      "comt://http://0.0.0.0:9000/comtiles/test.comt/{z}/{x}/{y}"
    ]
    "maxzoom": 14
}
````

Per default the individual tile requests get batched to improve performance and in particular to reduce the storage costs.  
This can reduce the number of tile requests about 90% on a 4k display and 50% on a HD display.  
To disable this optimization create the `MapLibreComtProvider` with the following options
````js
MapLibreComtProvider.register(TileContent.MVT, TileFetchStrategy.SINGLE)
````
