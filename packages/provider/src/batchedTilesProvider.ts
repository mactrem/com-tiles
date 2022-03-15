import { CancellationToken } from "@com-tiles/provider";
import pako from "pako";

interface TileRange {
    startOffset: number;
    endOffset: number;
}

export interface TileRequest {
    index: {
        x: number;
        y: number;
        z: number;
    };
    range: TileRange;
    promise?: {
        resolve: any;
        reject: any;
    };
}

interface BatchedTileRequest {
    batchRange: TileRange;
    tileRequests: TileRequest[];
}

export default class BatchedTilesProvider {
    private requestingTiles = false;
    private tileRequests: TileRequest[] = [];

    constructor(private readonly url, private readonly throttleTime = 5) {}

    getTile(tileRequest: Omit<TileRequest, "promise">): Promise<ArrayBuffer> {
        if (!this.requestingTiles) {
            this.requestingTiles = true;
            setTimeout(this.fetchTileBatch.bind(this), this.throttleTime);
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

    //TODO: remove -> only tests
    resetTileRequests() {
        this.requestingTiles = false;
        this.tileRequests = [];
    }

    private fetchTileBatch() {
        //TODO: refactor
        //const batchedTileRequests: BatchedTileRequest[]  = this.tileRequests
        const sortedTileRequests: any = this.tileRequests.sort(
            ({ range: range1 }, { range: range2 }) => range1.startOffset - range2.startOffset,
        );
        const ba: any = sortedTileRequests.reduce((batchedTileRequests, tileRequest) => {
            if (!batchedTileRequests.length || !this.isInRange(batchedTileRequests?.at(-1), tileRequest)) {
                const { startOffset, endOffset } = tileRequest.range;
                batchedTileRequests.push({
                    batchRange: { startOffset, endOffset },
                    tileRequests: [tileRequest],
                });
            } else {
                const { batchRange, tileRequests } = batchedTileRequests.at(-1);
                batchRange.endOffset = tileRequest.range.endOffset;
                tileRequests.push(tileRequest);
            }
            return batchedTileRequests;
        }, [] as BatchedTileRequest[]);

        ba.forEach((batchedTileRequest, index) => {
            fetch(this.url, {
                headers: {
                    range: `bytes=${batchedTileRequest.batchRange.startOffset}-${batchedTileRequest.batchRange.endOffset}`,
                },
                //signal,
            })
                .then((response) => response.arrayBuffer())
                .then((tileBatch) => {
                    let batchOffset = 0;
                    for (const { range, promise, index } of batchedTileRequest.tileRequests) {
                        const { startOffset, endOffset } = range;
                        const size = endOffset - startOffset + 1;
                        const tile = this.sliceTile(tileBatch, batchOffset, size);
                        promise.resolve(tile);
                        batchOffset += size;
                    }

                    //TODO: closure doesn't work?
                    if (index === ba.length - 1) {
                        this.requestingTiles = false;
                        this.tileRequests = [];
                    }
                });
        });
    }

    private isInRange(batchedTileRequest: BatchedTileRequest, tileRequest: TileRequest): boolean {
        return (
            batchedTileRequest.tileRequests.length &&
            tileRequest.range.startOffset - batchedTileRequest.tileRequests.at(-1).range.endOffset === 1
        );
    }

    private sliceTile(tileBatch: ArrayBuffer, offset: number, size: number): Uint8Array {
        const tile = tileBatch.slice(offset, offset + size);
        const compressedTile = new Uint8Array(tile);
        //TODO: remove -> only test
        try {
            return pako.ungzip(compressedTile);
        } catch (e) {
            console.error(e);
            return new Uint8Array(0);
        }
    }
}
