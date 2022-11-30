## Running the COMTiles + MapLibre demo:


1. Generate a MBTiles database for using [planetiler](https://github.com/onthegomap/planetiler) or download from [openmaptiles](https://openmaptiles.org/)
2. Convert the MBTiles file into a COMTiles archive using `@mbtiles-converter`
3. Use an object-storage or set up a MinIO docker-container for local development
4. Upload the `mapdata.comt` to a "mapdata"-bucket
5. Update and upload the `style.json`, `tiles.json` and `comtiles.html` files to the "mapdata"-bucket
6. Upload the fonts to a "assets"-bucket (fonts can be found in `@server/assets/fonts`)

As the `@com-tiles/maplibre-provider` package is currently not published, the transpiled file is accessed locally.

In order to work properly, you have to **enable CORS** in your object storage.

**The conversion from MBTiles to COMTiles can take some time.** 

- small extracts *(like germany)* should be done pretty fast
- medium extracts *(like europe)* can take up to 30 minutes
- large extracts *(planet)* can take up to 9 hours
