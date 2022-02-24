"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
function range(to) {
    return __spreadArray([], Array(to).keys(), true);
}
/*
describe("createIndexInRowMajorOrder", ()=> {
    it("should create dense index fragments in row-major order", ()=>{
        const numTiles = 4**0 + 4**1 + 4**2;
        const tiles: Uint8Array[] = range(numTiles).map( (i)=> new Uint8Array([i]));
        const tileMatrixSet: TileMatrix[] = [];
        tileMatrixSet.push({
            zoom: 0,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 0,
                maxTileRow: 0
            }
        });
        tileMatrixSet.push({
            zoom: 1,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 1,
                maxTileRow: 1
            }
        });
        tileMatrixSet.push({
            zoom: 2,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 3,
                maxTileRow: 3
            }
        });

        const index = createIndexInRowMajorOrder(tiles, tileMatrixSet);

        expect(index).toBeDefined();
        expect(index.length).toBe(numTiles);
        for(let i = 0; i < numTiles; i++){
            const {size, offset} = index[i];
            expect(size).toBe(1);
            expect(tiles[offset]).toStrictEqual(new Uint8Array([i]));
        }
    });

    it("should create sparse index fragments in row-major order", ()=>{
        const numTiles = 4**0 + 4**1 + 4;
        const tiles: Uint8Array[] = range(numTiles).map( (i)=> new Uint8Array([i]));
        const tileMatrixSet: TileMatrix[] = [];
        tileMatrixSet.push({
            zoom: 0,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 0,
                maxTileRow: 0
            }
        });
        tileMatrixSet.push({
            zoom: 1,
            aggregationCoefficient: -1,
            tileMatrixLimits: {
                minTileCol: 0,
                minTileRow: 0,
                maxTileCol: 1,
                maxTileRow: 1
            }
        });
        tileMatrixSet.push({
            zoom: 2,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileCol: 1,
                minTileRow: 1,
                maxTileCol: 2,
                maxTileRow: 2
            }
        });

        const index = createIndexInRowMajorOrder(tiles, tileMatrixSet);

        expect(index).toBeDefined();
        expect(index.length).toBe(numTiles);
        for(let i = 0; i < numTiles; i++){
            const {size, offset} = index[i];
            expect(size).toBe(1);
            expect(tiles[offset]).toStrictEqual(new Uint8Array([i]));
        }
    });
})*/
