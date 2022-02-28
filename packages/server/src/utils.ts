import zlib from "zlib";
import Protobuf from "pbf";
const vt = require("@mapbox/vector-tile");

export function decodeMapboxVectorTile(data: Buffer) {
    const result = zlib.unzipSync(data);
    const proto = new Protobuf(result);
    return new vt.VectorTile(proto);
}
