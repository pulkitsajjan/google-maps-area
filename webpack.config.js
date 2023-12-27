const path = require('path');
const webpack = require('webpack');
const CONFIG = {
  mode: 'development',

  entry: {
    app: './src/app.js'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
    }
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = CONFIG;
