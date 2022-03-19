const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { merge } = require("webpack-merge");
const path = require("path");
const common = require("./webpack.common.js");

const ROOT_DIRECTORY = path.resolve("./");
const DIST_DIRECTORY = path.join(ROOT_DIRECTORY, "dist");
const HTML_TEMPLATE = path.join(ROOT_DIRECTORY, "debug/index.html");

module.exports = merge(common, {
    mode: "development",
    devtool: "source-map",
    entry: {
        index: path.join(ROOT_DIRECTORY, "debug/index.ts"),
        batched: path.join(ROOT_DIRECTORY, "debug/batched.ts"),
        debug: path.join(ROOT_DIRECTORY, "debug/debug.ts"),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "MapLibre GL COMTiles Demo with individual tile requests",
            filename: "index.html",
            template: HTML_TEMPLATE,
            chunks: ["index"],
        }),
        new HtmlWebpackPlugin({
            title: "MapLibre GL COMTiles Demo with bath tile requests",
            filename: "batched.html",
            template: HTML_TEMPLATE,
            chunks: ["batched"],
        }),
        new HtmlWebpackPlugin({
            title: "MapLibre GL COMTiles Debug",
            filename: "debug.html",
            template: HTML_TEMPLATE,
            chunks: ["debug"],
        }),
        new HtmlWebpackPlugin({
            title: "MapLibre GL COMTiles UNPKG",
            filename: "unpkg.html",
            template: path.join(ROOT_DIRECTORY, "debug/unpkg.html"),
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            title: "MapLibre PMTiles Demo",
            filename: "pmtiles.html",
            template: path.join(ROOT_DIRECTORY, "debug/formats/pmtiles.html"),
            chunks: [],
        }),
        new HtmlWebpackPlugin({
            title: "MapLibre GL Cotar Demo",
            filename: "cotar.html",
            template: path.join(ROOT_DIRECTORY, "debug/formats/cotar.html"),
            chunks: [],
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: path.join(ROOT_DIRECTORY, "/debug/assets"), to: "assets" }],
        }),
    ],
    devServer: {
        contentBase: DIST_DIRECTORY,
        port: 4711,
        open: true,
    },
});
