//TODO: refactor imports
import sqlite, { Statement } from "better-sqlite3";
import Database from "better-sqlite3";
import { Metadata } from "@com-tiles/spec";
import { TileMatrixLimits } from "@com-tiles/spec/types/tileMatrixLimits";
import WebMercatorQuadMetadataBuilder from "./metadataBuilder";
import { TileMatrix } from "@com-tiles/spec/types/tileMatrix";
import { TileRecord, TileInfoRecord } from "./tileProvider";

export class MBTilesRepository {
    private static readonly METADATA_TABLE_NAME = "metadata";
    private static readonly TILES_TABLE_NAME = "tiles";
    private readonly db: sqlite.Database;

    private readonly tileSizeStmt: Statement;
    private readonly tileStmt: Statement;
    private readonly tileSizeFragmentStmt: Statement;
    private readonly tileFragmentStmt: Statement;

    constructor(private readonly fileName: string) {
        this.db = new Database(fileName, {
            readonly: true,
        });

        this.tileStmt = this.createTileStmt();
        this.tileSizeStmt = this.createTileSizeStmt();
        this.tileSizeFragmentStmt = this.createTileSizeFragmentStmt();
        this.tileFragmentStmt = this.createTileFragmentStmt();
    }

    private createTileSizeStmt() {
        const stmt = `SELECT tile_column as column, tile_row as row, length(tile_data) as size FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = @zoom;`;
        return this.db.prepare(stmt);
    }
    private createTileStmt() {
        const stmt = `SELECT tile_column as column, tile_row as row, tile_data as data FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = @zoom;`;
        return this.db.prepare(stmt);
    }

    private createTileSizeFragmentStmt() {
        const stmt = `SELECT tile_column as column, tile_row as row, length(tile_data) as size FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = @zoom  AND tile_column >= @minCol AND tile_column <= @maxCol AND tile_row >= @minRow AND tile_row<= @maxRow ORDER BY tile_row, tile_column ASC;`;
        return this.db.prepare(stmt);
    }
    private createTileFragmentStmt() {
        const stmt = `SELECT tile_column as column, tile_row as row, tile_data as data FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = @zoom  AND tile_column >= @minCol AND tile_column <= @maxCol AND tile_row >= @minRow AND tile_row<= @maxRow ORDER BY tile_row, tile_column ASC;`;
        return this.db.prepare(stmt);
    }

    getMetadata(): Metadata {
        const query = `SELECT name, value FROM ${MBTilesRepository.METADATA_TABLE_NAME};`;
        const rows = this.db.prepare(query).all();

        const metadataBuilder = new WebMercatorQuadMetadataBuilder();
        for (const row of rows) {
            switch (row.name) {
                case "name":
                    metadataBuilder.setName(row.value);
                    break;
                case "bounds":
                    metadataBuilder.setBoundingBox(row.value.split(",").map((value) => parseFloat(value.trim())));
                    break;
                case "minzoom":
                    metadataBuilder.setMinZoom(parseInt(row.value, 10));
                    break;
                case "maxzoom":
                    metadataBuilder.setMaxZoom(parseInt(row.value, 10));
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

        return metadataBuilder.build();
    }

    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    getTilesByRowMajorOrder(zoom: number, limit?: TileMatrixLimits): Omit<TileRecord, "zoom">[] {
        //TODO: add limit check
        const parameter = {
            zoom,
            minCol: limit.minTileCol,
            maxCol: limit.maxTileCol,
            minRow: limit.minTileRow,
            maxRow: limit.maxTileRow,
        };
        return this.tileFragmentStmt.all(parameter);
    }

    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    getByteLengthOfTilesByRowMajorOrder(zoom: number, limit?: TileMatrixLimits): Omit<TileInfoRecord, "zoom">[] {
        //TODO: add limit check
        const parameter = {
            zoom,
            minCol: limit.minTileCol,
            maxCol: limit.maxTileCol,
            minRow: limit.minTileRow,
            maxRow: limit.maxTileRow,
        };

        return this.tileSizeFragmentStmt.all(parameter);
    }

    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    async *getTilesByRowMajorOrderBatched(
        zoom: number,
        limit?: TileMatrixLimits,
        batchSize = 50000,
    ): AsyncIterable<TileRecord[]> {
        //TODO: use binding parameters
        let query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom}`;
        if (limit) {
            query += ` AND tile_column >= ${limit.minTileCol} AND tile_column <= ${limit.maxTileCol} AND tile_row >= ${limit.minTileRow} AND tile_row<= ${limit.maxTileRow}`;
        }
        query += " ORDER BY tile_row, tile_column ASC";
        for (let offset = 0; ; offset += batchSize) {
            const limitQuery = ` ${query} LIMIT ${batchSize} OFFSET ${offset};`;
            const tiles = this.db.prepare(limitQuery).all();
            if (tiles.length === 0) {
                return;
            }

            yield tiles;
        }
    }

    getTileMatrixLimits(zoom: number): TileMatrix["tileMatrixLimits"] {
        //TODO: use bind parameters
        const query = `SELECT min(tile_column) as minTileCol, max(tile_column) as maxTileCol, min(tile_row) as minTileRow, max(tile_row) as maxTileRow FROM tiles WHERE zoom_level = ${zoom};`;
        return this.db.prepare(query).get();
    }

    getTile(zoom: number, row: number, column: number): TileRecord {
        const query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = @zoom AND tile_column = @column AND tile_row = @row;`;
        //TODO: only prepare once
        return this.db.prepare(query).get({
            zoom,
            row,
            column,
        });
    }

    dispose(): void {
        this.db.close();
    }
}
