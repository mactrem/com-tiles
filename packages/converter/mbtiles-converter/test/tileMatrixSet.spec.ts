import {BoundingBox, TileMatrixFactory} from "../src/tileMatrixSetBuilder";

describe("TileMatrixFactory", ()=> {
    it("should create a TileMatrix in the Web Mercator Quad TileMatrixSet definition", ()=>{
        const zoom = 4;
        const topLeft = [0, 66.513260];
        const bottomRight = [134.999998, -40.979897];
        const bbox = topLeft.concat(bottomRight) as BoundingBox;
        const aggregationCoefficient = 4;
        const expectedTileMatrixLimits = { minTileCol: 8, minTileRow: 11, maxTileCol: 13, maxTileRow: 6 }

        const tileMatrix = TileMatrixFactory.createWebMercatorQuad(zoom, bbox, aggregationCoefficient);

        expect(tileMatrix.zoom).toBe(zoom);
        expect(tileMatrix.aggregationCoefficient).toBe(aggregationCoefficient);
        expect(tileMatrix.tileMatrixLimits).toEqual(expectedTileMatrixLimits)
    });
})