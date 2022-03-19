const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { merge } = require("webpack-merge");
const path = require("path");
const common = require("./webpack.common.js");

const ROOT_DIRECTORY = path.resolve("./");
const ENTRY_POINT = path.join(ROOT_DIRECTORY, "src/index.ts");
const DIST_DIRECTORY = path.join(ROOT_DIRECTORY, "dist");
const LIBRARY_NAME = "maplibreComtProvider.js";
const LIBRARY_TARGET = "comtiles";

module.exports = merge(common, {
    mode: "production",
    entry: ENTRY_POINT,
    devtool: "source-map",
    output: {
        path: DIST_DIRECTORY,
        filename: LIBRARY_NAME,
        library: LIBRARY_TARGET,
        libraryTarget: "umd",
        umdNamedDefine: true,
    },
    plugins: [new CleanWebpackPlugin()],
    externals: {
        "maplibre-gl": "maplibregl",
    },
});
