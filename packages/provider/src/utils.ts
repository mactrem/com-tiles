export function convertUInt40LEToNumber(buffer: ArrayBuffer, offset: number): number {
    const dataView = new DataView(buffer);
    return dataView.getUint32(offset + 1, true) * 0x100 + dataView.getUint8(offset);
}

export class Optional<T> {
    private constructor(private readonly _value: T) {}

    static of<T>(value: T): Optional<T> {
        return new Optional<T>(value);
    }

    static empty<T>(): Optional<T> {
        return new Optional<T>(null);
    }

    isPresent(): boolean {
        return this._value !== null;
    }

    get(): T {
        return this._value;
    }
}
