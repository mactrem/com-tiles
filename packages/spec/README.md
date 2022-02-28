# Cloud Optimized Map Tiles (COMT)
COMTiles are a streamable and read optimized file archive for storing raster and
in particular vector tilesets at global scale in a cloud object storage and accessing 
the tiles or tile batches via http range requests.  

## Specification

### Layout

Little endian encoding is used.  
A COMTiles file archive has the following layout:   
![layout](assets/layout.png)    
**Magic**  
4-byte ANSI string ("comt") 

**Version**    
The version of the COMTiles archive. It is currently 1.

**Metadata Length**  
Length of the metadata document encoded as unit32 in little-endian order.

**Index Length**    
Length of the index encoded as uint40 in little-endian order.

**Metadata**  
UTF-8 encoded JSON document which describes how to access the tileset, see [JSON Schema definition](metadata-schema/metadata.json).

**Index**    
The index consists of a array of index entries (records).  
A single index entry consists of a offset (default 5 bytes) and the size of the map tile (default 4 bytes)
in the data section. Offset and size are encoded as unsigned integers in the little-endian order.
With the defaults a map tile can have a maximum size of 4 GB and an offset of 1 TB.
The number of bytes for the offset can be defined via the `tileOffsetBytes` property in the metadata document.
For a planet scale vector tileset (zoom 0-14) the index is about 3 GB in size, which is to large to download the index as a whole.
To make the index streamable, so that only parts of the index can be fetched, the index is divided into `index fragments`.
The number of index entries per fragment is defined via the `aggregationCoefficient` property in the metadata document.
For quadtree based TileMatrixCRS like WebMercatorQuad it's recommended
to be power of 4 (NumberOfIndexRecordsPerFragment=4^aggregationCoefficient).
The aggregationCoefficient is defined for every zoom level and has a default value of 6 which means 4096 index entries are aggregated.
The boundaries of a tileset are defined via the `TileMatrixSet` data structure in the metadata document.
Depending on the tileset boundaries a index fragment can be a sparse or dense fragment.
Based on the `tile matrix set limits` structure defined in the metdata document the number of index entries in a sparse fragment can be calculated.
The order of how the index fragments are arranged can be defined with the `fragmentOrdering` property.
The order of how the index entries within an index fragment are arranged can be defined with the `tileOrdering` property.
Tests showed that index entries and fragments arranged in the `RowMajor` order (default) produces the best results.
In addition the index entries can also be ordered via the space filling curves `Z-order` and `Hilbert`.

**Data**  
The data section contains the actual vector or raster tile blobs.
The encoding is specified with the `tileFormat` property in the metadata document.
The used order of the map tiles can be specified via the `tileOrdering` property in the metadata document.
Besides the default value `RowMajor` there can be also the space filling curves `ZOrder` and `Hilbert`.

## Concepts

### TileMatrix
Inspired by 'OGC Two Dimensional Tile Matrix Set' OGC specification (draft).
- TileSet
- TileMatrix
- TileMatrixLimits

### Index Fragments

### Index Aggregation
Example for the index aggregation of sparse fragments:
- TileMatrixCRS: WebMercatorQuad
- Extracted Area: Europe and Africa
- Index fragment order: Row-Major

![sparseIndex](assets/sparseIndex.png)

### Loading the index

### Improvements for v2
- Only one absolute offset per fragment is stored and every index entry holds only the tile size.
  The client is responsible for resolving the absolute offset for the index entries of a fragment.
  This can reduce the index size for a planet vector tileset from 3gb to about 1.3gb.
- Compress the index and add a additional index table to the archive which references the variable sized index fragments.
  The full index table can be fetched within the initial request.

## Glossary
- MapTile
- TileSet
- TileMatrixSet
- TileMatrix
- TileMatrixLimits
- Index
- IndexFragment
- IndexEntry
- AggregationCoefficient: Specifies the Number of index entries aggregated in one index fragment. 
  For quadtree based TileMatrixCRS like WebMercatorQuad it's recommended
  to be power of 4.
  
