## @com-tiles/maplibre-provider

The `@com-tiles/maplibre-provider` package can be used to access a COMTiles archive hosted on an cloud object storage like AWS S3 directly from the browser.   
To display the map tiles from a COMTiles archive based on the MapLibre web mapping library register 
the `MapLibreComProvider` before creating a MapLibre map instance.  
For how to use the `MapLibreComProvider` class via the script tag see the following snippet.
````html
<script src="https://unpkg.com/@com-tiles/maplibre-provider@latest/dist/maplibreComtProvider.js"></script>
<script>
    comtiles.MapLibreComtProvider.register();
    const map = new maplibregl.Map({
        container: "map",
        style: "http://localhost:4711/assets/style.json",
        center: [0, 0],
        zoom: 0,
    });
</script>
````

For how to use the `MapLibreComProvider` class via the import statement see the following snippet.
````js
import  { MapLibreComtProvider } from "@com-tiles/maplibre-provider";

MapLibreComtProvider.register();
const map = new maplibregl.Map({...});
````

Make sure that the URL of the COMTiles archive is added to the sources list in the style definition (style.json) of the map
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
This can reduce the number of tile requests by about 90% on a 4k display and 50% on a HD display.  
To disable this optimization create the `MapLibreComtProvider` with the following options
````js
MapLibreComtProvider.register(TileContent.MVT, TileFetchStrategy.SINGLE)
````