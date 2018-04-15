module.exports = {
  entry: './icon_select_src.js',
  output: { path: __dirname, filename: './icon_select.js' },
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
