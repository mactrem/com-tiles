import {Metadata} from "@com-tiles/spec";
import {TileMatrix} from "@com-tiles/spec/types/tileMatrix";

type IndexEntry = {offset: number, size: number};

/**
 *
 * Create an index where the fragments and the index entries of a fragment are arrange in row-major order.
 *
 * @param tiles Map tiles in row-major order
 */
export function createIndexInRowMajorOrder(tiles: Uint8Array[], tileMatrixSet: TileMatrix[]): IndexEntry[]{
    const index: IndexEntry[] = [];
    let offset = 0;

    const minZoom = tileMatrixSet[0].zoom;
    const maxZoom = tileMatrixSet[tileMatrixSet.length-1].zoom;
    let tileIndex = 0;
    for(let zoom = minZoom; zoom <= maxZoom; zoom++){
        const tileMatrix = tileMatrixSet[zoom];
        const limits = tileMatrix.tileMatrixLimits;
        const numTiles = (limits.maxTileRow - limits.minTileRow + 1) * (limits.maxTileCol - limits.minTileRow + 1);

        //tileIndex -> reference to the current tile in the js array -> index.length - 1
        //offset -> reference to the current tile in the final blob -> index[index.length-1].offset

        if(!useIndexFragmentation(tileMatrix)){
            for(let i = 0; i < numTiles; i++){
                const tile = tiles[tileIndex];
                const size = tile.length;
                index.push({offset, size});
                offset += size;
                tileIndex++;
            }
        }
        else{
            //use index fragments and sparse fragments
            const numIndexEntriesPerFragment = 4**tileMatrix.aggregationCoefficient;
            const numIndexEntriesPerSide = Math.sqrt(numIndexEntriesPerFragment);
            const fragmentMinColIndex = Math.floor(limits.minTileCol/numIndexEntriesPerSide);
            const fragmentMinRowIndex = Math.floor(limits.minTileRow/numIndexEntriesPerSide);
            const fragmentMaxColIndex = Math.floor(limits.maxTileCol/numIndexEntriesPerSide);
            const fragmentMaxRowIndex = Math.floor(limits.maxTileRow/numIndexEntriesPerSide);
            const numFragments = Math.ceil(numTiles / numIndexEntriesPerFragment);
            const numFragmentsCol = fragmentMaxColIndex - fragmentMinColIndex + 1;
            const numFragmentsRow = fragmentMaxRowIndex - fragmentMinRowIndex + 1;

            /*
            * Index Fragmentation
            * - The crs for index fragments starts at the top left corner, independent of the limits of the TileMatrixSet
            * - The number of rows/columns of a index fragment is determined by the aggregation factor
            * - Type of index fragments
            *   - dense -> all row and columns are defined and point to tile data
            *   - sparse
            *     - caculate min fragment and max fragment
            *     - case 1 -> left index fragments are dense
            *     - case 2
            *       -> num fragments col and row are different
            * */

            let fragmentBounds = {
                minCol: limits.minTileCol,
                minRow: limits.minTileRow,
                maxCol: limits.minTileCol + numFragmentsCol - 1,
                maxRow: limits.minTileRow + numFragmentsRow -1
            };

            /*
            * - Calculate the tile index bounds of the fragment -> starting by min and iterating column and row wise
            * - Look up in TileMatrixSet if the fragment is fully contained or if it is a sparse fragment
            *   - Case dense fragment -> iterate row by row by the number of IndexEntries
            *   - Case sparse fragment -> iterate row by row by the number of delta IndexEntries
            * */
            const tilesZoomOffset = tileIndex;
            for(let i = 0; i < numFragments; i++){
                //check if is dense
                if(fragmentBounds.minCol >= limits.minTileCol && fragmentBounds.minRow >= limits.minTileCol
                    && fragmentBounds.maxCol <= limits.maxTileCol && fragmentBounds.maxRow <= limits.maxTileRow){
                    //calculate on which index the tiles array the fragment starts
                    //calculate num columns and rows before the fragment
                    const deltaRow = fragmentBounds.minRow - limits.minTileRow;
                    const deltaCol = fragmentBounds.minCol - limits.minTileCol;
                    //index in the tile array for the start of a index fragment row
                    let beforeTilesIndex = deltaRow * Math.sqrt(numTiles) + deltaCol;
                    //Iterate over all IndexEntries in the fragment
                    for(let row = 0; row < numFragmentsRow; row++){
                        for(let col = 0; col < numFragmentsCol; col++){
                            const tile = tiles[tilesZoomOffset + beforeTilesIndex];
                            const size = tile.length;
                            index.push({offset, size});
                            offset += size;
                            beforeTilesIndex++;
                            tileIndex++;
                        }

                        beforeTilesIndex += ((fragmentBounds.minCol - limits.minTileCol)
                            + (limits.maxTileCol - fragmentBounds.maxCol));
                    }
                }
                else{
                    //sparse fragment
                    //iterate over each IndexEntry and check for intersection with bounds of the TileSet -> can be optimized by calculating the area
                    //how to calculate beforeTileIndex
                    //calculate on which index the tiles array the fragment starts
                    //calculate num columns and rows before the fragment
                    const deltaRow = fragmentBounds.minRow - limits.minTileRow;
                    const deltaCol = fragmentBounds.minCol - limits.minTileCol;
                    let beforeTilesIndex = deltaRow * Math.sqrt(numTiles) + deltaCol;
                    //Iterate over all IndexEntries in the fragment
                    for(let row = 0; row < numFragmentsRow; row++){
                        for(let col = 0; col < numFragmentsRow; col++){
                            const currentCol =  fragmentBounds.minCol + col;
                            const currentRow =  fragmentBounds.minRow + row;

                            //test for intersection of the IndexEntry of the index fragment with bounds of the TileSet -> can be optimized by calculating the area
                            if(currentCol >= limits.minTileCol && currentRow >= limits.minTileRow &&
                                currentCol <= limits.maxTileCol && currentRow <= limits.maxTileRow){
                                //TODO: use TileCache via TileRepository
                                const tile = tiles[tilesZoomOffset + beforeTilesIndex];
                                const size = tile.length;
                                index.push({offset, size});
                                offset += size;
                                beforeTilesIndex++;
                                tileIndex++;
                            }
                        }

                        //TODO: does this work
                        const deltaCols = fragmentBounds.minCol - limits.minTileCol;
                        const deltaRows = limits.maxTileCol - fragmentBounds.maxCol;
                        //smaller 0 means this is a sparse row/column and should be ignored for the tile index calulation
                        beforeTilesIndex += ((deltaCols < 0 ? 0 : deltaCols) + (deltaRows < 0 ? 0 : deltaRows));
                    }
                }

                //increment tile index
                //set fragment bounds
                //add row
                if((i+1) % numFragmentsCol === 0){
                    //reset column and add row
                    fragmentBounds = {
                        minCol: limits.minTileCol,
                        minRow: fragmentBounds.maxRow +1,
                        maxCol: limits.minTileCol + Math.sqrt(numIndexEntriesPerFragment) -1,
                        maxRow: fragmentBounds.maxRow + Math.sqrt(numIndexEntriesPerFragment)
                    };
                }
                else{
                    //add column
                    fragmentBounds = {
                        minCol: fragmentBounds.maxCol + 1,
                        minRow: fragmentBounds.minRow,
                        maxCol: fragmentBounds.maxCol + Math.sqrt(numIndexEntriesPerFragment),
                        maxRow: fragmentBounds.maxRow
                    };
                }
            }
        }


    }

    return index;
}

function useIndexFragmentation(tileMatrix: TileMatrix): boolean{
    return tileMatrix.aggregationCoefficient !== -1;
}

function createIndexWithoutFragments(tiles: Uint8Array[], numTiles: number, tileIndex: number, offset: number){
    for(let i = 0; i < numTiles; i++){
        const tile = tiles[tileIndex];
        const size = tile.length;
        index.push({offset, size});
        offset += size;
        tileIndex++;
    }
}