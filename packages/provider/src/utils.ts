//TODO: attribute
function shift(number, shift): number {
    return number * Math.pow(2, shift);
}

export function convertUInt40LEToNumber(buffer: ArrayBuffer, offset: number): number {
    const dataView = new DataView(buffer);
    return shift(dataView.getUint32(offset + 1, true), 8) + dataView.getUint8(offset);
}
