import {Metadata} from "@com-tiles/spec";
import {TileMatrix} from "@com-tiles/spec/types/tileMatrix";
import {MBTilesRepository} from "./mbTilesRepository";

type IndexEntry = {offset: number, size: number};
type fragmentBounds = { minTileCol: number, minTileRow: number, maxTileCol: number, maxTileRow: number };

/**
 *
 * Create an index where the fragments and the index entries of a fragment are arrange in row-major order.
 *
 * @param tiles Map tiles in row-major order
 */
//export function createIndexInRowMajorOrder(tileRepository: TileRepository, tileMatrixSet: TileMatrix[]): IndexEntry[]{
//TODO: this doesn't scale because the index is stored in memory
export async function createIndexInRowMajorOrder(tileRepository: MBTilesRepository, tileMatrixSet: TileMatrix[]): IndexEntry[]{
    const index: IndexEntry[] = [];
    const minZoom = tileMatrixSet[0].zoom;
    const maxZoom = tileMatrixSet[tileMatrixSet.length-1].zoom;

    for(let zoom = minZoom; zoom <= maxZoom; zoom++){
        const tileMatrix = tileMatrixSet[zoom];
        const limits = tileMatrix.tileMatrixLimits;
        const numTiles = (limits.maxTileRow - limits.minTileRow + 1) * (limits.maxTileCol - limits.minTileRow + 1);

        //has to queried batched when not fragments are used -> in zoom 8 > 65k tiles
        /*const tileCache = tileRepository.getTilesByRowMajorOrder(
            {minColumn: limits.maxTileCol, maxColumn: limits.maxTileCol, minRow: limits.minTileRow, maxRow: limits.maxTileRow});*/
        /*
        * - query tiles per zoom level
        * - divide per fragment
        *   -> fragment limits in SqL query
        * - if no fragment -> batch if > 65k (4^8)
        *       -> calculate tile per zoom level -> if >
        *       -> limit and offset
        * */
        if(!useIndexFragmentation(tileMatrix)){
            //reference to the current tile in the js array
            let tileIndex = index.length;
            //reference to the current tile in the final blob
            let offset = index[tileIndex].offset;
            const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(zoom, tileMatrix.tileMatrixLimits);
            for await (const tileBatch of tileBatches){
                for (const {data} of tileBatch){
                    const size = data.length;
                    index.push({offset, size});
                    offset += size;
                }
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
                minTileCol: limits.minTileCol,
                minTileRow: limits.minTileRow,
                maxTileCol: limits.minTileCol + numFragmentsCol - 1,
                maxTileRow: limits.minTileRow + numFragmentsRow -1
            };

            /*
            * - Calculate the tile index bounds of the fragment -> starting by min and iterating column and row wise
            * - Look up in TileMatrixSet if the fragment is fully contained or if it is a sparse fragment
            *   - Case dense fragment -> iterate row by row by the number of IndexEntries
            *   - Case sparse fragment -> iterate row by row by the number of delta IndexEntries
            * */
            const tilesZoomOffset = index.length;
            for(let i = 0; i < numFragments; i++){
                if(isDense(tileMatrix.tileMatrixLimits, fragmentBounds)){
                    const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(zoom, fragmentBounds);

                    //calculate on which index the tiles array the fragment starts
                    //calculate num columns and rows before the fragment
                    const deltaRow = fragmentBounds.minTileRow - limits.minTileRow;
                    const deltaCol = fragmentBounds.minTileCol - limits.minTileCol;
                    //index in the tile array for the start of a index fragment row
                    let beforeTilesIndex = deltaRow * Math.sqrt(numTiles) + deltaCol;
                    //Iterate over all IndexEntries in the fragment
                    /*for(let row = 0; row < numFragmentsRow; row++){
                        for(let col = 0; col < numFragmentsCol; col++){
                            const tile = tiles[tilesZoomOffset + beforeTilesIndex];
                            const size = tile.length;
                            index.push({offset, size});
                            offset += size;
                            beforeTilesIndex++;
                        }

                        beforeTilesIndex += ((fragmentBounds.minTileCol - limits.minTileCol)
                            + (limits.maxTileCol - fragmentBounds.maxTileCol));
                    }*/
                    for await (const tileBatch of tileBatches){
                        for (const {data} of tileBatch){
                            const size = data.length;
                            const offset = index.length;
                            index.push({offset, size});
                        }
                    }
                }
                else{
                    //sparse fragment
                    //iterate over each IndexEntry and check for intersection with bounds of the TileSet -> can be optimized by calculating the area
                    //how to calculate beforeTileIndex
                    //calculate on which index the tiles array the fragment starts
                    //calculate num columns and rows before the fragment
                    /*const deltaRow = fragmentBounds.minTileRow - limits.minTileRow;
                    const deltaCol = fragmentBounds.minTileCol - limits.minTileCol;
                    let beforeTilesIndex = deltaRow * Math.sqrt(numTiles) + deltaCol;
                    //Iterate over all IndexEntries in the fragment
                    for(let row = 0; row < numFragmentsRow; row++){
                        for(let col = 0; col < numFragmentsRow; col++){
                            const currentCol =  fragmentBounds.minTileCol + col;
                            const currentRow =  fragmentBounds.minTileRow + row;

                            //test for intersection of the IndexEntry of the index fragment with bounds of the TileSet -> can be optimized by calculating the area
                            if(currentCol >= limits.minTileCol && currentRow >= limits.minTileRow &&
                                currentCol <= limits.maxTileCol && currentRow <= limits.maxTileRow){
                                //TODO: use TileCache via TileRepository
                                const tile = tiles[tilesZoomOffset + beforeTilesIndex];
                                const size = tile.length;
                                index.push({offset, size});
                                offset += size;
                                beforeTilesIndex++;
                            }
                        }

                        //TODO: does this work
                        const deltaCols = fragmentBounds.minTileCol - limits.minTileCol;
                        const deltaRows = limits.maxTileCol - fragmentBounds.maxTileCol;
                        //smaller 0 means this is a sparse row/column and should be ignored for the tile index calulation
                        beforeTilesIndex += ((deltaCols < 0 ? 0 : deltaCols) + (deltaRows < 0 ? 0 : deltaRows));
                    }*/

                    //TODO: optimize -> only query the intersection between fragment and index
                    const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(zoom, fragmentBounds);
                    for await (const tileBatch of tileBatches){
                        for (const {column, row, data} of tileBatch){
                            //test for intersection of the IndexEntry of the index fragment with bounds of the TileSet -> can be optimized by calculating the area
                            //TODO: get rid of this test by shifting it to the sql query
                            if(column >= limits.minTileCol && row >= limits.minTileRow &&
                                column <= limits.maxTileCol && row <= limits.maxTileRow){
                                const size = data.length;
                                const offset = index.length;
                                index.push({offset, size});
                            }

                        }
                    }
                }

                //increment tile index
                //set fragment bounds
                //add row
                if((i+1) % numFragmentsCol === 0){
                    //reset column and add row
                    fragmentBounds = {
                        minCol: limits.minTileCol,
                        minRow: fragmentBounds.maxTileRow +1,
                        maxCol: limits.minTileCol + Math.sqrt(numIndexEntriesPerFragment) -1,
                        maxRow: fragmentBounds.maxTileRow + Math.sqrt(numIndexEntriesPerFragment)
                    };
                }
                else{
                    //add column
                    fragmentBounds = {
                        minCol: fragmentBounds.maxTileCol + 1,
                        minRow: fragmentBounds.minTileRow,
                        maxCol: fragmentBounds.maxTileCol + Math.sqrt(numIndexEntriesPerFragment),
                        maxRow: fragmentBounds.maxTileRow
                    };
                }
            }
        }


    }

    return index;
}

function isDense(limits: TileMatrix["tileMatrixLimits"], fragmentBounds: fragmentBounds){
    return fragmentBounds.minTileCol >= limits.minTileCol && fragmentBounds.minTileRow >= limits.minTileCol
        && fragmentBounds.maxTileCol <= limits.maxTileCol && fragmentBounds.maxTileRow <= limits.maxTileRow;
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