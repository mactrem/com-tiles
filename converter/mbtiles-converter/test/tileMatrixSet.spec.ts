import {BoundingBox, TileMatrixFactory} from "../src/tileMatrixSetBuilder";

describe("TileMatrixFactory", ()=> {
    it("should create OSMTile", ()=>{
        const zoom = 4;
        const topLeft = [0, 66.513260]; //8,4
        const bottomRight = [134.999998, -40.979897]; //13,9
        const bbox = topLeft.concat(bottomRight) as BoundingBox;

        const tileMatrix = TileMatrixFactory.createWebMercatorQuad(zoom, bbox);

        /*expect(tileMatrix.zoom).toBe(zoom);
        expect(tileMatrix.topLeft).toEqual(topLeft);
        expect(tileMatrix.matrixWidth).toBe(5);
        expect(tileMatrix.maxtrixHeight).toBe(5);*/
    });
})