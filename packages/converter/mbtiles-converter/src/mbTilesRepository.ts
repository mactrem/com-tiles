import { Database, OPEN_READONLY } from "sqlite3";
import * as util from "util";
import { TileMatrix } from "@comt/spec/types/tileMatrix";

export interface Tile {
  column: number;
  row: number;
  data: Uint8Array;
}

export class MBTilesRepository {
  private static readonly TILES_TABLE_NAME = "tiles";

  constructor(private readonly fileName: string) {}

  /**
   * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
   * */
  async getTilesByRowMajorOrder(
    zoom: number,
    limit?: TileMatrix["tileMatrixLimits"]
  ): Promise<Tile[]> {
    //TODO: connect in ctor -> reduce overhead
    const db = await this.connect(this.fileName);

    let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
    if (limit) {
      query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
      query += " ORDER BY tile_row, tile_column ASC";
      const tiles = await util.promisify(db.all.bind(db))(query);

      return this.hasMissingTiles(limit, tiles)
        ? this.addMissingTiles(limit, tiles)
        : tiles;
    }
  }

  /**
   * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
   * */
  async *getTilesByRowMajorOrderBatched(
    zoom: number,
    limit?: TileMatrix["tileMatrixLimits"],
    batchSize = 50000
  ): AsyncIterable<Tile[]> {
    //TODO: connect in ctor -> reduce overhead
    const db = await this.connect(this.fileName);

    let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
    if (limit) {
      query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
    }
    query += " ORDER BY tile_row, tile_column ASC";
    //TODO: the addMissingTiles approach doesn't work with batching
    //TODO: use while and evaluate the number of returned tiles for the return check
    for (let offset = 0; ; offset += batchSize) {
      const limitQuery = ` ${query} LIMIT ${batchSize} OFFSET ${offset};`;

      const tiles = await util.promisify(db.all.bind(db))(limitQuery);
      const numTiles = tiles.length;

      if (numTiles === 0) {
        db.close();
        return;
      }

      //TODO: not working for a fragment size larger then the batch size
      yield this.hasMissingTiles(limit, tiles)
        ? this.addMissingTiles(limit, tiles)
        : tiles;
    }
  }

  private hasMissingTiles(
    limit: TileMatrix["tileMatrixLimits"],
    tiles: Tile[]
  ): boolean {
    const expectedNumTiles =
      (limit.maxTileCol - limit.minTileCol + 1) *
      (limit.maxTileRow - limit.minTileRow + 1);
    const actualNumTiles = tiles.length;
    return expectedNumTiles !== actualNumTiles;
  }

  //TODO: find proper solution with empty mvt tile -> when adding size 0
  private addMissingTiles(
    limit: TileMatrix["tileMatrixLimits"],
    tiles: Tile[]
  ) {
    const paddedTiles: Tile[] = [];

    for (let row = limit.minTileRow; row <= limit.maxTileRow; row++) {
      for (let col = limit.minTileCol; col <= limit.maxTileCol; col++) {
        if (!tiles.some((tile) => tile.row === row && tile.column === col)) {
          const emptyTile = new Uint8Array();
          paddedTiles.push({ column: col, row, data: emptyTile });
        } else {
          paddedTiles.push(tiles.shift());
        }
      }
    }

    return paddedTiles;
  }

  async getTile(zoom: number, row: number, column: number): Promise<Tile> {
    const db = await this.connect(this.fileName);

    const query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom} AND tile_column = ${column} AND tile_row = ${row};`;
    const rows = await util.promisify(db.all.bind(db))(query);

    return rows[0];
  }

  private connect(dbPath: string): Promise<Database> {
    return new Promise<Database>((resolve, reject) => {
      const db = new Database(dbPath, OPEN_READONLY, (err) => {
        if (err) {
          reject(err.message);
          return;
        }

        resolve(db);
      });
    });
  }
}
