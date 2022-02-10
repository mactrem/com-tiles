## Cloud Optimized Map Tiles (COMTiles)

Based on the ideas of [Cloud Optimized GeoTIFF](https://www.cogeo.org/) and extended for the usage of raster and in particular vector map tiles.  
COMTiles are a streamable and read optimized file archive for hosting map tilesets at global scale in a cloud object storage and accessing
the tiles or tile batches via http range requests.  
The main focus of COMTiles is to significantly reduce coasts for the hosting of large raster and vector tilesets at global scale 
in the cloud.  
COMTiles aims to be a MBTiles database for the cloud.

### Concept  
Currently most geospatial data formats (like MBTiles, Shapefiles, KML, ...) were developed only with the POSIX filesystem access in mind.  
COMTiles in contrast is designed to be hosted only on a cloud object storage like AWS S3 or Azure Blob Storage without the need for a database or server.  
Via COMTiles an object storage can be used as a spatial database for visualizing maps at global scale.  
The client can access the map tiles via HTTP range requests. 
One main design goal of COMTiles is to reduce the number of requests for performance and cost reasons.  
A COMTiles archive mainly consists of a header with metadata, an index and the actual map tiles.
The index
The index is also streamable which means that only parts of the index can be requested


A COMT archive consists of the following parts:
- Header  
  Contains in particular the metadata which describes the TileSet.  
  The metadata has a TileMatrixSet definition which describes the extend of the TileSet.  
  The concept and structure of the TileMatrixSet is inspired by the OGC draft 'OGC Two Dimensional Tile Matrix Set' .  
- Index  
  The index is designed for the minimal number of request -> performance and many
  In most cases only one index fragment fetch is needed before accessing the tiles. This can be cached later on.
  The index references the map tiles in the data section`` in a compact way and consists of a collection of index entries.  
  A index entry consist of a offset to the tile (default 5 bytes) and a size of a tile (4 bytes) in the data section.  
  One important concept of COMTiles is that the index is also streamable which means that only parts of the index (fragments) can be requested
  via http range requests.
  The index is structured in a way that the index entries of the index which are intersecting the current
  viewport of the map (and also with a additional buffer) can be requested with a minimal number of HTTP requests.  
- Body  
  Contains the actual raster or vector tiles.  

### Use Cases
- Displaying map tiles in the browser via a web mapping framework like MapLibreGL JS
- Downloading map extracts for the offline usage in apps
- Downloading map extracts for the hosting on a dedicated on-premise infrastructure

### Repository structure
- @comt/spec -> COMT file format specification
- @comt/provider -> Utility functions for working with COMTiles
- @comt/maplibre-provider -> COMTiles provider for MapLibre GL JS  
- @comt/server -> MapServer for serving tiles, can be hosted in a cloud native (serverless) environment
- @comt/mbtiles-converter -> Converting map tiles stored in a MBTiles database to a COM Tiles archive
- @comt/tilelive-comtiles -> Integration into tilelive for generating Mapbox Vector Tiles 

### Demo
In the following examples the map tiles are based on a MBTiles database from [MapTiler](https://www.maptiler.com/data/)  and converted to
a COMTiles archive with the mbtiles-converter.  
Example video with a europe tileset hosted on a local MinIO storage with a disabled browser cache:
[![COMTiles YouTube video](./assets/MinIO.png)](https://www.youtube.com/watch?v=puaJVVxT_KA)

Example video with a europe tileset hosted on a AWS S3 standard storage with a disabled browser cache:
[![COMTiles YouTube video](./assets/AwsS3.png)](https://www.youtube.com/watch?v=5StxZbfvMUw)


### References
- https://medium.com/planet-stories/cloud-native-geospatial-part-2-the-cloud-optimized-geotiff-6b3f15c696ed
- https://towardsdatascience.com/turn-amazon-s3-into-a-spatio-temporal-database-40f1a210e943
- https://github.com/flatgeobuf/flatgeobuf
- https://medium.com/@mojodna/tapalcatl-cloud-optimized-tile-archives-1db8d4577d92
- https://docs.tiledb.com/main/basic-concepts/terminology
- https://github.com/protomaps/PMTiles


  