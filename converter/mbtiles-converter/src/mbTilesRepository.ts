import {Database, OPEN_READONLY} from "sqlite3";
import * as util from "util";
import {TileMatrix} from "@com-tiles/spec/types/tileMatrix";

export interface Tile{
    column: number;
    row: number;
    data: Uint8Array;
}

export class MBTilesRepository {
    private static readonly TILES_TABLE_NAME = "tiles";

    constructor(private readonly fileName: string) {
    }

    /*async *getTilesByRowMajorOrder(zoom: number, limit?: TileMatrix["tileMatrixLimits"], batchSize = 50000): AsyncIterable<Tile[]>{
        const db = await this.connect(this.fileName);

        let query = `SELECT tile_column as column, tile_row as row, tile_data as data FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
        if(limit){
            query += ` WHERE tile_column >= ${limit.minTileCol} && tile_column <= ${limit.maxTileCol} && tile_row >= ${limit.maxTileRow} && tile_row<= ${limit.maxTileRow}`;
        }
        query += " ORDER BY tile_row, tile_column ASC;"
        for(let offset = 0; ; offset+=batchSize){
            //TODO: use prepared statement
            query += ` LIMIT ${batchSize} OFFSET ${offset};`

            const rows = await util.promisify(db.all.bind(db))(query);
            if(!rows.length){
                db.close();
            }

            return rows;
        }
    }*/

    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    //TODO: row major means XYZ schema not TMS -> refactor to use XYZ scheme which is also specified in the OGC WebMercatorQuad
    async *getTilesByRowMajorOrderBatched(zoom: number, limit?: TileMatrix["tileMatrixLimits"], batchSize = 50000): AsyncIterable<Tile[]>{
        const db = await this.connect(this.fileName);

        let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
        if(limit){
            query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
        }
        query += " ORDER BY tile_row, tile_column ASC"
        for(let offset = 0; ; offset+=batchSize){
            //TODO: use prepared statement
            const limitQuery = ` ${query} LIMIT ${batchSize} OFFSET ${offset};`

            const rows = await util.promisify(db.all.bind(db))(limitQuery);
            if(!rows.length){
                db.close();
                return;
            }

            yield rows;
        }
    }

    async getTile(zoom: number, row: number, column: number): Promise<Tile>{
        const db = await this.connect(this.fileName);

        let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom} AND tile_column = ${column} AND tile_row = ${row};`;
        const rows = await util.promisify(db.all.bind(db))(query);

        return rows[0];
    }

    private connect(dbPath: string): Promise<Database>{
        return new Promise<Database>((resolve, reject) =>{
            const db = new Database(dbPath, OPEN_READONLY, err => {
                if(err){
                    reject(err.message);
                    return;
                }

                resolve(db);
            })
        });
    }
}



/**
 * Ordered by zoomLevel, tileRow and tileColumn in ascending order which corresponds to row-major order.
 * */
/*getTilesByRowMajorOrder(limit: Limit):Promise<Uint8Array[]>{
    return new Promise((resolve, reject) => {
        this.db.all(`SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles WHERE tile_column >= ? && tile_column <= ? && tile_row >= ? && tile_row<= ?
                        ORDER BY zoom_level, tile_row, tile_column ASC;`, [limit.minColumn, limit.maxColumn, limit.minRow, limit.maxRow], (err, tiles) => {
            if(err){
                reject(err);
                return;
            }

            //use cursor if more then 1000 tiles -> generator
            //if limit reached query the next 1000 elements

            resolve(tiles.map(tile => tile.tile_data));
        });
    });
}*/

/*return new Promise((resolve, reject) => {
           const t = `WHERE tile_column >= ${limit.minColumn} && tile_column <= ${limit.maxColumn} && tile_row >= ${limit.minRow} && tile_row<= ${limit.maxRow}`;
           this.db.all("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles ORDER BY zoom_level, tile_row, tile_column ASC;", (err, tiles) => {
               if(err){
                   reject(err);
                   return;
               }

               resolve(tiles.map(tile => tile.tile_data));
           });
       });*/