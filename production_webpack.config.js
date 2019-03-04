const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
module.exports = [{
  mode: 'production',
  entry: './src/index.jsx',
  output: { path: path.join(__dirname, 'dist/web/'), filename: './efs.js' },
  resolve: {
    alias: {
      '../../theme.config$': path.join(__dirname, 'semantic_theming/theme.config')
    },
    extensions: ['.js', '.jsx'],
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: false,
        cache: true,
        parallel: true,
        uglifyOptions: {
          warnings: false,
          parse: {},
          compress: {
            drop_console: true,
          },
          mangle: true,
          output: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_fnames: false,
        }
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  performance: {
    // 15MB is an extremely high limit here.
    // Obviously the web version needs splitting at some point.
    // Since the warning is rather verbose and obvious we're going to hide it in the mean time.
    maxEntrypointSize: 15000000,
    maxAssetSize: 15000000,
  },
  module: {
    rules: [
      {
        test: /src\/sim\.worker\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              name: 'sim.worker.js',
              inline: true,
              fallback: false,
            }
          },
          { loader: 'babel-loader?cacheDirectory=true' },
        ]
      },
      { test: /\.(js|jsx)$/, exclude: [/\.worker\.js$/, /(node_modules|bower_components)/],
        use: { loader: 'babel-loader?cacheDirectory=true' }
      },
      {
        test: /\.(png|jpg|gif|svg|ico)$/,
        loader: 'url-loader'
      },
      { test: /\.(css|less)$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader", options: { importLoaders: 1 } },
          { loader: "postcss-loader" },
// Restore default text selection behaviour.
          { loader: 'string-replace-loader',
            options: {
              multiple: [
                {
                  search: `
textarea::selection, input::selection .
  background-color: rgba.100, 100, 100, 0.4.;
  color: rgba.0, 0, 0, 0.87.;
.`.replace(/( |\n)/g, '\\s*').replace(/selection/g, '+(-moz-)?selection'),
                  replace: '',
                  flags: 'g',
                }, {
                  search: `
::selection .
  background-color: #CCE2FF;
  color: rgba.0, 0, 0, 0.87.;
.`.replace(/( |\n)/g, '\\s*').replace(/selection/g, '+(-moz-)?selection'),
                  replace: '',
                  flags: 'g',
                }
              ]
            }
          },
          { loader: 'less-loader', options: { env: 'production' } }
        ]
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=1000000&mimetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader'
      },
      {
        test: /\.otf(\?.*)?$/,
        loader: 'url-loader'
      },
    ]
  },
  plugins: [
    // this handles the bundled .css output file
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ]
}];
