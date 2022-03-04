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

For performance reasons the full index is kept in memory.  
On Node.JS 16 and higher the default heap size is 4096 mb.  
This is enough for creating a COMTiles archive up to a classic vector tileset at planet scale with about 360 million tiles which has an index
about 3.1 gb in size.  
For creating a COMTiles with even more tiles the `--max-old-space-size` setting of Node.JS has 
to be adjusted.  
