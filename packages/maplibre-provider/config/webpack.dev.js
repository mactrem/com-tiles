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
    devtool: "inline-source-map",
    entry: {
        index: path.join(ROOT_DIRECTORY, "debug/index.ts"),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "MapLibre GL COMTiles Demo",
            filename: "index.html",
            template: HTML_TEMPLATE,
            chunks: ["index"],
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
