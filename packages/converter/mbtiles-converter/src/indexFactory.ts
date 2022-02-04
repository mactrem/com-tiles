import { TileMatrix } from "@comt/spec/types/tileMatrix";
import { MBTilesRepository } from "./mbTilesRepository";

/* 5 bytes offset and 4 bytes size as default */
export type IndexEntry = {
  offset: number;
  size: number;
  zoom: number;
  row: number;
  column: number;
};

/**
 *
 * Create an index where the fragments and the index entries of a fragment are arranged in row-major order.
 *
 * @param tileRepository Repository for accessing the tiles
 * @param tileMatrixSet Describes the bounds of the tileset
 * @returns Collection of {@link IndexEntry}
 */
export async function createIndexInRowMajorOrder(
  tileRepository: MBTilesRepository,
  tileMatrixSet: TileMatrix[]
): Promise<IndexEntry[]> {
  const index: IndexEntry[] = [];
  const minZoom = tileMatrixSet[0].zoom;
  const maxZoom = tileMatrixSet[tileMatrixSet.length - 1].zoom;

  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const tileMatrix = tileMatrixSet[zoom];
    const limits = tileMatrix.tileMatrixLimits;

    if (!useIndexFragmentation(tileMatrix)) {
      /* reference to the current tile in the array */
      const tileIndex = index.length - 1;
      /* reference to the current tile in the final blob */
      let offset = index.length
        ? index[tileIndex].offset + index[tileIndex].size
        : 0;
      const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(
        zoom,
        tileMatrix.tileMatrixLimits
      );
      for await (const tileBatch of tileBatches) {
        for (const { data, row, column } of tileBatch) {
          const size = data.length;
          index.push({ offset, size, zoom, row, column });
          offset += size;
        }
      }
    } else {
      //TODO: test
      const beforeSize = index.length;

      /* use index fragments and sparse fragments */
      const numIndexEntriesPerFragment = 4 ** tileMatrix.aggregationCoefficient;
      const numIndexEntriesPerFragmentSide = Math.sqrt(
        numIndexEntriesPerFragment
      );
      const fragmentMinColIndex = Math.floor(
        limits.minTileCol / numIndexEntriesPerFragmentSide
      );
      const fragmentMinRowIndex = Math.floor(
        limits.minTileRow / numIndexEntriesPerFragmentSide
      );
      const fragmentMaxColIndex = Math.floor(
        limits.maxTileCol / numIndexEntriesPerFragmentSide
      );
      const fragmentMaxRowIndex = Math.floor(
        limits.maxTileRow / numIndexEntriesPerFragmentSide
      );
      const numFragmentsCol = fragmentMaxColIndex - fragmentMinColIndex + 1;
      const numFragmentsRow = fragmentMaxRowIndex - fragmentMinRowIndex + 1;

      let denseFragmentBounds = {
        minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
        minTileRow: fragmentMinRowIndex * numIndexEntriesPerFragmentSide,
        maxTileCol:
          (fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide - 1,
        maxTileRow:
          (fragmentMinRowIndex + 1) * numIndexEntriesPerFragmentSide - 1,
      };

      for (let fragmentRow = 0; fragmentRow < numFragmentsRow; fragmentRow++) {
        for (
          let fragmentCol = 0;
          fragmentCol < numFragmentsCol;
          fragmentCol++
        ) {
          const sparseFragmentBounds = calculateSparseFragmentBounds(
            limits,
            denseFragmentBounds
          );
          const tileBatches = tileRepository.getTilesByRowMajorOrderBatched(
            zoom,
            sparseFragmentBounds
          );

          for await (const tileBatch of tileBatches) {
            for (const { column, row, data } of tileBatch) {
              const size = data.length;
              const tileIndex = index.length - 1;
              const offset = index.length
                ? index[tileIndex].offset + index[tileIndex].size
                : 0;
              //TODO: set offset 0 when size=0?
              index.push({ offset, size, zoom, row, column });
            }
          }

          //TODO: use only one assignment via index multiplication
          /* increment column and keep row */
          Object.assign(denseFragmentBounds, {
            minTileCol: denseFragmentBounds.maxTileCol + 1,
            maxTileCol:
              denseFragmentBounds.maxTileCol + numIndexEntriesPerFragmentSide,
          });
        }

        /* reset column and increment row */
        denseFragmentBounds = {
          minTileCol: fragmentMinColIndex * numIndexEntriesPerFragmentSide,
          minTileRow: denseFragmentBounds.maxTileRow + 1,
          maxTileCol:
            (fragmentMinColIndex + 1) * numIndexEntriesPerFragmentSide - 1,
          maxTileRow:
            denseFragmentBounds.maxTileRow + numIndexEntriesPerFragmentSide,
        };
      }

      //TODO: remove
      if (zoom === 11) {
        console.log(beforeSize);
        debugger;
      }
    }
  }

  return index;
}

function calculateSparseFragmentBounds(
  tileSetLimits: TileMatrix["tileMatrixLimits"],
  denseFragmentLimits: TileMatrix["tileMatrixLimits"]
): TileMatrix["tileMatrixLimits"] {
  const sparseFragmentLimits = { ...denseFragmentLimits };
  if (tileSetLimits.minTileCol > denseFragmentLimits.minTileCol) {
    sparseFragmentLimits.minTileCol = tileSetLimits.minTileCol;
  }
  if (tileSetLimits.minTileRow > denseFragmentLimits.minTileRow) {
    sparseFragmentLimits.minTileRow = tileSetLimits.minTileRow;
  }
  if (tileSetLimits.maxTileCol < denseFragmentLimits.maxTileCol) {
    sparseFragmentLimits.maxTileCol = tileSetLimits.maxTileCol;
  }
  if (tileSetLimits.maxTileRow < denseFragmentLimits.maxTileRow) {
    sparseFragmentLimits.maxTileRow = tileSetLimits.maxTileRow;
  }
  return sparseFragmentLimits;
}

function useIndexFragmentation(tileMatrix: TileMatrix): boolean {
  return tileMatrix.aggregationCoefficient !== -1;
}
