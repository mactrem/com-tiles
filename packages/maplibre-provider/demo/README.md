## Running the COMTiles + MapLibre demo:

1. Use [planetiler](https://github.com/onthegomap/planetiler) to generate a MBTiles vector tiles dataset. <br> Pre-generated MBTiles tilesets for evaluation purpose or commercial usage can be downloaded from [maptiler](https://www.maptiler.com/)
2. Convert the MBTiles file into the COMTiles archive `mapdata.comt` using [`@mbtiles-converter`](https://github.com/mactrem/com-tiles/tree/main/packages/mbtiles-converter)
3. Use an object storage like AWS S3 or set up a MinIO docker container for local development
4. Upload the generated `mapdata.comt` to a mapdata-bucket
5. Update the following files <br> `style.json` → set the correct _tiles url_ in `line 7` <br> `tiles.json` → set the correct _mapdata filename_ in `line 566` <br> `index.html` → set the correct _style url_ in `line 24`
6. Upload the `style.json` and `tiles.json` files to the mapdata-bucket
7. Upload the fonts to an assets-bucket (fonts can be found in `@server/assets/fonts`)

As the `@com-tiles/maplibre-provider` package is currently not published, the transpiled file is accessed locally.

In order to work properly, you have to **enable CORS** in your object storage.

**The conversion from MBTiles to COMTiles can take some time.**

- Country extracts like germany < 1 min
- Continent extracts like europe can take up to 30 minutes
- Planet can take up to 9 hours
