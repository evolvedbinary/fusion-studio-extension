/// <reference types="Cypress" />
import { mkApiPathUrl, apiHost, apiPort } from '../support/config.js';
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
      cy.visit('/')
      .get('#theia-top-panel', { timeout: 30000 })
      .should('be.visible')
      .get('.theia-preload').should('not.exist');
      cy.addConnection();
      cy.get('.fusion-item').should('have.length', 5).its('length').then(count => {
        cy.getTreeNode(mkApiPathUrl('admin', '/db')).click();
        cy.get('.fusion-item').should('have.length.gt', count);
      });
    })
    // TODO(DP): 
    // - this needs to clean up after itself to allow for repeated runs in case of failures
    // - the "item already exists" warning needs its own test to check if it is visible in case of name clashes
    it('create test collections', function () {
      cy.addCollection(mkApiPathUrl('admin', '/db'), 'test_col');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).click();
      cy.addCollection(mkApiPathUrl('admin', '/db/test_col'), 'col1');
      cy.addCollection(mkApiPathUrl('admin', '/db/test_col'), 'col2');
      cy.addCollection(mkApiPathUrl('admin', '/db/test_col'), 'col3');
    })
    it('create text document', function () {
            cy.addDocument(mkApiPathUrl('admin', '/db/test_col'), 'text_file.txt');
    })
  })
  describe('Drag and drop', function () {
    it('drag move document', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/text_file.txt')).should('be.visible')
        .drag(treenode(mkApiPathUrl('admin', '/db/test_col/col1')), { hoverTime: 1000 });
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/text_file.txt')).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1/text_file.txt')).should('be.visible');
    })
    it('drag copy document', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1/text_file.txt'))
        .drag(treenode(mkApiPathUrl('admin', '/db/test_col/col2')), { ctrlKey: true, hoverTime: 1000 });
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1/text_file.txt')).should('be.visible');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/text_file.txt')).should('be.visible');
    })
    it('drag copy collection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1')).should('be.visible')
        .drag(treenode(mkApiPathUrl('admin', '/db/test_col/col2')), { ctrlKey: true, hoverTime: 1000 });
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1')).should('be.visible');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/col1')).should('be.visible').click();
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/col1/text_file.txt')).should('be.visible');
    })
    it('drag move collection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1')).should('be.visible')
        .drag(treenode(mkApiPathUrl('admin', '/db/test_col/col3')), { hoverTime: 1000 });
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col3/col1')).should('be.visible');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col1')).should('not.exist');
    })
  })
  describe('Renaming', function () {
    it('rename a document', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/text_file.txt')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.rename').should('be.visible').click()
      cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'text_file.txt').clear().type('new_name.txt{enter}');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/text_file.txt')).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/new_name.txt')).should('be.visible');
    })
    it('rename a collection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/col1')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.rename').should('be.visible').click()
      cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'col1').clear().type('other_col1{enter}');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/col1')).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/other_col1')).should('be.visible');
    })
    it('rename a connection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.rename').should('be.visible').click()
      cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'localhost').clear().type('new_name{enter}');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin')).should('be.visible').contains('new_name');
    })
  })
  describe('Deleting', function () {
    it('delete a document', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/new_name.txt')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.delete').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Delete document');
      cy.get(dialogBody).should('be.visible').find('p').should('contain.text', 'Are you sure you want to delete the document: new_name.txt?');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2/new_name.txt')).should('not.exist');
    })
    it('delete multiple objects', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2')).should('be.visible').click();
      cy.get('body').type('{ctrl}', {release: false})
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col3')).should('be.visible').click();
      cy.get('body').type('{ctrl}')
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.delete').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Delete items');
      cy.get(dialogBody).should('be.visible').find('p')
        .should('contain.text', 'Are you sure you want to delete the following items?')
        .should('contain.text', 'col2')
        .should('contain.text', 'col3');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col2')).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/col3')).should('not.exist');
    })
    it('delete a collection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.delete').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Delete collection');
      cy.get(dialogBody).should('be.visible').find('p').should('contain.text', 'Are you sure you want to delete the collection: test_col?');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).should('not.exist');
    })
    it('delete a connection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.disconnect').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Remove Connection');
      cy.get(dialogBody).should('be.visible').find('p')
        .should('contain.text', 'Are you sure you want to remove the connection: new_name?')
        .should('contain.text', `Server URI: ${apiHost}${apiPort}`)
        .should('contain.text', 'Username: admin');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin')).should('not.exist');
    })
  })
})
