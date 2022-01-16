import {TileMatrix} from "@com-tiles/spec/types/tileMatrix";
import {MBTilesRepository} from "./mbTilesRepository";

/* 5 bytes offset and 3 bytes size as default */
export type IndexEntry = {offset: number, size: number, zoom: number, row: number, column: number};
type fragmentBounds = { minTileCol: number, minTileRow: number, maxTileCol: number, maxTileRow: number };

/**
 *
 * Create an index where the fragments and the index entries of a fragment are arranged in row-major order.
 *
 * @param tiles Map tiles in row-major order
 */
//export function createIndexInRowMajorOrder(tileRepository: TileRepository, tileMatrixSet: TileMatrix[]): IndexEntry[]{
//TODO: this doesn't scale because the index is stored in memory
export async function createIndexInRowMajorOrder(tileRepository: MBTilesRepository, tileMatrixSet: TileMatrix[]): Promise<IndexEntry[]>{
    const index: IndexEntry[] = [];
    const minZoom = tileMatrixSet[0].zoom;
    const maxZoom = tileMatrixSet[tileMatrixSet.length-1].zoom;

    for(let zoom = minZoom; zoom <= maxZoom; zoom++){
        const tileMatrix = tileMatrixSet[zoom];
        const limits = tileMatrix.tileMatrixLimits;
        const numTiles = (limits.maxTileRow - limits.minTileRow + 1) * (limits.maxTileCol - limits.minTileCol+ 1);

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
            let tileIndex = index.length -1;
            //reference to the current tile in the final blob
            let offset = index.length ? (index[tileIndex].offset + index[tileIndex].size) : 0;
            const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(zoom, tileMatrix.tileMatrixLimits);
            //const t = (await tileBatches).next();
            for await (const tileBatch of tileBatches){
                for (const {data, row, column} of tileBatch){
                    const size = data.length;
                    index.push({offset, size,zoom, row, column});
                    offset += size;
                }
            }
        }
        else{
            //use index fragments and sparse fragments
            const numIndexEntriesPerFragment = 4**tileMatrix.aggregationCoefficient;
            const numIndexEntriesPerFragmentSide = Math.sqrt(numIndexEntriesPerFragment);
            const fragmentMinColIndex = Math.floor(limits.minTileCol/numIndexEntriesPerFragmentSide);
            const fragmentMinRowIndex = Math.floor(limits.minTileRow/numIndexEntriesPerFragmentSide);
            const fragmentMaxColIndex = Math.floor(limits.maxTileCol/numIndexEntriesPerFragmentSide);
            const fragmentMaxRowIndex = Math.floor(limits.maxTileRow/numIndexEntriesPerFragmentSide);
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
            /*
            * CRS
            * - Fragment CRS
            *   -> needed for iteration
            *   -> calculate tile crs from fragment crs
            * - Tile CRS -> needed for db query
            * - Calculate the tile index bounds of the fragment -> starting by min and iterating column and row wise
            * - Look up in TileMatrixSet if the fragment is fully contained or if it is a sparse fragment
            *   - Case dense fragment -> iterate row by row by the number of IndexEntries
            *   - Case sparse fragment -> iterate row by row by the number of delta IndexEntries
            * */

            let fragmentBounds = {
                minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
                minTileRow: fragmentMinRowIndex * numIndexEntriesPerFragmentSide,
                maxTileCol: ((fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide) - 1,
                maxTileRow: ((fragmentMinRowIndex + 1) * numIndexEntriesPerFragmentSide) - 1
            };

            for(let row = 0; row < numFragmentsRow; row++){
                for(let col = 0; col < numFragmentsCol; col++){
                    const sparseFragmentBounds = calculateSparseFragmentBounds(limits, fragmentBounds);
                    const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(zoom, sparseFragmentBounds);
                    for await (const tileBatch of tileBatches){
                        for (const {column, row, data} of tileBatch){
                            const size = data.length;
                            let tileIndex = index.length - 1;
                            let offset = index.length ? (index[tileIndex].offset + index[tileIndex].size): 0
                            index.push({offset, size, zoom, row, column});

                            if(zoom === 14 && column == 8705 && row == 10634){
                                console.log("test");
                            }

                        }
                    }

                    //increment column
                    Object.assign(fragmentBounds,
                        {minTileCol: fragmentBounds.maxTileCol + 1, maxTileCol: fragmentBounds.maxTileCol + numIndexEntriesPerFragmentSide});
                }

                //reset column and increment row
                fragmentBounds = {
                    minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
                    minTileRow: fragmentBounds.maxTileRow +1,
                    maxTileCol: ((fragmentMinColIndex +1) * numIndexEntriesPerFragmentSide) - 1,
                    maxTileRow: fragmentBounds.maxTileRow + numIndexEntriesPerFragmentSide
                };
            }
        }
    }

    return index;
}

function calculateSparseFragmentBounds(tileSetLimits: {minTileRow: number, maxTileRow: number, minTileCol?: number, maxTileCol?: number},
                                 denseFragmentLimits: {minTileCol: number, minTileRow: number, maxTileCol: number, maxTileRow}){
    const intersectedLimits = {...denseFragmentLimits};
    if(tileSetLimits.minTileCol > denseFragmentLimits.minTileCol){
        intersectedLimits.minTileCol = tileSetLimits.minTileCol;
    }
    if(tileSetLimits.minTileRow > denseFragmentLimits.minTileRow){
        intersectedLimits.minTileRow = tileSetLimits.minTileRow;
    }
    if(tileSetLimits.maxTileCol < denseFragmentLimits.maxTileCol){
        intersectedLimits.maxTileCol = tileSetLimits.maxTileCol;
    }
    if(tileSetLimits.maxTileRow < denseFragmentLimits.maxTileRow){
        intersectedLimits.maxTileRow = tileSetLimits.maxTileRow;
    }
    return intersectedLimits;
}


function isDense(limits: TileMatrix["tileMatrixLimits"], fragmentBounds: fragmentBounds){
    return fragmentBounds.minTileCol >= limits.minTileCol && fragmentBounds.minTileRow >= limits.minTileRow
        && fragmentBounds.maxTileCol <= limits.maxTileCol && fragmentBounds.maxTileRow <= limits.maxTileRow;
}

function useIndexFragmentation(tileMatrix: TileMatrix): boolean{
    return tileMatrix.aggregationCoefficient !== -1;
}

/*function createIndexWithoutFragments(tiles: Uint8Array[], numTiles: number, tileIndex: number, offset: number){
    for(let i = 0; i < numTiles; i++){
        const tile = tiles[tileIndex];
        const size = tile.length;
        index.push({offset, size});
        offset += size;
        tileIndex++;
    }
}*/