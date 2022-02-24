export function convertUInt40LEToNumber(buffer: ArrayBuffer, offset: number): number {
    const dataView = new DataView(buffer);
    return dataView.getUint32(offset + 1, true) * 0x100 + dataView.getUint8(offset);
}
