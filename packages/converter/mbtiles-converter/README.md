## COMTiles mbtiles-converter

Converts a MBTiles file into a COMTiles archive.  
Currently the full index of the COMTiles archive is loaded into memory.  
For a COMTiles archive at planet scale the index can have approximately 3 GB in size.  
For converting a plant scale MBTiles database the ```--max-old-space-size``` of the Node process has to be adjusted.
  