const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
  entry: './src/index.jsx',
  output: { path: path.join(__dirname, 'src/css'), filename: './../../lib/testWebpack.js' },
  resolve: {
    alias: {
        '../../theme.config$': path.join(__dirname, 'semantic_theming/theme.config')
    },
    extensions: ['.js', '.jsx'],
  },
  module: { rules: [ { test: /\.(js|jsx)$/, exclude: /(node_modules|bower_components)/,
                       use: { loader: 'babel-loader' }
                     },
                     { test: /\.css$/,
                       use: [
                         { loader: "style-loader" },
                         { loader: "css-loader" }
                       ]
                     },
                     {
                       test: /\.(png|jpg|gif|svg|ico)$/,
                       loader: 'url-loader'
                     },
                     {
                       use: ExtractTextPlugin.extract({
                         use: ['css-loader', 'less-loader']
                       }),
                       test: /\.less$/
                     },
                     {
                       test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                       loader: 'url-loader?limit=10000&mimetype=application/font-woff'
                     },
                     {
                       test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                       loader: 'file-loader'
                     },
                     {
                       test: /\.otf(\?.*)?$/,
                       use: 'file-loader?name=/fonts/[name].  [ext]&mimetype=application/font-otf'
                     },
                   ]
          },
  plugins: [
    // this handles the bundled .css output file
    new ExtractTextPlugin({
      filename: '[name].css',
    }),
  ]
};
