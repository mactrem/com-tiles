import {Metadata} from "@com-tiles/spec";

//TODO: should be 3 as default
const NUM_BYTES_TILE_SIZE = 4;
const Supported_TILE_MATRIX_CRS = "WebMercatorQuad";
const SUPPORTED_ORDERING = "RowMajor";

/*
*
* Calculates the offset in the index (IndexEntry) for the specified tile based on the metadata.
* This method can be used when the full index is kept in memory.
* If this not the case use index fragments to query parts of the index.
* */
//TODO: refactor to only support RowMajor order and WebMercator TileMatrixCRS
export function calculateIndexOffsetForTile(metadata: Metadata, zoom: number, x: number, y: number): [offset: number, index: number] {
    const tileMatrixSet = metadata.tileMatrixSet;
    const supportedOrdering = [undefined, SUPPORTED_ORDERING];

    if(![tileMatrixSet.fragmentOrdering, tileMatrixSet.tileOrdering].
        every(ordering => supportedOrdering.some(o => o === ordering))){
        throw new Error(`The only supported fragment and tile ordering is ${SUPPORTED_ORDERING}`);
    }
    if(tileMatrixSet.tileMatrixCRS !== undefined && tileMatrixSet?.tileMatrixCRS.trim().toLowerCase() !== Supported_TILE_MATRIX_CRS.toLowerCase()){
        throw new Error(`The only supported TileMatrixCRS is ${Supported_TILE_MATRIX_CRS}.`);
    }

    //TODO: use 5 as default?
    const numBytesForTileOffset = metadata.tileOffsetBytes ?? 4;
    const indexEntrySize = numBytesForTileOffset + NUM_BYTES_TILE_SIZE;
    let offset = 0;
    const filteredSet = tileMatrixSet.tileMatrixSet.filter(t => t.zoom <= zoom);
    for(const ts of filteredSet){
        const limit = ts.tileMatrixLimits;
        if(ts.zoom === zoom && !inRange(x, y, limit)){
            throw new Error("Specified tile index not part of the TileSet.")
        }

        if(ts.zoom < zoom){
            const numTiles = (limit.maxTileCol - limit.minTileCol + 1) * (limit.maxTileRow - limit.minTileRow +1);
            offset += (numTiles * indexEntrySize);
        }
        else{
                /*
                * Calculates the index based on a space filling curve with row-major order with origin on the lower left side
                * like specified in the MBTiles spec
                * */
                //TODO: refactor to use XYZ instead of TMS like specified the OGC WebMercatorQuad TileMatrixSet
                if(ts.aggregationCoefficient === -1){
                    const numRows = y - limit.minTileRow + 1;
                    const numCols = limit.maxTileCol - limit.minTileCol + 1;
                    const deltaCol = x - limit.minTileCol;
                    offset += ((numRows > 1 ? (numRows * numCols + deltaCol) : deltaCol) * indexEntrySize);
                }
                else{
                    //First calculate number of tiles based on the assumption that all fragments are dense
                    const numTilesPerFragmentSide = 2 ** ts.aggregationCoefficient;
                    const denseLimits =  calculateDenseTileSetFragmentBounds(numTilesPerFragmentSide, ts.tileMatrixLimits);
                    //const fragmentsColIndex = Math.floor((x - denseLimits.minTileCol + 1) / numTilesPerFragmentSide);
                    //Position of the tile in the local fragment crs
                    const localFragmentCrsXIndexOfTile = Math.floor((x - denseLimits.minTileCol) / numTilesPerFragmentSide);
                    const localFragmentCrsYIndexOfTile = Math.floor((y - denseLimits.minTileRow ) / numTilesPerFragmentSide);
                    const numFragmentsCol = Math.ceil((denseLimits.maxTileCol - denseLimits.minTileCol + 1)  / numTilesPerFragmentSide);
                    //const fragmentIndex = (fragmentsRowIndex * numFragmentsCol) + fragmentsColIndex;
                    //const numSparseTilesBeforeFragment = fragmentIndex * 4 ** ts.aggregationCoefficient;

                    //TODO: check if only one tile because then the following approach doesn't work
                    let numTilesBeforeFragment = 0;
                    //TODO: check for zero index
                    if(localFragmentCrsXIndexOfTile > 0){
                        //TODO: also calculate for the partial row the dense fragments and substract left, right and upper
                        // because then the specific fragment has not to be inspected
                        //Partial Row
                        //Only Left and upper delta has to be calculated
                        const numDenseTilesForPartialRow = localFragmentCrsXIndexOfTile * 4 ** ts.aggregationCoefficient;
                        const numPartialFragmentsCols = localFragmentCrsXIndexOfTile;
                        //TODO: only calculate if its the most upper fragment
                        let deltaUpperRow = 0;
                        if(y > (denseLimits.maxTileRow - (2 ** ts.aggregationCoefficient))){
                            deltaUpperRow = (denseLimits.maxTileRow - limit.maxTileRow) * numPartialFragmentsCols *  2 ** ts.aggregationCoefficient;
                        }
                        //subtract -1 for upper row when the upper row is dense
                        const numRows = deltaUpperRow > 0 ? (2 ** ts.aggregationCoefficient -1) : (2 ** ts.aggregationCoefficient);
                        const deltaLeftCol = (limit.minTileCol - denseLimits.minTileCol) * numRows;

                        const deltaTilePartialRows = deltaLeftCol + deltaUpperRow;
                        numTilesBeforeFragment = numDenseTilesForPartialRow - deltaTilePartialRows;
                    }


                    //TODO: refactor redundant calculation
                    const numDenseCols = denseLimits.maxTileCol - denseLimits.minTileCol + 1;
                    const currentDenseFragmentMaxRowIndex = Math.floor(y   / (2 ** ts.aggregationCoefficient)) * (2 ** ts.aggregationCoefficient);
                    const numDenseRowsToCurrentMaxFragment = currentDenseFragmentMaxRowIndex - denseLimits.minTileRow;

                    //Full Lines Fragments ->  Calculate the diff to subtract from the dense tiles for the sparse tiles
                    //Only Left, right and lower delta has to be calculated
                    if(numDenseRowsToCurrentMaxFragment > 1){
                        const numDenseTilesForFullRows = (localFragmentCrsYIndexOfTile * numFragmentsCol) * 4 ** ts.aggregationCoefficient;

                        //only the full row are calculated in the first step -> the partial rows follow in a separate step
                        const deltaLowerRow = (limit.minTileRow - denseLimits.minTileRow) * numDenseCols;

                        //check if row is sparse then -1 must not be subtracted from left and right column
                        const numDenseRowsCorrected = deltaLowerRow === 0 ? numDenseRowsToCurrentMaxFragment : (numDenseRowsToCurrentMaxFragment - 1);
                        const deltaLeftCol = ( limit.minTileCol - denseLimits.minTileCol) * numDenseRowsCorrected;
                        const deltaRightCol = (denseLimits.maxTileCol - limit.maxTileCol) * numDenseRowsCorrected;
                        //const deltaUpperRow = (denseLimits.maxTileRow - limit.maxTileRow) * numDenseRows;
                        const deltaTilesFullRows = deltaLeftCol + deltaRightCol + deltaLowerRow;
                        numTilesBeforeFragment += (numDenseTilesForFullRows - deltaTilesFullRows);
                    }


                    //calculate origin of fragment crs in tiles
                    //calculate num row and columns via intersection
                    const xDenseFragmentLimitsOfTiles = Math.floor(x / numTilesPerFragmentSide) * numTilesPerFragmentSide;
                    const yDenseFragmentLimitsOfTiles = Math.floor(y / numTilesPerFragmentSide) * numTilesPerFragmentSide;
                    const minTileCol =  xDenseFragmentLimitsOfTiles;
                    const minTileRow =  yDenseFragmentLimitsOfTiles;
                    const maxTileCol =  minTileCol + numTilesPerFragmentSide - 1;
                    const maxTileRow =  minTileRow + numTilesPerFragmentSide - 1;
                    const fragmentLimitsInTiles = calculateFragmentBounds(ts.tileMatrixLimits,
                        {minTileCol, minTileRow, maxTileCol, maxTileRow});
                    //const numTilesPerCol = fragmentLimits.maxTileCol - fragmentLimits.minTileCol + 1;
                    const numTilesPerRow = fragmentLimitsInTiles.maxTileCol- fragmentLimitsInTiles.minTileCol + 1;

                    const tileColIndex = x - fragmentLimitsInTiles.minTileCol;
                    const tileRowIndex = y - fragmentLimitsInTiles.minTileRow;
                    const tileIndex = (tileRowIndex * numTilesPerRow) + tileColIndex;

                    const numTiles = numTilesBeforeFragment + tileIndex;
                    offset += (numTiles * indexEntrySize);
                }
            }
    }

    const index = offset/indexEntrySize;
    return [offset, index];
}

