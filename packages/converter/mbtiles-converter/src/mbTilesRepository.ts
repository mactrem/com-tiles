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
  async *getTilesByRowMajorOrderBatched(
    zoom: number,
    limit?: TileMatrix["tileMatrixLimits"],
    batchSize = 50000
  ): AsyncIterable<Tile[]> {
    const db = await this.connect(this.fileName);

    let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
    if (limit) {
      query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
    }
    query += " ORDER BY tile_row, tile_column ASC";
    for (let offset = 0; ; offset += batchSize) {
      const limitQuery = ` ${query} LIMIT ${batchSize} OFFSET ${offset};`;

      const rows = await util.promisify(db.all.bind(db))(limitQuery);
      if (!rows.length) {
        db.close();
        return;
      }

      yield rows;
    }
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
