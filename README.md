## Cloud Optimized Map Tiles (COMTiles)
Based on the ideas of [Cloud Optimized GeoTIFF](https://www.cogeo.org/) and extended for the usage of raster and in particular vector map tilesets.
COMTiles are a streamable and read optimized file archive for hosting map tiles at global scale on a cloud object storage.
Currently most geospatial data formats (like MBTiles, Shapefiles, KML, ...) were developed only with the POSIX filesystem access in mind.
COMTiles in contrast is designed to be hosted on a cloud object storage like AWS S3 or Azure Blob Storage without the need for a database or server on the backend side.
The map tiles can be accessed directly from a browser via HTTP GET range requests.
The main focus of COMTiles is to significantly reduce coasts and simplify the hosting of large raster and vector tilesets at global scale
in the cloud.
Via COMTiles an object storage can be used as a spatial database for the visualization of map tiles.
COMTiles aims to be a MBTiles database for the cloud.

### Concept
A COMTiles archive mainly consists of a metdata, index and data section.  
For a more detailed description of the format have a look at the [specification](packages/spec).

A COMTiles file archive has the following layout:  
![layout](assets/layout.svg)

#### Metadata
The metadata section describes the properties, structure and content of the tileset encoded in a [JSON document](packages/spec/metadata-schema).
The definiton of the structure and boundaries of a tileset are based on the `OGC Two Dimensional Tile Matrix Set` specification.
All `TileMatrixSets` listed in the [Common TileMatrixSet definitions](http://docs.opengeospatial.org/is/17-083r2/17-083r2.html#61) are supported with `Web Mercator Quad` as the default.
A subset of the tileset can be defined based on the `tile matrix set limits` data structure.

#### Data
The data section contains the actual vector or raster tiles.
The encoding of the map tiles (pbf, jpg, png, webp) is specified with the `tileFormat` property of the metadata document.
The offset wihtin the data section for and the size of a specific tile is defined in the `index`.
Based on the information of the index the tiles can be request with HTTP GET range requests.
To improve the latency the single tile requests for a specific viewport of a map can be batched.
To minimize the number of batched tile requests the tiles in the data section should be ordered on a space-filling curve.
The ordering of the tiles can be specified with the `tileOrdering` property (Hilbert, Z-Order, Row-Major) of the metadata document.

#### Index
The basic concept of a COMTiles archive is to create an additional `index` which stores the references (offset and size) to the actual map tiles located in the data section via so called `index entries (records)`.  
For a planet wide vector tileset this index has about 3 gb in size (will be optimized in v2 to about 1.3 gb).
Because of the resulting size for large tilesets the index has to be streamable which means that only parts of the index can be requested to allow a fluent user experience already known for maps like Google Maps or OpenStreetMap.    
One main design goal of COMTiles is to minimize the number of HTTP GET range requests for the download of parts of the index for performance and cost reasons.    
With ordering the index as a Space Filling Curves (Hilbert, Z-Order, Row-Major), packing pyramids into directories and aggregating the index in fragments three different approaches has been evaluated.
Tests showed that subdividing the index peer zoom level in so called ``index fragments`` with a variable number of ``index entries`` referencing
the specific map tiles seems to be the most effective approach in terms of the number of http range requests for viusalizing map tiles at global scale.
Based on the concept of index fragments most of the time only one additional pre-fetch per zoom level is needed before accessing the map tiles for the current viewport of the map.
The fragments can be cached on client side which omits the prefetch step for accessing the same viewport again.
Depending on the boundaries of the tileset the index fragments can be sparse or dense.
Based on the `tile matrix set limits` structure defined in the metdata document the number of index entries in a sparse fragment can be calculated.
In addition parts of the index can also be unfragmented which means the index entries are not aggregated into fragments.
The unfragmented part of the index must be downloaded with the first initial fetch when the page loads.
For a planet wide tileset this should be zoom 0 to 7.

### Tools
- [@comt/mbtiles-converter](packages/converter/mbtiles-converter): To convert a MBTiles database to a COMTiles archive the @comt/mbtiles-converter command line tool can be used.
- [@comt/provider](packages/provider): For displaying a COMTiles archive hosted on an object storage directly in the browser based on the MapLibre map framework the @comt/maplibre-provider package can be used.
- [@comt/maplibre-provider](packages/maplibre-provider): For the integration in other web mapping libraries like OpenLayer or Leaflet the @comt/maplibre-provider package can be used.

### Repository structure
- @comt/spec -> COMTiles file format specification
- @comt/provider -> Utility functions for working with COMTiles
- @comt/maplibre-provider -> COMTiles provider for MapLibre GL JS
- @comt/server -> MapServer for serving tiles, can be hosted in a cloud native (serverless) environment
- @comt/mbtiles-converter -> Converting map tiles stored in a MBTiles database to a COMTiles archive
- @comt/tilelive-comtiles -> Integration into tilelive for generating Mapbox Vector Tiles

### Demo
In the following examples the europe tileset is based on a MBTiles database from [MapTiler](https://www.maptiler.com/data/) and converted to
a COMTiles archive with the @comt/mbtiles-converter.
The index for zoom level 0 to 10 is part of the initial fetch when the page is loaded.
For zoom 11 to 14 the index fragments with a size of 37kb are lazy loaded.
For exploring a city like munich and surroundings only one additonal HTTP request per zoom level is needed.

Europe tileset hosted on a local MinIO storage with a disabled browser cache:
[![COMTiles YouTube video](./assets/MinIO.png)](https://www.youtube.com/watch?v=puaJVVxT_KA)

Europe tileset hosted on a AWS S3 standard storage with a disabled browser cache:
[![COMTiles YouTube video](./assets/AwsS3.png)](https://www.youtube.com/watch?v=5StxZbfvMUw)


### Similar formats
#### Cloud Optimized GeoTiff
A [Cloud Optimized GeoTIFF (COG) ](https://www.cogeo.org/) is a regular GeoTIFF file with an internal organization that let clients ask for just the portions of a file that they need
via HTTP GET range requests. A COG is limited to raster data.

#### FlatGeobuf

#### PMTiles
PMTiles is a single-file archive format for pyramids of map tiles.
For a comparison see the following [video](https://www.youtube.com/watch?v=e1VvLJeduRo).

#### Cotar


### Use Cases
- Displaying map tiles directly in the browser via a web mapping framework like MapLibreGL JS
- Downloading map extracts for the offline usage in apps
- Downloading map extracts for the hosting on a dedicated on-premise infrastructure

### References
- https://medium.com/planet-stories/cloud-native-geospatial-part-2-the-cloud-optimized-geotiff-6b3f15c696ed
- https://towardsdatascience.com/turn-amazon-s3-into-a-spatio-temporal-database-40f1a210e943
- https://github.com/flatgeobuf/flatgeobuf
- https://medium.com/@mojodna/tapalcatl-cloud-optimized-tile-archives-1db8d4577d92
- https://docs.tiledb.com/main/basic-concepts/terminology
- https://github.com/protomaps/PMTiles


  