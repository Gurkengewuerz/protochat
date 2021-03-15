const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

const jsSdkSrcDir = path.resolve(require.resolve("matrix-js-sdk/package.json"), "..", "src");

module.exports = {
  entry: {
    "indexeddb-worker": "./src/indexeddb-worker.js",
    bundle: "./src/index.js",
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build"),
  },
  devtool: "inline-source-map",
  devServer: {
    index: "index.html",
    port: 8100,
    hot: true,
    historyApiFallback: true,
    stats: "minimal",
  },
  module: {
    noParse: [
      // for cross platform compatibility use [\\\/] as the path separator
      // this ensures that the regex trips on both Windows and *nix

      // don't parse the languages within highlight.js. They cause stack
      // overflows (https://github.com/webpack/webpack/issues/1721), and
      // there is no need for webpack to parse them - they can just be
      // included as-is.
      /highlight\.js[\\\/]lib[\\\/]languages/,
    ],
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(ts|js)x?$/,
        include: f => {
          // our own source needs babel-ing
          if (f.startsWith(path.resolve(__dirname, "src"))) return true;

          // we use the original source files of react-sdk and js-sdk, so we need to
          // run them through babel. Because the path tested is the resolved, absolute
          // path, these could be anywhere thanks to yarn link. We must also not
          // include node modules inside these modules, so we add 'src'.
          if (f.startsWith(jsSdkSrcDir)) return true;

          // but we can't run all of our dependencies through babel (many of them still
          // use module.exports which breaks if babel injects an 'include' for its
          // polyfills: probably fixable but babeling all our dependencies is probably
          // not necessary anyway). So, for anything else, don't babel.
          return false;
        },
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
        },
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    // We need to specify that TS can be resolved without an extension
    extensions: [".js", ".json", ".ts", ".tsx"],
    alias: {
      "matrix-js-sdk": path.resolve(__dirname, "node_modules/matrix-js-sdk"),
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
  },
  output: {
    path: path.join(__dirname, "build"),

    // The generated JS (and CSS, from the extraction plugin) are put in a
    // unique subdirectory for the build. There will only be one such
    // 'bundle' directory in the generated tarball; however, hosting
    // servers can collect 'bundles' from multiple versions into one
    // directory and symlink it into place - this allows users who loaded
    // an older version of the application to continue to access webpack
    // chunks even after the app is redeployed.
    filename: "bundles/[fullhash]/[name].js",
    chunkFilename: "bundles/[fullhash]/[name].js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "assets/"),
          to: path.resolve(__dirname, "build/assets/"),
        },
      ],
    }),
  ],
};
