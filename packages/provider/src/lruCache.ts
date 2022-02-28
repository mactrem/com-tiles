export default class LruCache<K, V> {
    private values = new Map<K, V>();

    constructor(private readonly maxEntries = 20) {}

    public get(key: K): V {
        const hasKey = this.values.has(key);
        if (hasKey) {
            const entry = this.values.get(key);
            this.values.delete(key);
            this.values.set(key, entry);
            return entry;
        }

        return null;
    }

    public put(key: K, value: V) {
        if (this.values.size >= this.maxEntries) {
            const keyToDelete = this.values.keys().next().value;
            this.values.delete(keyToDelete);
        }

        this.values.set(key, value);
    }
}
