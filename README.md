### Cloud Optimized Map Tiles (COM Tiles)

Why?
- in cloud native applications data are often stored in object stores (AWS S3, Azure Blob storage, ...)
- The geo/map services run in separated environment e.g. in a docker container
- current geospatial formats are build to be used on a classic server where the services have direct access to the files
  e.g. via posix calls (fopen)
    
Concept
- Http range requests
- Preserve locality for index and data to reduce number of range requests
- Index
    - 0-8 download full index
    - 9-14 only parts of the index
    
Problems
- No compression in range requests?
- How to request effectively parts of the index?
- Performance of large file vs SQLite database with indices?

Design
- Magic -> COMT -> 4 char
- Metdata Size -> int
- Index Size -> int
- Metadata -> UTF-8 encoded JSON
    - Version
    - BoundingBox
- Index -> based on a quadtree data structure
  - offset to tile -> 4 bytes
  - size -> 4 bytes
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
    

TODO: 
- Restricted to WebMercator?

Components 
- Generators
    - convert MVT stored in a MBTiles database to a COM Tiles
- MapServer
- Map client