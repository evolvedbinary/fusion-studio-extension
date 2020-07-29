/// <reference types="Cypress" />
import utils from './utils';
const cyu = utils(cy);
context('Fusion Studio', function () {
  describe('Files', function () {
    it('Browse to root dir "db"', function () {
      cy.visit('http://localhost:3000')
        .get('#theia-top-panel', { timeout: 30000 })
        .should('be.visible')
        .get('.theia-preload').should('not.be.visible');
      cyu.addConnection();
      cy.get('.fusion-item').should('have.length', 5).its('length').then(count => {
        cyu.getTreeNode('admin@http://localhost:8080/db').click()
        cy.get('.fusion-item').should('have.length.gt', count);
      });
    })
    it('create test collection', function () {
      cyu.getTreeNode('admin@http://localhost:8080/db').rightclick()
      cyu.getMenuCommand('fusion.new-collection').should('be.visible').click()
      cy.get(cyu.dialogTitle).should('contain.text', 'New collection');
      cy.get(cyu.dialogBody).should('be.visible').find('input.theia-input[type=text]').should('contain.value', 'untitled').type('test_col');
      cy.get(cyu.dialogMainButton).should('be.visible').click();
      cy.get(cyu.dialog).should('not.be.visible');
      cyu.getTreeNode('admin@http://localhost:8080/db/test_col').should('be.visible');
    })
    it('create text file', function () {
      cyu.getTreeNode('admin@http://localhost:8080/db/test_col').click().rightclick()
      cyu.getSubMenu('New document...').should('be.visible').trigger('mousemove')
      cyu.getMenuCommand('fusion.new-document').should('be.visible').click()
      cy.get(cyu.dialogTitle).should('contain.text', 'New document');
      cy.get(cyu.dialogBody).should('be.visible').find('input.theia-input[type=text]').should('contain.value', 'untitled').type('text_file.txt');
      cy.get(cyu.dialogMainButton).should('be.visible').click();
      cy.get(cyu.dialog).should('not.be.visible');
      cyu.getTreeNode('admin@http://localhost:8080/db/test_col/text_file.txt').should('be.visible');
      cy.get('.p-Widget.p-TabBar li[title=' + CSS.escape('admin@http://localhost:8080/db/test_col/text_file.txt') + ']')
      .should('be.visible').click()
      .should('have.class', 'p-mod-current');
      cy.get('[role=presentation].editor-scrollable').click().type('Sample text file content');
      cy.get('#theia-top-panel .p-MenuBar-item').contains('File').click()
      cy.get('.p-Menu-item[data-type=command][data-command=core\\.save]').click()
    })
  })
})
