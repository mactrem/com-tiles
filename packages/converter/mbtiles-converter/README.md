## @com-tiles/mbtiles-converter

The `@com-tiles/mbtiles-converter` command line tool can be used to convert a MBTiles database into a COMTiles archive. The generated COMTiles archive can be hosted on an object storage like AWS S3 or Azure Blob Storage
and directly accessed from a browser with the [@com-tiles/maplibre-provider](../../maplibre-provider) library.
The main focus of COMTiles is to significantly reduce costs and simplify the hosting of large raster and vector tilesets at global scale in the cloud.

To use the `@com-tiles/mbtiles-converter` Node.js with version 16 or higher has to be installed on the system. 
Use the following command to install the `@com-tiles/mbtiles-converter`
````bash
npm i -g @com-tiles/mbtiles-converter
````

To display the help for how to use the `convert-comtiles` command execute
````bash
convert-comtiles -h
````

For converting a MBTiles database `test.mbtiles` into a COMTiles archive `test.comt` execute
````bash
convert-comtiles -i test.mbtiles -o test.comt
````

To specify until which zoom level the bounds of the tileset (TileMatrixLimits) should be queried from the db and not calculated 
based on the bounds of the MBTiles metadata table use the `--maxZoomDbQuery` or `-m` option (defaults to 7).   
It's common to have more tiles as an overview in the lower zoom levels then specified in the bounding box of the MBTiles metadata table.  
This is a trade off because querying the limits for all zoom levels from the db takes very long.  
````bash
convert-comtiles -i test.mbtiles -o test.comt -m 9
````
