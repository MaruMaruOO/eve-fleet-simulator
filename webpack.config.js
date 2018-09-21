const path = require('path');
module.exports = [{
  mode: 'development',
  entry: './src/index.jsx',
  devtool: "source-map",
  output: { path: path.join(__dirname, 'lib'), filename: './testWebpack.js' },
  resolve: {
    alias: {
      '../../theme.config$': path.join(__dirname, 'semantic_theming/theme.config')
    },
    extensions: ['.js', '.jsx'],
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
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: 'less-loader' }
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
  ]
}];
