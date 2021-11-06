/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * In a TCRS (Tile matrix CRS), for each resolution, a TileMatrix coordinate system groups underlying TCRS pixels into square tiles and counts tiles with the origin at the upper left corner of the tiled space and increasing right (column axis, horizontal) and downwards (row axis, vertical) respectively
 */
export interface TileMatrix {
  /**
   * Zoom level of the TileMatrix.
   */
  zoom: number;
  /**
   * Describes how many index records are aggregated to a fragment. A value of -1 specifies that no index fragmentation is used.
   */
  aggregationCoefficient: number;
  /**
   * Declaration of a limited coverage of a tile matrix.
   */
  tileMatrixLimits: {
    /**
     * Minimum tile row index.
     */
    minTileRow: number;
    /**
     * Maximum tile row index.
     */
    maxTileRow: number;
    /**
     * Minimum tile column index.
     */
    minTileCol?: number;
    /**
     * Maximum tile column index.
     */
    maxTileCol?: number;
  };
}
