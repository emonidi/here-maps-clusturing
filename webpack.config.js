const path = require('path');

module.exports = {
    mode:"production",
    entry:"./src",
    output:{
        path: path.resolve(__dirname, "dist"),
        filename:'bundle.js'
    },
    devtool: 'eval-source-map',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 9000,
        hot:true,
        index:"./index.html"
    },
    module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }
        ]
      }
}