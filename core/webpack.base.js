const path = require('path')
const webpack = require('webpack')
const ChromeReloadPlugin = require('wcer')
const { cssLoaders, htmlPage } = require('./tools')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const GenerateLocaleJsonPlugin = require('../plugins/GenerateLocaleJsonPlugin')

const rootDir = path.resolve(__dirname, '..')

let resolve = (dir) => path.join(rootDir, 'src', dir)

module.exports = (env) => {
  Object.assign(process.env, env)
  return {
    entry: {
      tab: resolve('./tab'),
      options: resolve('./options'),
      content: resolve('./content'),
      background: resolve('./backend')
    },
    output: {
      path: path.join(rootDir, 'build', (!env.FIREFOX) ? 'chrome' : 'firefox'),
      publicPath: '/',
      filename: 'js/[name].js',
      chunkFilename: 'js/[id].[name].js?[hash]',
      library: '[name]'
    },
    resolve: {
      extensions: ['.js', '.vue', '.json']
    },
    module: {
      rules: [{
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.join(rootDir, 'src')],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      }, {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          extractCSS: true,
          loaders: {
            ...cssLoaders(),
            js: { loader: 'babel-loader' }
          },
          transformToRequire: {
            video: 'src',
            source: 'src',
            img: 'src',
            image: 'xlink:href'
          }
        }
      }, {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(rootDir, 'src'),
          path.join(rootDir, 'node_modules', 'vue-awesome'),
          // https://github.com/sagalbot/vue-select/issues/71#issuecomment-229453096
          path.join(rootDir, 'node_modules', 'element-ui', 'src', 'utils')
        ]
      }, {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[hash:7].[ext]'
        }
      }, {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name].[hash:7].[ext]'
        }
      }, {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]'
        }
      }]
    },
    plugins: [
      new CleanWebpackPlugin(['*'],
        { root: path.join(rootDir, 'build', (env.FIREFOX) ? 'firefox' : 'chrome') }),
      htmlPage('Counter for Messenger', 'app', ['vendor', 'element', 'chartjs', 'tab']),
      htmlPage('options', 'options', ['vendor', 'element', 'chartjs', 'options']),
      htmlPage('background', 'background', ['vendor', 'element', 'chartjs', 'background']),
      new webpack.DefinePlugin({
        chrome: (!env.FIREFOX) ? 'chrome' : 'browser',
        'process.env.CHROME': (env.CHROME) ? 'true' : 'false',
        'process.env.FIREFOX': (env.FIREFOX) ? 'true' : 'false',
        'process.env.BETA': (env.BETA) ? 'true' : 'false',
        'process.env.ALPHA': (env.ALPHA) ? 'true' : 'false'
      }),
      new CopyWebpackPlugin([{ from: path.join(rootDir, 'static') }]),
      new ChromeReloadPlugin({
        port: (!env.FIREFOX) ? 9090 : 9091,
        manifest: path.join(rootDir, 'src', 'manifest.js')
      }),
      new GenerateLocaleJsonPlugin({
        _locales: path.join(rootDir, 'src', '_locales')
      }),
      // Coz mozilla(firefox) addon store cannot accept single file bigger than 4mb, separate it.
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: (m) => /node_modules/.test(m.context)
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'element',
        minChunks: (m) => m.context.indexOf(path.join('node_modules', 'element-ui')) > -1 ||
          m.context.indexOf(path.join('node_modules', 'chart.js')) > -1
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'chartjs',
        minChunks: (m) => m.context.indexOf(path.join('node_modules', 'chart.js')) > -1
      }),
      // never use locales of moment.js, so don't iclude it.
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
    performance: { hints: false }
  }
}
