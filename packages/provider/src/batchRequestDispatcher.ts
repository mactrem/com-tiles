import pako from "pako";
import { TmsIndex } from "./tileIndex";
import CancellationToken from "./cancellationToken";

interface TileRange {
    startOffset: number;
    endOffset: number;
}

export interface TileRequest {
    index: TmsIndex;
    range: TileRange;
    promise?: {
        resolve: (value: ArrayBuffer) => void;
        reject: (reason?: unknown) => void;
    };
}

interface BatchTileRequest {
    batchRange: TileRange;
    tileRequests: TileRequest[];
}

export default class BatchRequestDispatcher {
    private tileRequests: TileRequest[] = [];

    constructor(private readonly url, private readonly throttleTime = 5) {}

    //TODO: implement aborting of the batch tile requests
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fetchTile(tileRequest: Omit<TileRequest, "promise">, cancellationToken?: CancellationToken): Promise<ArrayBuffer> {
        if (!this.tileRequests.length) {
            setTimeout(() => {
                this.fetchTileBatches();
                this.tileRequests = [];
            }, this.throttleTime);
        }

        return new Promise<ArrayBuffer>((resolve, reject) => {
            const asyncTileRequest = Object.assign(tileRequest, {
                promise: {
                    resolve,
                    reject,
                },
            });
            this.tileRequests.push(asyncTileRequest);
        });
    }

    private fetchTileBatches(): void {
        this.tileRequests
            .sort(({ range: range1 }, { range: range2 }) => range1.startOffset - range2.startOffset)
            .reduce((batchTileRequests, tileRequest) => {
                if (!batchTileRequests.length || !this.isInRange(batchTileRequests?.at(-1), tileRequest)) {
                    const { startOffset, endOffset } = tileRequest.range;
                    batchTileRequests.push({
                        batchRange: { startOffset, endOffset },
                        tileRequests: [tileRequest],
                    });
                } else {
                    const { batchRange, tileRequests } = batchTileRequests.at(-1);
                    batchRange.endOffset = tileRequest.range.endOffset;
                    tileRequests.push(tileRequest);
                }
                return batchTileRequests;
            }, [] as BatchTileRequest[])
            .forEach((batchTileRequest) => {
                fetch(this.url, {
                    headers: {
                        range: `bytes=${batchTileRequest.batchRange.startOffset}-${batchTileRequest.batchRange.endOffset}`,
                    },
                })
                    .then((response) => response.arrayBuffer())
                    .then((tileBatch) => {
                        let batchOffset = 0;
                        for (const { range, promise } of batchTileRequest.tileRequests) {
                            const { startOffset, endOffset } = range;
                            const size = endOffset - startOffset + 1;
                            const tile = this.sliceTile(tileBatch, batchOffset, size);
                            promise.resolve(tile);
                            batchOffset += size;
                        }
                    });
            });
    }

    private isInRange(batchTileRequest: BatchTileRequest, tileRequest: TileRequest): boolean {
        return (
            batchTileRequest.tileRequests.length &&
            tileRequest.range.startOffset - batchTileRequest.tileRequests.at(-1).range.endOffset === 1
        );
    }

    private sliceTile(tileBatch: ArrayBuffer, offset: number, size: number): Uint8Array {
        const tile = tileBatch.slice(offset, offset + size);
        const compressedTile = new Uint8Array(tile);
        return pako.ungzip(compressedTile);
    }
}
