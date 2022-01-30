## Cloud Optimized Map Tiles (COMTiles)

Based on the ideas of [Cloud Optimized GeoTIFF](https://www.cogeo.org/) and extended for the usage of raster and especially vector map tiles.  
The main focus of COMTiles is to significantly reduce coasts for the hosting of large raster and vector tilesets at global scale 
in the cloud.

### Concept  
Currently most geospatial data formats (like MBTiles, Shapefiles, KML, ...) were developed only with the POSIX filesystem access in mind.  
COMTiles in contrast is designed to be hosted only on a cloud object storage like AWS S3 or Azure Blob Storage without the need for a database or server.  
Via COMTiles an object storage can be used as a spatial database.  
The client can access the map tiles via HTTP range requests.  
A COMT archive consist of a header, index and body:
- Header  
  Contains the metadata which describes the TileSet.  
  The metadata contains a TileMatrixSet definition which describes the extend to the TileSet.  
  The concept and structure of the TileMatrixSet is inspired by the 'OGC Two Dimensional Tile Matrix Set' OGC draft.  
- Index  
  The index references the map tiles in the data section in a compact way and consists of a collection of index entries.  
  A index entry consist of a TileOffset (default 5 bytes) and TileSize (4 bytes).  
  One important concept of COMTiles is that the index is also streamable which means that only parts of the index (fragments) can be requested
  via http range requests.
  The index is structured in a way that the index entries of the index which are intersecting the current
  viewport of the map (and also with a additional buffer) can be requested with a minimal number of HTTP requests.  
- Body  
  Contains the actual raster or vector tiles.  

### Use Cases
- Displaying map tile in the browser via a web mapping framework like MapLibreGL JS
- Downloading map extracts for the offline usage in apps
- Downloading map extracts for the hosting in dedicated on-premise infrastructure

### Repository structure
- @comt/spec -> COMT file format specification
- @comt/provider -> Utility functions for working with COMTiles
- @comt/maplibre-provider -> COMTiles provider for MapLibre GL JS  
- @comt/server -> MapServer for serving tiles, can be hosted in a cloud native (serverless) environment
- @comt/mbtiles-converter -> Converting map tiles stored in a MBTiles database to a COM Tiles archive
- @comt/tilelive-comtiles -> Integration into tilelive for generating Mapbox Vector Tiles 

### References
- https://medium.com/planet-stories/cloud-native-geospatial-part-2-the-cloud-optimized-geotiff-6b3f15c696ed
- https://towardsdatascience.com/turn-amazon-s3-into-a-spatio-temporal-database-40f1a210e943
- https://github.com/flatgeobuf/flatgeobuf
- https://medium.com/@mojodna/tapalcatl-cloud-optimized-tile-archives-1db8d4577d92
- https://docs.tiledb.com/main/basic-concepts/terminology
- https://github.com/protomaps/PMTiles


  