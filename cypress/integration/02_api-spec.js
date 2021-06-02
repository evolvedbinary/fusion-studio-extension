/// <reference types="Cypress" />

import { apiHost } from "../support/config";

context('Talking to the api directly', () => {
  describe('API version', () => {
    before(function() {
      cy.connect();
      cy.visit('/');
    });
    it('should fail to connect with older api', () => {
      cy.window().then(function(win) {
        cy.stub(win, 'fetch').callThrough().withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/version').as('version api').resolves({
          status: 200,
          ok: true,
          json: () => ({
            version: '0.0.1',
            "server": {
              "product-name": "eXist",
              "build": "20200123123609",
              "version": "5.2.0",
              "revision": "c58d04ec45de50e7738489dee072fcc863dc8b1b"
            },
            "exist-db": {
              "compatible-version": null
            }
          }),
        });
      });
      cy.get('.fusion-item').click().then(() => {
        cy.get('.dialogTitle').should('contain.text', 'New Connection');
        cy.get('.dialogContent').should('be.visible')
          .should('contain.text', 'Outdated API "0.0.1"')
          .should('contain.text', 'You need to update your API to version "0.2.0" or higher');
        cy.get('.theia-button.main').should('be.visible').click();
        cy.get('.dialogBlock').should('not.exist');
      });
    });
    it.only('should connect with newer api', () => {
      cy.window().then(function(win) {
        const fetchSpy = cy.spy(win, 'fetch');
        const versionSpy = fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/version').as('version api');
        const explorerSpy = fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/explorer?uri=/').as('explorer');
        const userSpy = fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/user').as('user');
        const groupSpy = fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/group').as('group');
        const indexSpy = fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/index').as('index');
        const restxqSpy = fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/restxq').as('restxq');
        cy.get('.fusion-item').click().then(() => {
          cy.get('.ReactVirtualized__Grid__innerScrollContainer')
            .should('contain', 'db')
            .should('contain', 'RestXQ').then(() => {
              expect(versionSpy).to.be.called;
              expect(explorerSpy).to.be.called;
              expect(userSpy).to.be.called;
              expect(groupSpy).to.be.called;
              expect(indexSpy).to.be.called;
              expect(restxqSpy).to.be.called;
            });
        });
      });
    });
  });
})