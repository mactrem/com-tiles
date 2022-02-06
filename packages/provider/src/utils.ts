//TODO: attribute
const shift = (number, shift) => {
    return number * Math.pow(2, shift);
};

export function convertUInt40LEToNumber(buffer: ArrayBuffer, offset: number) {
    const dataView = new DataView(buffer);
    return shift(dataView.getUint32(offset + 1, true), 8) + dataView.getUint8(offset);
}
