## @com-tiles/mbtiles-converter

The `@com-tiles/mbtiles-converter` command line tool can be used to convert a MBTiles file into a COMTiles archive. The generated COMTiles archive can be hosted on an object storage like AWS S3 or Azure Blob Storage
and directly accessed from a browser with the [@com-tiles/maplibre-provider](../../maplibre-provider) library. 

To use the `@com-tiles/mbtiles-converter` Node.js with version 16 or higher has to be installed on the system. 
Use the following command to install the `@com-tiles/mbtiles-converter`
````bash
npm install @com-tiles/mbtiles-converter
````

For converting a MBTiles database `test.mbtiles` into a COMTiles archive `test.comt` execute
````bash
convert-comtiles -i test.mbtiles -o test.comt
````