import {Metadata} from "@com-tiles/spec";
import {calculateIndexOffsetForTile} from "../src/index";

describe("calculateIndexOffsetForTile", () => {
    const metadata: Metadata = {
        name: "test",
        tileFormat: "pbf",
        tileMatrixSet: {
            fragmentOrdering: "RowMajor",
            tileOrdering: "RowMajor",
            tileMatrixSet: [
            ]
        }
    }

    it("should return O as index for top level tile", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
                    {
                        zoom: 0,
                        aggregationCoefficient: -1,
                        tileMatrixLimits: {
                            minTileRow: 0,
                            minTileCol: 0,
                            maxTileRow: 0,
                            maxTileCol: 0
                        }
                    }
                ];

        const [byteOffset, index] = calculateIndexOffsetForTile(metadata, 0, 0,0);

        expect(byteOffset).toBe(0);
        expect(index).toBe(0);
    });

    it("should return valid offset for tile 1/1/1 when no aggregationCoefficient is used", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0
                }
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1
                }
            }
        ];

        /*
        * TMS -> x=1, y=0
        * ^
        * | 0 0
        * | 1 1
        * | _ _ >
        * */
        const index = calculateIndexOffsetForTile(metadata, 1, 1,0);

        expect(index).toBe(2 * 8);
    });

    it("should return valid offset when a aggregationCoefficient with only dense fragments is used", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0
                }
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1
                }
            },
            {
                zoom: 2,
                aggregationCoefficient: 1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 3,
                    maxTileCol: 3
                }
            }
        ];

        /*
        * TMS -> x=2, y=3
        * ^
        * | -> 1 -> 1 -> 1 -> 0
        * | -> 1 -> 1 -> 1 -> 1
        * | -> 1 -> 1 -> 1 -> 1
        * |    1 -> 1 -> 1 -> 1
        * | _ _ >
        * */
        const index = calculateIndexOffsetForTile(metadata, 2, 2,3);
        expect(index).toBe((1 + 2 + 14) * 8);

        const index2 = calculateIndexOffsetForTile(metadata, 2, 3,3);
        expect(index2).toBe((1 + 2 + 15) * 8);

        const index3 = calculateIndexOffsetForTile(metadata, 2, 2,2);
        expect(index3).toBe((1 + 2 + 12) * 8);
    });

    it("test", () => {
        metadata.tileMatrixSet = {
            "tileMatrixCRS": "WebMercatorQuad ",
            "fragmentOrdering": "RowMajor",
            "tileOrdering": "RowMajor",
            "tileMatrixSet": [
                {
                    "zoom": 0,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 0,
                        "minTileRow": 0,
                        "maxTileCol": 0,
                        "maxTileRow": 0
                    }
                },
                {
                    "zoom": 1,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 1,
                        "minTileRow": 1,
                        "maxTileCol": 1,
                        "maxTileRow": 1
                    }
                },
                {
                    "zoom": 2,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 2,
                        "minTileRow": 2,
                        "maxTileCol": 2,
                        "maxTileRow": 2
                    }
                },
                {
                    "zoom": 3,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 4,
                        "minTileRow": 5,
                        "maxTileCol": 4,
                        "maxTileRow": 5
                    }
                },
                {
                    "zoom": 4,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 8,
                        "minTileRow": 10,
                        "maxTileCol": 8,
                        "maxTileRow": 10
                    }
                },
                {
                    "zoom": 5,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 16,
                        "minTileRow": 20,
                        "maxTileCol": 17,
                        "maxTileRow": 21
                    }
                },
                {
                    "zoom": 6,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 33,
                        "minTileRow": 41,
                        "maxTileCol": 35,
                        "maxTileRow": 42
                    }
                },
                {
                    "zoom": 7,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 67,
                        "minTileRow": 82,
                        "maxTileCol": 70,
                        "maxTileRow": 84
                    }
                },
                {
                    "zoom": 8,
                    "aggregationCoefficient": -1,
                    "tileMatrixLimits": {
                        "minTileCol": 134,
                        "minTileRow": 165,
                        "maxTileCol": 140,
                        "maxTileRow": 168
                    }
                },
                {
                    "zoom": 9,
                    "aggregationCoefficient": 6,
                    "tileMatrixLimits": {
                        "minTileCol": 269,
                        "minTileRow": 330,
                        "maxTileCol": 280,
                        "maxTileRow": 336
                    }
                },
                {
                    "zoom": 10,
                    "aggregationCoefficient": 6,
                    "tileMatrixLimits": {
                        "minTileCol": 539,
                        "minTileRow": 661,
                        "maxTileCol": 560,
                        "maxTileRow": 672
                    }
                },
                {
                    "zoom": 11,
                    "aggregationCoefficient": 6,
                    "tileMatrixLimits": {
                        "minTileCol": 1078,
                        "minTileRow": 1322,
                        "maxTileCol": 1121,
                        "maxTileRow": 1344
                    }
                },
                {
                    "zoom": 12,
                    "aggregationCoefficient": 6,
                    "tileMatrixLimits": {
                        "minTileCol": 2156,
                        "minTileRow": 2644,
                        "maxTileCol": 2243,
                        "maxTileRow": 2689
                    }
                },
                {
                    "zoom": 13,
                    "aggregationCoefficient": 6,
                    "tileMatrixLimits": {
                        "minTileCol": 4312,
                        "minTileRow": 5289,
                        "maxTileCol": 4486,
                        "maxTileRow": 5379
                    }
                },
                {
                    "zoom": 14,
                    "aggregationCoefficient": 6,
                    "tileMatrixLimits": {
                        "minTileCol": 8625,
                        "minTileRow": 10579,
                        "maxTileCol": 8973,
                        "maxTileRow": 10759
                    }
                }
            ]
        }

        /*
        *  0-13 -> 21388 number of tiles
        *  Limits:
        *  Min Row 10579 -> Fragment Index 165
        *  Max Row 10759 -> Fragment Index 168 -> 4 Frags Rows
        *  Min Col 8625  -> Fragment Index 134
        *  Max Col 8973  -> Fragment Index 140 -> 7 Frags Col
        *
        *  Tile:
        *  Col 8705  -> 136 -> 7 full cols before
        *  Row 10634 -> 166 -> 1 full row before
        *  NumberOfFullRectangleTiles = 7 * 4**6 -> 28672 Tiles
        *  136 - 134 -> 2 Full cols -> 8192 Tiles
        *  Partial Tiles -> 136/166
        *    -> Fragment Bounds -> Col:8704/Row:10624
        *           -> NumFullTileRows -> 10634-10624 -> 10 Rows
        *           -> NumFullCols -> 64 -> 640 full tiles
        *           -> NumPartialTiles -> 8705-8704 -> 1 Tile
        *           -------------
        *           641 tiles
        * ---------------
        * z14 tiles -> 28672 + 8192 + 640 + 1 -> 37505
        * z0-z14 -> 21388 + 37505 -> 58893
        *
        * */

        const [byteOffset, index] = calculateIndexOffsetForTile(metadata, 14, 8705,10634);
        console.log(index);
        expect(index).toBe(58893);
        //expect(index).toBe((1 + 2 + 3) * 8);
    });

    /*it("should return O as index for first tile in zoom level 2", () => {
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
    });*/

    it("should return valid offset when a aggregationCoefficient with sparse fragments is used", () => {
        metadata.tileMatrixSet.tileMatrixSet = [
            {
                zoom: 0,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 0
                }
            },
            {
                zoom: 1,
                aggregationCoefficient: -1,
                tileMatrixLimits: {
                    minTileRow: 0,
                    minTileCol: 0,
                    maxTileRow: 0,
                    maxTileCol: 1
                }
            },
            {
                zoom: 2,
                aggregationCoefficient: 1,
                tileMatrixLimits: {
                    minTileRow: 1,
                    minTileCol: 1,
                    maxTileRow: 2,
                    maxTileCol: 2
                }
            }
        ];

        /*
        * TMS -> x=2, y=2
        * ^
        * | -> 0 -> 0 -> 0 -> 0
        * | -> 0 -> 1 -> 1 -> 0
        * | -> 0 -> 1 -> 1 -> 0
        * |    0 -> 0 -> 0 -> 0
        * | _ _ >
        * */
        const index = calculateIndexOffsetForTile(metadata, 2, 2,2);
        expect(index).toBe((1 + 2 + 3) * 8);


        metadata.tileMatrixSet.tileMatrixSet[2].tileMatrixLimits = {
            minTileRow: 0,
            minTileCol: 1,
            maxTileRow: 3,
            maxTileCol: 2
        };
        /*
        * TMS -> x=2, y=3
        * ^
        * | -> 0 -> 1 -> 1 -> 0
        * | -> 0 -> 1 -> 1 -> 0
        * | -> 0 -> 1 -> 1 -> 0
        * |    0 -> 1 -> 1 -> 0
        * | _ _ >
        * */
        const index2 = calculateIndexOffsetForTile(metadata, 2, 2,3);
        expect(index2).toBe((1 + 2 + 7) * 8);


        metadata.tileMatrixSet.tileMatrixSet[2] = {
            zoom: 2,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileRow: 0,
                minTileCol: 0,
                maxTileRow: 2,
                maxTileCol: 2
            }
        };
        /*metadata.tileMatrixSet.tileMatrixSet[3] = {
            zoom: 3,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileRow: 7,
                minTileCol: 3,
                maxTileRow: 10,
                maxTileCol: 6
            }
        };*/
        //const index3 = calculateIndexOffsetForTile(metadata, 3, 5, 11);
        metadata.tileMatrixSet.tileMatrixSet[3] = {
            zoom: 3,
            aggregationCoefficient: 1,
            tileMatrixLimits: {
                minTileRow: 1,
                minTileCol: 3,
                maxTileRow: 6,
                maxTileCol: 6
            }
        };
        const index3 = calculateIndexOffsetForTile(metadata, 3, 5, 5);
        expect(index3).toBe((1 + 2 + 9 + 17) * 8);
    });

});
