## Running the COMTiles + MapLibre demo:


1. Generate a MBTiles database for example by using [planetiler](https://github.com/onthegomap/planetiler).
2. Convert the MBTiles file into a COMTiles archive using `@mbtiles-converter`
3. Set up a MinIO docker-container
4. Upload the `mapdata.comt` to a "_mapdata_"-bucket
5. Update the `style.json`, `tiles.json` and `comtiles.html` files
6. Upload the `style.json`, `tiles.json` and `comtiles.html` files to the "_mapdata_"-bucket
7. Upload the fonts to a "_assets_"-bucket (fonts can be found in `@server/assets/fonts`)

As the `@com-tiles/maplibre-provider` package is currently not published, upload the transpiled file (`@maplibre-provider/dist/maplibreComtProvider.js`) to MinIO and update the path in the head section of `comtiles.html`.

The map is now available on [http://localhost:PORT/mapdata/comtiles.html](http://localhost:PORT/mapdata/comtiles.html)


