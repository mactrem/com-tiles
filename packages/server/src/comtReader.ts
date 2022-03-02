import fs from "fs-extra";
import { Metadata } from "@com-tiles/spec";
import provider from "@com-tiles/provider";

export class ComtReader {
    private static readonly TILE_SIZE_BYTE_LENGTH = 4;
    private static readonly SUPPORTED_TILE_OFFSET_BYTE_LENGTH = 5;
    private static readonly METADATA_LENGTH_START_INDEX = 8;
    private static readonly INDEX_LENGTH_START_INDEX = 12;
    private static readonly METADATA_START_INDEX = 17;
    private static readonly INDEX_ENTRY_BYTE_LENGTH = 9;

    constructor(private readonly fileName: string) {}

    async readMetadata(): Promise<{ metadata: Metadata; metadataByteLength: number }> {
        const fd = await fs.open(this.fileName, "r");

        const metadataLengthBuffer = Buffer.alloc(4);
        await fs.read(fd, metadataLengthBuffer, 0, 4, ComtReader.METADATA_LENGTH_START_INDEX);
        const metadataLength = metadataLengthBuffer.readUInt32LE();

        const metadataBuffer = Buffer.alloc(metadataLength);
        await fs.read(fd, metadataBuffer, 0, metadataLength, ComtReader.METADATA_START_INDEX);
        const metadata = JSON.parse(metadataBuffer.toString());

        return { metadata, metadataByteLength: metadataLength };
    }

    /**
     * Quick and dirty approach for loading the index at once in the memory.
     * This will not scale and break for a index at global scale for the default max-old-space-size settings.
     */
    async readIndex(
        metadataLength: number,
        tileOffsetBytes = ComtReader.SUPPORTED_TILE_OFFSET_BYTE_LENGTH,
    ): Promise<{ offset: number; size: number }[]> {
        if (tileOffsetBytes !== ComtReader.SUPPORTED_TILE_OFFSET_BYTE_LENGTH) {
            throw new Error(
                `Only a tile offset of ${ComtReader.SUPPORTED_TILE_OFFSET_BYTE_LENGTH} bytes is supported (yet).`,
            );
        }

        const fd = await fs.open(this.fileName, "r");
        const indexLengthBuffer = Buffer.alloc(5);
        await fs.read(fd, indexLengthBuffer, 0, 5, ComtReader.INDEX_LENGTH_START_INDEX);
        const indexLength = provider.convertUInt40LEToNumber(indexLengthBuffer.buffer, 0);

        const offset = ComtReader.METADATA_START_INDEX + metadataLength;
        const indexBuffer = Buffer.alloc(indexLength);
        await fs.read(fd, indexBuffer, 0, indexLength, offset);

        const indexEntries = [];
        const numIndexEntries = indexBuffer.length / ComtReader.INDEX_ENTRY_BYTE_LENGTH;
        for (let i = 0; i < numIndexEntries; i++) {
            const bufferOffset = i * ComtReader.INDEX_ENTRY_BYTE_LENGTH;
            const offset = provider.convertUInt40LEToNumber(indexBuffer.buffer, bufferOffset);
            const size = indexBuffer.readUInt32LE(bufferOffset + ComtReader.TILE_SIZE_BYTE_LENGTH);
            indexEntries.push({ offset, size });
        }

        return indexEntries;
    }

    async readTile(
        index: provider.ComtIndex,
        indexEntries: { offset: number; size: number }[],
        metadataByteLength: number,
        xyzIndex: { zoom: number; x: number; y: number },
    ): Promise<Buffer> {
        const tmsY = 2 ** xyzIndex.zoom - xyzIndex.y - 1;
        const indexOffset = index.calculateIndexOffsetForTile(xyzIndex.zoom, xyzIndex.x, tmsY)[1];
        const { offset, size } = indexEntries[indexOffset];
        const tileOffset =
            ComtReader.METADATA_START_INDEX +
            metadataByteLength +
            indexEntries.length * ComtReader.INDEX_ENTRY_BYTE_LENGTH +
            offset;

        const fd = await fs.open(this.fileName, "r");
        const buffer = Buffer.alloc(size);
        return (await fs.read(fd, buffer, 0, size, tileOffset)).buffer;
    }
}
