const path = require("path");

const ROOT_DIRECTORY = path.resolve("./");

const config = {
    context: ROOT_DIRECTORY,
    module: {
        rules: [
            {
                test: /\.(ts)?$/,
                loader: "ts-loader",
                options: {
                    configFile: "../tsconfig.json",
                    silent: true,
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
};

module.exports = config;
