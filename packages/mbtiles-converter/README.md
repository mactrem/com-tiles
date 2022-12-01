## @com-tiles/mbtiles-converter

The `@com-tiles/mbtiles-converter` command line tool can be used to convert a MBTiles database into a COMTiles archive. The generated COMTiles archive can be hosted on an object storage like AWS S3 or Azure Blob Storage
and directly accessed from a browser with the [@com-tiles/maplibre-provider](../../maplibre-provider) library.
The main focus of COMTiles is to significantly reduce costs and simplify the hosting of large raster and vector tilesets at global scale in the cloud.

## How to use

### Requirements

In order to use `@com-tiles/mbtiles-converter` your system must have **Node.js v16 or higher**.

### Build and link`@com-tiles/mbtiles-converter`
````bash
cd packages/mbtiles-converter
npm run build
npm run link
````
The command `convert-comtiles` should now be available on your system

### Show help
````bash
convert-comtiles -h
````

### Example
````bash
convert-comtiles -i input.mbtiles -o output.comt
````

### Options

`-i, --inputFilePath <path>` → specify path and filename of the MBTiles database <br>
`-o, --outputFilePath <path>` → specify path and filename of the COMT archive file <br>
`-m, --maxZoomDbQuery <number>` → specify to which zoom level the TileMatrixLimits should be queried from the database and not calculated based on the bounds

