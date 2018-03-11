module.exports = {
  entry: './src/index.jsx',
  output: { path: __dirname, filename: './lib/testWebpack.js' },
  resolve: {
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
                     { test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                       loader: 'url-loader' },
                   ]
          }
};
