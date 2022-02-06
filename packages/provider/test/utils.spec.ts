import { convertUInt40LEToNumber } from "../src/utils";

describe("convertUInt40LEToNumber", () => {
    it("should convert 5 bytes", () => {
        /* hex -> 400000000 */
        const expectedNumber = 17179869184; //16GB

        const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x04]).buffer;

        const actualNumber = convertUInt40LEToNumber(buffer, 0);

        expect(actualNumber).toBe(expectedNumber);
    });

    //139 30 246 31 1
    //8B1EF61F01
    //597519900417
});
