/// <reference types="Cypress" />
import '@4tw/cypress-drag-drop'
import { treenode, dialogTitle, dialogBody, dialogMainButton, dialog } from '../support/utils';
context('Fusion Studio', function () {
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      Cypress.runner.stop()
    }
  });
  describe('Documents and Collections', function () {
    it('Browse to root dir "db"', function () {
      cy.visit('http://localhost:3000')
      .get('#theia-top-panel', { timeout: 30000 })
      .should('be.visible')
      .get('.theia-preload').should('not.exist');
      cy.addConnection();
      cy.get('.fusion-item').should('have.length', 5).its('length').then(count => {
        cy.getTreeNode('admin@http://localhost:8080/db').click();
        cy.get('.fusion-item').should('have.length.gt', count);
      });
    })
    it('create test collections', function () {
      cy.addCollection('admin@http://localhost:8080/db', 'test_col');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col').click();
      cy.addCollection('admin@http://localhost:8080/db/test_col', 'col1');
      cy.addCollection('admin@http://localhost:8080/db/test_col', 'col2');
      cy.addCollection('admin@http://localhost:8080/db/test_col', 'col3');
    })
    it('create text document', function () {
      cy.addDocument('admin@http://localhost:8080/db/test_col', 'text_file.txt');
    })
  })
  describe('Drag and drop', function () {
    it('drag move document', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/text_file.txt').should('be.visible')
        .drag(treenode('admin@http://localhost:8080/db/test_col/col1'));
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/text_file.txt').should('not.exist');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1/text_file.txt').should('be.visible');
    })
    it('drag copy document', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1/text_file.txt')
        .drag(treenode('admin@http://localhost:8080/db/test_col/col2'), { ctrlKey: true });
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1/text_file.txt').should('be.visible');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/text_file.txt').should('be.visible');
    })
    it('drag copy collection', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1').should('be.visible')
        .drag(treenode('admin@http://localhost:8080/db/test_col/col2'), { ctrlKey: true });
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1').should('be.visible');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/col1').should('be.visible').click();
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/col1/text_file.txt').should('be.visible');
    })
    it('drag move collection', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1').should('be.visible')
        .drag(treenode('admin@http://localhost:8080/db/test_col/col3'));
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col3/col1').should('be.visible');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col1').should('not.exist');
    })
  })
  describe('Renaming', function () {
    it('rename a document', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/text_file.txt').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.rename').should('be.visible').click()
      cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'text_file.txt').clear().type('new_name.txt{enter}');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/text_file.txt').should('not.exist');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/new_name.txt').should('be.visible');
    })
    it('rename a collection', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/col1').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.rename').should('be.visible').click()
      cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'col1').clear().type('other_col1{enter}');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/col1').should('not.exist');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/other_col1').should('be.visible');
    })
  })
  describe('Deleting', function () {
    it('delete a document', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/new_name.txt').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.delete').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Delete document');
      cy.get(dialogBody).should('be.visible').find('p').should('contain.text', 'Are you sure you want to delete the document: new_name.txt?');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2/new_name.txt').should('not.exist');
    })
    it('delete multiple objects', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2').should('be.visible').click();
      cy.get('body').type('{ctrl}', {release: false})
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col3').should('be.visible').click();
      cy.get('body').type('{ctrl}')
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.delete').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Delete items');
      cy.get(dialogBody).should('be.visible').find('p')
        .should('contain.text', 'Are you sure you want to delete the following items?')
        .should('contain.text', 'col2')
        .should('contain.text', 'col3');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col2').should('not.exist');
      cy.getTreeNode('admin@http://localhost:8080/db/test_col/col3').should('not.exist');
    })
    it('delete a collection', function () {
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col').should('be.visible').rightclick();
      cy.getMenuCommand('fusion.delete').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Delete collection');
      cy.get(dialogBody).should('be.visible').find('p').should('contain.text', 'Are you sure you want to delete the collection: test_col?');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode('admin@http://localhost:8080/db/test_col').should('not.exist');
    })
  })
})
