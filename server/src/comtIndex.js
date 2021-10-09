
/*
* Calculates the index based on a space filling cure with row-major order with origin in the lower left like TMS.
* Tile coordinates hast to be in the TMS tiling scheme.
* */
export default function calculateRangeIndex(bbox, z, x, y){
    /*
    * - use a intersection with the bounding box to get correct index
    * - use space filling curves for calculation
    * */

    if(z === 0){
        return 0;
    }

    //TODO: validate if index is within bbox
    //TODO: handle case when bounds are the full planet -> substract 0.00001 or take max number columns and rows to ensure max bounds?
    //TODO: handle webmercator case
    let rangeIndex = 1;
    for(let zoom = 1; zoom <= z; zoom++){
        const numCells = 1 << zoom;
        const tileSizeLon = 360 / numCells;
        const tileSizeLat = 180 / numCells;

        const lowerLon = bbox[0] + 180;
        const lowerLat = bbox[1] + 90;
        const upperLon = bbox[2] + 180;
        const upperLat = bbox[3] + 90;

        if(zoom < z){
            //TODO: WebMercator is not taken into account
            //TODO: refactor use Math.ceil for the whole expression and remove logical or
            const numDeltaColumns = Math.floor(upperLon / tileSizeLon) - Math.floor(lowerLon / tileSizeLon) || 1;
            const numDeltaRows = Math.floor(upperLat / tileSizeLat) - Math.floor(lowerLat / tileSizeLat) || 1;
            rangeIndex +=  numDeltaColumns * numDeltaRows;
        }
        else{
            const startIndexColumn = Math.floor(lowerLon / tileSizeLon);
            const startIndexRow = Math.floor(lowerLat / tileSizeLat);
            const deltaColumn = x - startIndexColumn;
            const deltaRow = y - startIndexRow;
            if(deltaColumn === 0 && deltaRow === 0){
                break;
            }

            //TODO: remove redundant code
            const numDeltaColumns = Math.floor(upperLon / tileSizeLon) - Math.floor(lowerLon / tileSizeLon) || 1;

            /*
            * space filling cure with row-major order with origin in the lower left like TMS
            * 2 3
            * 0 1
            * see https://www.researchgate.net/publication/3297510_Transform-Space_View_Performing_Spatial_Join_in_the_Transform_Space_Using_Original-Space_Indexes
            * */
            rangeIndex += numDeltaColumns * deltaRow + deltaColumn;
        }
    }

    return rangeIndex;
}
