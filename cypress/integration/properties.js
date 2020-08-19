/// <reference types="Cypress" />
import '@4tw/cypress-drag-drop'
import { treenode, dialogTitle, dialogBody, dialogMainButton, dialog } from '../support/utils';
context('Properties dialog', function () {
  afterEach(function () {
    if (this.currentTest.state === 'failed') {
      Cypress.runner.stop()
    }
  });
  after(function () {
    cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/new_test_col').rightclick();
      cy.getMenuCommand('fusion.delete').click()
      cy.get(dialogMainButton).click();
  });
  before(function () {
    cy.visit('http://localhost:3000')
      .get('#theia-top-panel', { timeout: 30000 })
      .should('be.visible')
      .get('.theia-preload').should('not.be.visible');
    cy.addConnection();
    cy.get('.fusion-item').should('have.length', 5).its('length').then(count => {
      cy.getTreeNode('admin@http://localhost:8080/db').click();
      cy.get('.fusion-item').should('have.length.gt', count);
      cy.addCollection('admin@http://localhost:8080/db', 'test_col');
    })
    cy.waitForLoading();
    cy.getTreeNode('admin@http://localhost:8080/db/test_col').click().rightclick()
    cy.getSubMenu('New document...').trigger('mousemove').getMenuCommand('fusion.new-document').should('be.visible').click()
    cy.get(dialogBody).should('be.visible').find('input.theia-input[type=text]').type('text_file.txt');
    cy.get(dialogMainButton).should('be.visible').click();
    cy.get('.p-Widget.p-TabBar li[title=' + CSS.escape('admin@http://localhost:8080/db/test_col/text_file.txt') + ']').click();
    cy.get('[role=presentation].editor-scrollable').click().type('Sample text file content');
    cy.get('#theia-top-panel .p-MenuBar-item').contains('File').click()
    cy.get('.p-Menu-item[data-type=command][data-command=core\\.save]').click()
  })
  describe('Renaming objects', function () {
    it('rename a document', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/text_file.txt').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Properties');
      cy.get(dialogBody).should('be.visible')
        .find('td.label').should('contain.text', 'Name')
        .find('+ td.value input.theia-input[type=text]').should('contain.value', 'text_file.txt').type('new_name.txt');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.be.visible');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/text_file.txt').should('not.be.visible');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/new_name.txt').should('be.visible');
    })
    it('rename a collection', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Properties');
      cy.get(dialogBody).should('be.visible')
        .find('td.label').should('contain.text', 'Name')
        .find('+ td.value input.theia-input[type=text]').should('contain.value', 'test_col').type('new_test_col');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.be.visible');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col').should('not.be.visible');
      cy.getTreeNode('admin@http://localhost:8080/db/new_test_col').should('be.visible');
    })
  })
})
