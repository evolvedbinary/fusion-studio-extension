/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun theia build again.
 */
const webpack = require('webpack');
const config = require('./gen-webpack.config.js');
const yargs = require('yargs');

if (yargs.option('mode').argv.mode === 'development') {
  console.log('Development mode. Including process variable...');
  config.plugins.push(new webpack.ProvidePlugin({ process: require.resolve('process/browser') }));
}
module.exports = config;