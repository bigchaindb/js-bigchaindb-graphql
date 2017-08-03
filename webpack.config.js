/* eslint-disable strict, no-console, object-shorthand */

'use strict'

const path = require('path')

const webpack = require('webpack')

const PRODUCTION = process.env.NODE_ENV === 'production'

const PATHS = {
    ENTRY: path.resolve(__dirname, './src/index.js'),
    BUNDLE: path.resolve(__dirname, 'dist/browser'),
    NODE_MODULES: path.resolve(__dirname, 'node_modules'),
}

const OUTPUTS = [
    {
        filename: PRODUCTION ? 'bigchaindb-graphql.window.min.js' : 'bigchaindb-graphql.window.js',
        library: 'BigchainDB-GraphQL',
        libraryTarget: 'window',
        path: PATHS.BUNDLE,
    },
    {
        filename: PRODUCTION ? 'bigchaindb-graphql.umd.min.js' : 'bigchaindb-graphql.umd.js',
        library: 'bigchaindb-graphql',
        libraryTarget: 'umd',
        path: PATHS.BUNDLE,
    },
    {
        filename: PRODUCTION ? 'bigchaindb-graphql.cjs.min.js' : 'bigchaindb-graphql.cjs.js',
        library: 'bigchaindb-graphql',
        libraryTarget: 'commonjs',
        path: PATHS.BUNDLE,
    },
    {
        filename: PRODUCTION ? 'bigchaindb-graphql.cjs2.min.js' : 'bigchaindb-graphql.cjs2.js',
        library: 'bigchaindb-graphql',
        libraryTarget: 'commonjs2',
        path: PATHS.BUNDLE,
    },
    {
        filename: PRODUCTION ? 'bigchaindb-graphql.amd.min.js' : 'bigchaindb-graphql.amd.js',
        library: 'bigchaindb-graphql',
        libraryTarget: 'amd',
        path: PATHS.BUNDLE,
    }
]


/** PLUGINS **/
const PLUGINS = [
    new webpack.NoEmitOnErrorsPlugin(),
]

const PROD_PLUGINS = [
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
        },
        output: {
            comments: false,
        },
        sourceMap: true,
    }),
    new webpack.LoaderOptionsPlugin({
        debug: false,
        minimize: true,
    }),
]

if (PRODUCTION) {
    PLUGINS.push(...PROD_PLUGINS)
}

const configBoilerplate = {
    entry: [PATHS.ENTRY],

    devtool: PRODUCTION ? '#source-map' : '#inline-source-map',

    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'], // Don't use absolute path here to allow recursive matching
    },

    plugins: PLUGINS,

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [PATHS.NODE_MODULES],
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                    },
                }],
            },
        ],
    },
}

/** EXPORTED WEBPACK CONFIG **/
const config = OUTPUTS.map(output => {
    const configCopy = Object.assign({}, configBoilerplate)
    configCopy.output = output
    return configCopy
})

module.exports = config
