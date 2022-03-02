## @com-tiles/maplibre-provider

The `@com-tiles/maplibre-provider` package can be used to access a COMTiles archive hosted on an object storage like AWS S3 directly from the browser 
and display the map tiles based on the MapLibre web mapping framework.

Register the `MapLibreComProvider` before creating a MapLibre map instance
````js
import MapLibreComtProvider from "../src/index";

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