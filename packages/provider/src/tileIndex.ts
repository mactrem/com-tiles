/*
 * Index of a specific tile in the XYZ tiling scheme.
 * */
export interface XyzIndex {
    x: number;
    y: number;
    z: number;
}

/*
 * Index of a specific tile in the TMS tiling scheme.
 * */
export type TmsIndex = XyzIndex;
