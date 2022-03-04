import { Database, OPEN_READONLY } from "sqlite3";
import { promisify } from "util";
import { Metadata } from "@com-tiles/spec";
import { TileMatrixLimits } from "@com-tiles/spec/types/tileMatrixLimits";
import WebMercatorQuadMetadataBuilder from "./metadataBuilder";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { TileMatrixFactory } from "./tileMatrixFactory";

export interface Tile {
    column: number;
    row: number;
    data: Uint8Array;
}

export class MBTilesRepository {
    private static readonly METADATA_TABLE_NAME = "metadata";
    private static readonly TILES_TABLE_NAME = "tiles";

    private constructor(private readonly db: Database) {}

    static async create(fileName: string): Promise<MBTilesRepository> {
        const db = await MBTilesRepository.connect(fileName);
        return new MBTilesRepository(db);
    }

    async getMetadata(): Promise<Metadata> {
        const query = `SELECT name, value FROM ${MBTilesRepository.METADATA_TABLE_NAME};`;
        const rows = await promisify(this.db.all.bind(this.db))(query);

        const metadataBuilder = new WebMercatorQuadMetadataBuilder();
        let minZoom = 0;
        let maxZoom = 0;
        for (const row of rows) {
            switch (row.name) {
                case "name":
                    metadataBuilder.setName(row.value);
                    break;
                case "bounds":
                    metadataBuilder.setBoundingBox(row.value.split(",").map((value) => parseFloat(value.trim())));
                    break;
                case "minzoom":
                    minZoom = parseInt(row.value, 10);
                    metadataBuilder.setMinZoom(minZoom);
                    break;
                case "maxzoom":
                    maxZoom = parseInt(row.value, 10);
                    metadataBuilder.setMaxZoom(maxZoom);
                    break;
                case "format":
                    metadataBuilder.setTileFormat(row.value);
                    break;
                case "attribution":
                    metadataBuilder.setAttribution(row.value);
                    break;
                case "json":
                    metadataBuilder.setLayers(row.value);
                    break;
            }
        }

        const tileMatrixLimits = [];
        for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
            const limits = await this.getTileMatrixLimits(zoom);
            tileMatrixLimits.push(limits);
        }
        metadataBuilder.setBoundingBox(tileMatrixLimits);

        return metadataBuilder.build();
    }

    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    getTilesByRowMajorOrder(zoom: number, limit?: TileMatrixLimits): Promise<Tile[]> {
        let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
        if (limit) {
            query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
        }
        query += " ORDER BY tile_row, tile_column ASC;";
        return promisify(this.db.all.bind(this.db))(query);
    }

    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    async *getTilesByRowMajorOrderBatched(
        zoom: number,
        limit?: TileMatrixLimits,
        batchSize = 50000,
    ): AsyncIterable<Tile[]> {
        let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
        if (limit) {
            query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
        }
        query += " ORDER BY tile_row, tile_column ASC";
        for (let offset = 0; ; offset += batchSize) {
            const limitQuery = ` ${query} LIMIT ${batchSize} OFFSET ${offset};`;
            const tiles = await promisify(this.db.all.bind(this.db))(limitQuery);
            if (tiles.length === 0) {
                return;
            }

            yield tiles;
        }
    }

    async getTileMatrixLimits(zoom: number): Promise<TileMatrix["tileMatrixLimits"]> {
        const query = `SELECT min(tile_column) as minTileCol, max(tile_column) as maxTileCol, min(tile_row) as minTileRow, max(tile_row) as maxTileRow FROM tiles WHERE zoom_level = ${zoom};`;
        return promisify(this.db.get.bind(this.db))(query);
    }

    async getTile(zoom: number, row: number, column: number): Promise<Tile> {
        const query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom} AND tile_column = ${column} AND tile_row = ${row};`;
        return promisify(this.db.get.bind(this.db))(query);
    }

    async dispose(): Promise<void> {
        return promisify(this.db.close.bind(this.db))();
    }

    private static connect(dbPath: string): Promise<Database> {
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
