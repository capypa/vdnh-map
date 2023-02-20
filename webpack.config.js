const webpack = require('webpack');
const path = require('path');

const { VueLoaderPlugin } = require('vue-loader');
const HtmlPlugin = require('html-webpack-plugin');
const AutoprefixerPlugin = require('autoprefixer');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env = {}, argv = {}) => {
  const {
    mode: MODE,
  } = argv;

  const PRODUCTION = MODE === 'production';
  const DEVELOPMENT = MODE === 'development';

  const config = {
    entry: path.resolve(__dirname, './src/ui/index.js'),
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, './dist/ui'),
      publicPath: '/',
      chunkFilename: `chunks/[name].bundle.js`,
      hotUpdateMainFilename: '~hot-update.[fullhash].json',
      hotUpdateChunkFilename: '~hot-update.[id].[fullhash].js',
      clean: true,
    },

    devtool: DEVELOPMENT ? 'eval-cheap-module-source-map' : false,

    optimization: {
      minimize: PRODUCTION,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          extractComments: true,
          terserOptions: {
            compress: {
              pure_funcs: [
                'console.log',
                'console.info',
                'console.dir',
                'console.debug',
              ],
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
    },

    cache: {
      type: PRODUCTION ? 'filesystem' : 'memory',
    },

    performance: {
      hints: false,
    },
    stats: {
      children: false,
      entrypoints: false,
      modules: false,
    },

    module: {
      rules: [
        {
          test: /\.vue$/i,
          use: [
            'vue-loader',
          ],
          include: path.resolve(__dirname, `./src/ui/`),
          exclude: path.resolve(__dirname, `./node_modules/`),
        },
        {
          test: /\.m?js$/i,
          use: [
            {
              loader: 'babel-loader',
              options: {
                envName: MODE,
              },
            },
          ],
          resolve: {
            fullySpecified: false,
          },
          include: [
            path.resolve(__dirname, `./src/ui/`),
          ],
        },
        {
          test: /\.s?css$/i,
          use: [
            {
              loader: 'vue-style-loader',
            },
            {
              loader: 'css-loader',
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    AutoprefixerPlugin({
                      env: MODE,
                    }),
                  ],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: false,
                sassOptions: {
                  quietDeps: true,
                },
              },
            },
          ],
        },
        {
          test: /\.(eot|ttf|woff|woff2)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[hash][ext]',
          },
        },
      ],
    },
    resolve: {
      extensions: ['*', '.vue', '.js', '.json', '.scss'],
      alias: {
        assets: path.resolve(__dirname, './src/ui/assets'),
        screens: path.resolve(__dirname, './src/ui/screens'),
        stores: path.resolve(__dirname, './src/ui/stores'),
        styles: path.resolve(__dirname, './src/ui/styles'),
        src: path.resolve(__dirname, './src/ui'),
        //
        vue$: path.resolve(__dirname, './node_modules/vue'),
      },
    },
    plugins: [
      new HtmlPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, './src/ui/index.html'),
        title: 'VDNH',
        meta: {
          charset: { charset: 'utf-8' },
          viewport: 'width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, shrink-to-fit=no',
        },
        minify: {
          collapseWhitespace: true,
          removeComments: false,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: false,
        },
      }),
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        DEVELOPMENT,
        PRODUCTION,
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
      }),
      new webpack.ProvidePlugin({}),
    ],
  };

  return config;
};
