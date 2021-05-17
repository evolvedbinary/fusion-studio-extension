/// <reference types="Cypress" />
import { mkApiUrl, mkApiPathUrl } from '../support/config.js';
import { dialogTitle, dialogBody, dialogMainButton, dialog } from '../support/utils';

context('Fusion Studio', function () {
  describe('API minimum version', function () {
    it('should connect with newer api', function () {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win, 'fetch').callThrough().withArgs(mkApiUrl('/version')).as('version api').resolves({
            status: 200,
            ok: true,
            json: () => ({
              "server" : {
                "product-name" : "eXist",
                "build" : "20200123123609",
                "version" : "5.2.0",
                "revision" : "c58d04ec45de50e7738489dee072fcc863dc8b1b"
              },
              "exist-db" : {
                "compatible-version" : null
              }
              
            }),
          });
        },
      }).get('#theia-top-panel', {timeout: 60000})
        .should('be.visible')
        .get('.theia-preload').should('not.exist');
      cy.addConnection();
      cy.getTreeNode(mkApiPathUrl('admin', '/db')).should('exist');
    })
    // TODO(DP) this test is failing properly it seems, figure out why and adjust test logic 
    it.skip('shouldn\'t connect with older api', function () {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win, 'fetch').callThrough().withArgs(mkApiUrl('/version')).as('version api').resolves({
            status: 200,
            ok: true,
            json: () => ({
              "server" : {
                "product-name" : "eXist",
                "build" : "20200123123609",
                "version" : "5.2.0",
                "revision" : "c58d04ec45de50e7738489dee072fcc863dc8b1b"
              },
              "exist-db": {
                "compatible-version" : "0.0.1"
              }
              
            }),
          });
        },
      }).get('#theia-top-panel', {timeout: 60000})
        .should('be.visible')
        .get('.theia-preload').should('not.exist');
      cy.addConnection();
      // cy.get(dialogTitle).should('contain.text', 'New Connection');
      cy.get(dialogBody).should('be.visible')
        .should('contain.text', 'Outdated API "0.0.1"')
        .should('contain.text', 'You need to update your API to version "0.2.0" or higher');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
    })
  })
})
