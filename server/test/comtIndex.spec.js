//import getRangeIndex from "../src/comtIndex.js";
const calculateRangeIndex = require("../src/comtIndex");

describe("getRangeIndex", () => {

    it("should return O as index for top level tile", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds, 0, 0,0);

        expect(index).toBe(0);
    });

    it("should return O as index for first tile in zoom level 2", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds, 2, 0,0);

        expect(index).toBe(5);
    });

    it("should return 5 as index for tile 1,1,1", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds,1, 1,1);

        expect(index).toBe(4);
    });

    it("should return 1 as index for tile 1,1,1 with bounds within tile 1,1,0", () => {
        const bounds = [50,-60,120,-20];

        const index = calculateRangeIndex(bounds,1, 1,0);

        expect(index).toBe(1);
    });

    it("should return 1 as index for tile 1,1,1 with bounds within tile 2,1,0", () => {
        const bounds = [50,-60,120,-20];

        //const index = calculateRangeIndex(bounds,2, 6,2);
        const index = calculateRangeIndex(bounds,2, 2,1);

        expect(index).toBe(3);
    });

    it("should return 3 as index for tile 1,0,1", () => {
        //TODO: use mercator bounds as bbbox?
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds,1, 0,1);

        expect(index).toBe(3);
    });

    it("should return 47 as index for tile 3,2,3", () => {
        const bounds = [-180,-90,180,90];

        const index = calculateRangeIndex(bounds,3, 2,3);

        expect(index).toBe(47);
    });


});

