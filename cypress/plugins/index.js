// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // TODO(DP): see #379 this needs to be made flexible

  config.env.API_PORT = process.env.API_PORT ? process.env.API_PORT : 4059;
  config.env.FS_PORT = process.env.FS_PORT ? process.env.FS_PORT : 3000;
  return config;
}