function calculateFragmentBounds(tileSetLimits: {minTileRow: number, maxTileRow: number, minTileCol?: number, maxTileCol?: number},
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

function calculateDenseTileSetFragmentBounds(numTilePerFramgentSide: number, tileSetLimits: {minTileRow: number, maxTileRow: number, minTileCol?: number, maxTileCol?: number}){
    const denseFragmentTileSetLimits = {...tileSetLimits};
    denseFragmentTileSetLimits.minTileCol = Math.floor(tileSetLimits.minTileCol / numTilePerFramgentSide) * numTilePerFramgentSide;
    denseFragmentTileSetLimits.minTileRow = Math.floor(tileSetLimits.minTileRow / numTilePerFramgentSide) * numTilePerFramgentSide;
    denseFragmentTileSetLimits.maxTileCol = Math.floor(tileSetLimits.maxTileCol / numTilePerFramgentSide) * numTilePerFramgentSide + numTilePerFramgentSide - 1;
    denseFragmentTileSetLimits.maxTileRow = Math.floor(tileSetLimits.maxTileRow / numTilePerFramgentSide) * numTilePerFramgentSide + numTilePerFramgentSide - 1;

    return denseFragmentTileSetLimits;
}

//function inRange(x: number, y: number, tileSetLimits: Metadata["tileMatrixSet"]["tileMatrixSet"]["tileMatrixLimits"]):boolean{
function inRange(x: number, y: number, tileSetLimits: {minTileRow: number, maxTileRow: number, minTileCol?: number, maxTileCol?: number}):boolean{
    return x >= tileSetLimits.minTileCol && x <= tileSetLimits.maxTileCol && y >= tileSetLimits.minTileRow && y <= tileSetLimits.maxTileRow;
}