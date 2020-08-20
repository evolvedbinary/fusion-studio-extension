/// <reference types="Cypress" />
import { dialogTitle, dialogBody, dialogMainButton, dialog } from '../support/utils';

const { dialogTitle, dialogBody, dialogMainButton, dialog } = require("../support/utils");

context('Fusion Studio', function () {
  describe('API minimum version', function () {
    it('should connect with newer api', function () {
      cy.visit('http://localhost:3000', {
        onBeforeLoad(win) {
          cy.stub(win, 'fetch').callThrough().withArgs('http://localhost:8080/exist/restxq/fusiondb/version').as('version api').resolves({
            status: 200,
            ok: true,
            json: () => ({
              "server" : {
                "product-name" : "eXist",
                "build" : "20200123123609",
                "version" : "5.2.0",
                "revision" : "c58d04ec45de50e7738489dee072fcc863dc8b1b"
              },
              "version" : "999.0.0"
            }),
          });
        },
      }).get('#theia-top-panel', {timeout: 30000})
        .should('be.visible')
        .get('.theia-preload').should('not.be.visible');
      cy.addConnection();
      cy.getTreeNode('admin@http://localhost:8080/db').should('exist');
    })
    it('shouldn\'t connect with older api', function () {
      cy.visit('http://localhost:3000', {
        onBeforeLoad(win) {
          cy.stub(win, 'fetch').callThrough().withArgs('http://localhost:8080/exist/restxq/fusiondb/version').as('version api').resolves({
            status: 200,
            ok: true,
            json: () => ({
              "server" : {
                "product-name" : "eXist",
                "build" : "20200123123609",
                "version" : "5.2.0",
                "revision" : "c58d04ec45de50e7738489dee072fcc863dc8b1b"
              },
              "version" : "0.0.1"
            }),
          });
        },
      }).get('#theia-top-panel', {timeout: 30000})
        .should('be.visible')
        .get('.theia-preload').should('not.be.visible');
      cy.addConnection();
      cy.get(dialogTitle).should('contain.text', 'New Connection');
      cy.get(dialogBody).should('be.visible')
        .should('contain.text', 'Outdated API "0.0.1"')
        .should('contain.text', 'You need to update your API to version "0.2.0" or higher');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.be.visible');
    })
  })
})