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
import "cypress-localstorage-commands"

// -- This is a parent command --
// populate localStorage with a default connection, automatically cleared before each spec
Cypress.Commands.add("connect", () => { 
    // see https://stackoverflow.com/questions/56431316/set-local-storage-in-cypress
    // cy.request('http://localhost:8080/exist/restxq/fusiondb')
    localStorage.setItem('connections',	JSON.stringify({"admin@http://localhost:8080":{"name":"localhost","server":"http://localhost:8080","username":"admin","password":"","users":[],"groups":[]}}))

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
