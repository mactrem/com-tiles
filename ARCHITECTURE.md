Design
- Magic -> COMT -> 4 char
- MetadataBuilder Size -> int
- Index Size -> int
- MetadataBuilder -> UTF-8 encoded JSON
    - Version
    - TileMatrixBuilder -> there can be different bounds for each zoom level e.g. 1-8 overview and 9-14 only extracts
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
    
    