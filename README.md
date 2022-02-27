## Cloud Optimized Map Tiles (COMTiles)

Based on the ideas of [Cloud Optimized GeoTIFF](https://www.cogeo.org/) and extended for the usage of raster and in particular vector map tilesets.
COMTiles are a streamable and read optimized file archive for hosting map tiles at global scale on a cloud object storage.
Currently most geospatial data formats (like MBTiles, Shapefiles, KML, ...) were developed only with the POSIX filesystem access in mind.
COMTiles in contrast is designed to be hosted on a cloud object storage like AWS S3 or Azure Blob Storage without the need for a database or server on the backend side.
The map tiles can be accessed directly from a browser via http range requests.
The main focus of COMTiles is to significantly reduce coasts and simplify the hosting of large raster and vector tilesets at global scale 
in the cloud.
Via COMTiles an object storage can be used as a spatial database for the visualization of map tiles. 
COMTiles aims to be a MBTiles database for the cloud.

### Concept  
The basic idea is to use an additional `index` which stores the address within the archive for and the size of a specific map tile.
For a planet wide vector tileset this index has about 3GB of size.
Because of that the index has to be streamable which means that only parts of the index can be requested to allow a fluent user experience already known for maps like Google Maps or OpenStreetMap.    
One main design goal of COMTiles is to minimize the number of http requests for the download of the index for performance and cost reasons.    
With Space Filling Curves (Hilber, Z-Order, Row-Major), directory based and fragment based different approaches had been evaluated
for finding the most effective way for structuring the index.  
Tests showed that subdividing the index peer zoom level in so called ``index fragments`` with a varialbe number of ``index entries`` referencing
the specific map tiles seems to be the most effective approach in terms of the number of http range requests.

A COMTiles file archive has the following layout:  
![layout](assets/layout.svg)

Based on the concept of index fragments most of the time only one additional pre-fetch is needed per zoom level before accessing the map tiles for the current viewport of the map.
This can also be prefetched later on
For example if we use a tileset of europe.
Zoom 0-10 are in the initial fetch.
For exploring a city like munich and die enviornment only one additonal
fetch for 11-14 is needed, which means 4 additional fetches for index fagments (37kb) are needed.

The extend of the tileset is defined in the ``TileMatrixSet`` of the metadata document.
The coneceptsye of TileMatrixSet and TileMatrixSet limits is based on the the OGC Matrix in the metadata document.
The concept and structure of the TileMatrixSet is inspired by the OGC draft 'OGC Two Dimensional Tile Matrix Set'


### Use Cases
- Displaying map tiles in the browser via a web mapping framework like MapLibreGL JS
- Downloading map extracts for the offline usage in apps
- Downloading map extracts for the hosting on a dedicated on-premise infrastructure

### Tools
- [@comt/mbtiles-converter](packages/converter/mbtiles-converter): To convert a MBTiles database to a COMTiles archive the @comt/mbtiles-converter command line tool can be used.    
- [@comt/provider](packages/provider): For displaying a COMTiles archive hosted on an object storage directly in the browser based on the MapLibre map framework the @comt/maplibre-provider package can be used.    
- [@comt/maplibre-provider](packages/maplibre-provider): For the integration in other web mapping libraries like OpenLayer or Leaflet the @comt/maplibre-provider package can be used.


#### Repository structure
- @comt/spec -> COMTiles file format specification
- @comt/provider -> Utility functions for working with COMTiles
- @comt/maplibre-provider -> COMTiles provider for MapLibre GL JS  
- @comt/server -> MapServer for serving tiles, can be hosted in a cloud native (serverless) environment
- @comt/mbtiles-converter -> Converting map tiles stored in a MBTiles database to a COMTiles archive
- @comt/tilelive-comtiles -> Integration into tilelive for generating Mapbox Vector Tiles 

### Demo
In the following examples the map tiles are based on a MBTiles database from [MapTiler](https://www.maptiler.com/data/)  and converted to
a COMTiles archive with the mbtiles-converter.  
Example video with a europe tileset hosted on a local MinIO storage with a disabled browser cache:
[![COMTiles YouTube video](./assets/MinIO.png)](https://www.youtube.com/watch?v=puaJVVxT_KA)

Example video with a europe tileset hosted on a AWS S3 standard storage with a disabled browser cache:
[![COMTiles YouTube video](./assets/AwsS3.png)](https://www.youtube.com/watch?v=5StxZbfvMUw)


### Advantages over directly hosting the map tiles
Loading up over 350 million tiles for a planet scale vector tiels dataset is expensive in the upload and time consuming.
Also it's hard to handle such a large number of files and leaded to the creation of MBTiles.
-> purpose of geopackage or MBTiles
also the water tiles which are 2/3 of the whole planet dataset is inprecticble
Any global-scale map system must acknowledge the earth is 70% ocean. Map image APIs already take advantage of this by special-casing solid blue PNG images.
and wasting of money
One archive file with the metdata and tiles in one file.
-> time consuming
-> put request costs
-> water tiles have to be stored
-> not a single format for metadata

### Similar formats
#### Cloud Optimized GeoTiff
only raster
#### GeoFlatBuf
focus on analysis
#### PMTiles
see video
#### Cotar
Index is not streamable which limits the use case for smaller extracts

### References
- https://medium.com/planet-stories/cloud-native-geospatial-part-2-the-cloud-optimized-geotiff-6b3f15c696ed
- https://towardsdatascience.com/turn-amazon-s3-into-a-spatio-temporal-database-40f1a210e943
- https://github.com/flatgeobuf/flatgeobuf
- https://medium.com/@mojodna/tapalcatl-cloud-optimized-tile-archives-1db8d4577d92
- https://docs.tiledb.com/main/basic-concepts/terminology
- https://github.com/protomaps/PMTiles


  