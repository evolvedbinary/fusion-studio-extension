// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// see https://github.com/javierbrea/cypress-localstorage-commands
// import "cypress-localstorage-commands"

// -- This is a parent command --
// populate localStorage with a default connection, automatically cleared before each spec
// assumes default 'admin' user and '' password
// actual server URL is retrieved via ENV
Cypress.Commands.add("connect", () => {
    // conn_val mimics actual app behavior, its value is inconsequential for establishing a connection
    let conn_val = 'admin@' + Cypress.env('API_HOST')
    let nested = { "name": "localhost", "server": Cypress.env('API_HOST'), "username": "admin", "password": "", "users": [], "groups": [] }
    let obj = {}
    obj[conn_val] = nested

    localStorage.setItem('connections', JSON.stringify(obj))

})
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
