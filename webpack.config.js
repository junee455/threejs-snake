const path = require('path');

module.exports = {
    module: {
        rules: [
            {
              test: /\.s[ac]ss$/i,
              exclude: /node_modules/,
              use: [
                  {
                    loader: 'file-loader',
                    options: {
                        name: '[name].css'
                      }
                  },
                "sass-loader",
              ],
            },
          ],
    },
    mode: 'development',
    entry: {
      main: {
        import: './src/main.js',
        library: {
          name: 'Snake',
          type: 'var'
        }
      },
      style: {
        import: './src/style.scss'
      }
    },
    // output: {
        // filename: 'main.js',
        // path: path.resolve(__dirname, 'dist'),
        // library: 'Snake'
    // },
    
    devServer: {
        static: './dist',
        hot: true
    }
}