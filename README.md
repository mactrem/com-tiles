### Cloud Optimized Map Tiles (COMTiles)

Inspired by [Cloud Optimized GeoTIFF](https://www.cogeo.org/) and extended for the usage of general raster and vector map tiles.  

What are COMTiles
- Most geospatial data formats were developed only with the POSIX filesystem access in mind
- In cloud native applications large datasets are often stored in object stores (AWS S3, Azure Blob Storage, ...)
- The geo/map services run in separated environment e.g. in a docker container
- current geospatial formats are build to be used on a classic server where the services have direct access to the files
  e.g. via posix calls (fopen)
- Use an object store like Amazon S3 as a spatial database -> basically there is no backend and database server needed
  - Using S3 as a spatial database can significantly reduce coasts compared to storing the large geospatial datasets in a dedicated database
- Client holds the logic for accessing the tiles

General
- This projects evaluates a cloud native (serverless) architecture for MapServer to reduce coasts for large amount of geospatial data
- A MapServer provides map tiles for map client
 
    
Concept
- Http range requests
- Preserve locality for index and data to reduce number of range requests
- Index
    - 0-8 download full index
    - 9-14 only parts of the index
    - Index is clustered -> the cluster are ordered as a hilbert curve
  
Index Design
- Client download full index for zoom 0-8 for the planet -> which size? (500k)
- Clients can query parts of the index -> center of the map can be used starting point with a specific buffer
- Every zoom level has to be requested with a separate http range request
  - Batch zoom levels via multipart ranges (multipart/byteranges) -> Get Range: bytes=200-400,100-300,500-600 
    -> not supported by the object store provider
- Buffering -> 15 Tiles around the current center of the map?
- The tile index can be  calculated because for every zoom level the number of tiles for rows and columns including the starting point
  are specified in the metadata so only rectangular areas are supported

    
General
- Limited to the Spherical Mercator tiling scheme?

Use Cases
- Browsing maps in the browser -> Also reduce number of tile request because of the space filling curve approach
- Downloading extracts for offline usage in apps
- Downloading extracts for hosting in dedicated on-premise infrastructure
    
Problems
- No compression in range requests?
- How to request effectively parts of the index?
- Performance of large file vs SQLite database with indices?

Design
- Magic -> COMT -> 4 char
- Metadata Size -> int
- Index Size -> int
- Metadata -> UTF-8 encoded JSON
    - Version
    - TileMatrixSet -> there can be different bounds for each zoom level e.g. 1-8 overview and 9-14 only extracts
      -  TileMatrixCRS -> OSMTile, WGS84
      -  IndexCurveType
      -  DataCurveType
      -  TileMatrix
- Index -> Clustered per zoom
  - Cluster size of the index -> current zoom - 6 e.g. current zoom 9, index cluster size zoom 3
  - 4^6 index entries -> 4096 -> 32Kb size for a index cluster ordered as hilbert curve
  - offset to tile -> 4 bytes
  - size -> 4 bytes
  - Within the index cluster the data could be compressed e.g. via protobuf and delta encoding -> no becuase then 
    the index offset could not be calculated
- Map data
- Number of tiles
  - Zoom 14 -> 268 million
  - Zoom 15 -> 1.1 billion
  - Zoom 16 -> 4.3 billion
  - Zoom 17 -> 17.2 billion
  - Zoom 18 -> 68.7 billion
  -> uint -> 4.3 billion 
  -> 5 bytes -> 1099.5 billion 
  -> 3 bytes -> 16.8 MB
-> varying index record size -> for z0-z15 4 bytes -> for >= z16 5 bytes -> better when uint max reached
    
    
This repo contains the following components: 
- Specification
- Generator: 
  - Convert tiles stored in a MBTiles database to a COM Tiles archive
  - The generated COM Tiles can be deployed to an cloud object storage like Azure Blob Storage or AWS S3
- Server: 
  - Proxy for providing COM Tiles via the XYZ tiling scheme to (map) clients
- Client: 
  - For accessing COM Tiles from an object storage 
  - Integration in MapLibre GL JS


TODO:
- Restricted to WebMercator?

Tasks:
- Create Website to switch between hilbert curve, z-order and row-major order and deploy to GitLab pages
- Implement generator for creating a COM-Tiles archive
- Host the COM-Tiles archive on S3 and implement a MapServer and deploy on AWS Lambda
- Compare costs and performance
