/// <reference types="Cypress" />
// TODO: add spies
import { FSApi } from '../../fusion-studio-extension/src/common/api';
context('Fusion Studio', () => {
  describe('Drag and drop', () => {
    let dataTransfer;
    const connection = {
      server: Cypress.env('API_HOST'),
      username: 'admin',
      password: '',
    };
    before(() => {
      // prepare collections/documents used in the test
      new Cypress.Promise(async resolve => {
        await FSApi.remove(connection, '/db/test_col', true).catch(e => { });
        await FSApi.newCollection(connection, '/db/test_col');
        await FSApi.newCollection(connection, '/db/test_col/col1');
        await FSApi.newCollection(connection, '/db/test_col/col2');
        await FSApi.newCollection(connection, '/db/test_col/col3');
        await FSApi.save(connection, '/db/test_col/col1/test.txt', 'test text file');
        resolve();
      })
      cy.connect()
      cy.visit('/')
      cy.get('.fusion-view')
        .should('be.visible')
        .find('.fusion-item')
        .click()
      cy.get('.fusion-view')
        .contains('db')
        .click()
      cy.get('.fusion-view')
        .contains('test_col')
        .click()
      cy.get('.fusion-view')
        .contains('col1')
        .click()
      cy.get('.fusion-view')
        .contains('col2')
        .click()
      cy.get('.fusion-view')
        .contains('col3')
        .click()
      cy.get('.fa-spinner')
        .should('not.exist')
    })
    beforeEach(() => {
      cy.window().then(win => cy.spy(win, 'fetch').as('fetch'));
      dataTransfer = new DataTransfer();
    });
    after(() => {
      // clean the test colelction
      new Cypress.Promise(resolve => FSApi.remove(connection, '/db/test_col', true).then(resolve).catch(resolve))
    })

    it('should move a document', () => {
      cy.get('[node-id$="col1\\/test.txt"]')
        .should('be.visible')
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=col2]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer })
      cy.get('[node-id$="col1\\/test.txt"]')
        .should('not.exist')
      cy.get('[node-id$="col2\\/test.txt"]')
        .should('be.visible')
    })

    it('should copy a document', () => {
      cy.get('[node-id$="col2\\/test.txt"]')
        .should('be.visible')
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=col1]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer, ctrlKey: true })
      cy.get('[node-id$="col1\\/test.txt"]')
        .should('be.visible')
      cy.get('[node-id$="col2\\/test.txt"]')
        .should('be.visible')
    })

    it('should move a collection', () => {
      cy.get('[node-id$="test_col\\/col1"]')
        .should('be.visible')
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=col2]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer })
      cy.get('[node-id$="test_col\\/col1"]')
        .should('not.exist')
      cy.get('[node-id$="col2\\/col1"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="col2\\/col1\\/test.txt"]')
        .should('be.visible')
    })

    it('should copy a collection', () => {
      cy.get('[node-id$="test_col\\/col2\\/col1"]')
        .should('be.visible')
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=test_col]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer, ctrlKey: true })
      cy.get('[node-id$="test_col\\/col2\\/col1"]')
        .should('be.visible')
      cy.get('[node-id$="col2\\/col1\\/test.txt"]')
        .should('be.visible')
      cy.get('[node-id$="test_col\\/col1"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="test_col\\/col1\\/test.txt"]')
        .should('be.visible')
    })

    it('should move multiple items', () => {
      cy.get('[node-id$="test_col\\/col2"]')
        .should('be.visible')
        .trigger('click')
      cy.get('[node-id$="test_col\\/col1"]')
        .should('be.visible')
        .trigger('click', { ctrlKey: true })
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=col3]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer })
      cy.get('[node-id$="test_col\\/col1"]')
        .should('not.exist')
      cy.get('[node-id$="test_col\\/col2"]')
        .should('not.exist')
      cy.get('[node-id$="col3\\/col1"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="col3\\/col1\\/test.txt"]')
        .should('be.visible')
      cy.get('[node-id$="col3\\/col2"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="col3\\/col2\\/test.txt"]')
        .should('be.visible')
        cy.get('[node-id$="col3\\/col2\\/col1"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="col3\\/col2\\/col1\\/test.txt"]')
        .should('be.visible')
    })

    it('should copy multiple items', () => {
      cy.get('[node-id$="test_col\\/col3\\/col2"]')
        .should('be.visible')
        .trigger('click')
      cy.get('[node-id$="test_col\\/col3\\/col1"]')
        .should('be.visible')
        .trigger('click', { ctrlKey: true })
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=test_col]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer, ctrlKey: true })
      cy.get('[node-id$="test_col\\/col3\\/col1"]')
        .should('be.visible')
      cy.get('[node-id$="test_col\\/col3\\/col2"]')
        .should('be.visible')
      cy.get('[node-id$="test_col\\/col1"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="test_col\\/col1\\/test.txt"]')
        .should('be.visible')
      cy.get('[node-id$="test_col\\/col2"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="test_col\\/col2\\/test.txt"]')
        .should('be.visible')
        cy.get('[node-id$="test_col\\/col2\\/col1"]')
        .should('be.visible')
        .click()
      cy.get('[node-id$="test_col\\/col2\\/col1\\/test.txt"]')
        .should('be.visible')
    })

    it('should not move to a sub collection', () => {
      cy.get('[node-id$="test_col\\/col2"]')
        .should('be.visible')
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=test_col\\/col2\\/col1]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer })
      cy.get('[node-id$="test_col\\/col2\\/col1\\/col2"]')
        .should('not.exist')
      cy.get('[node-id$="test_col\\/col2"]')
        .should('be.visible')
    })

    it('should not copy to a sub collection', () => {
      cy.get('[node-id$="test_col\\/col2"]')
        .should('be.visible')
        .trigger('dragstart', { dataTransfer })
      cy.get('[node-id$=test_col\\/col2\\/col1]')
        .trigger('dragover', { dataTransfer })
        .trigger('drop', { dataTransfer, ctrlKey: true })
      cy.get('[node-id$="test_col\\/col2\\/col1\\/col2"]')
        .should('not.exist')
      cy.get('[node-id$="test_col\\/col2"]')
        .should('be.visible')
    })

  })


})