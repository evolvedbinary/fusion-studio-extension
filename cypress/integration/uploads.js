import { mkApiPathUrl, fsUrl } from '../support/config.js';
import { dialogMainButton } from '../support/utils.js';
context('Fusion Studio', function () {
  before(function () {
    cy.visit(fsUrl)
      .get('#theia-top-panel', { timeout: 30000 })
      .should('be.visible')
      .get('.theia-preload').should('not.exist');
    cy.addConnection();
    cy.waitForLoading();
    cy.getTreeNode(mkApiPathUrl('admin', '/db')).click();
    // cy.addCollection(mkApiPathUrl('admin', '/db'), 'uploads');
    cy.waitForLoading();
    cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads')).click();
  });
  describe('Uploading', function () {
    it('One document', function () {
      cy.dragFileTo(mkApiPathUrl('admin', '/db/uploads'), 'test.txt');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads/test.txt')).should('be.visible').contains('test.txt');
      
      cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads/test.txt')).dblclick();
      cy.waitForLoading();
      cy.get('.p-Widget.p-TabBar li[title*=' + CSS.escape('/db/uploads/test.txt') + ']').click();
      cy.get('[role=presentation].editor-scrollable').contains('Test text file.');
    });
    it('Multiple documents', function () {
      cy.dragFileTo(mkApiPathUrl('admin', '/db/uploads'), {
        'test2.txt': 'test.txt',
        'test.xml': 'test.xml',
      });
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads/test2.txt')).should('be.visible').contains('test2.txt');
      
      cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads/test2.txt')).dblclick();
      cy.waitForLoading();
      cy.get('.p-Widget.p-TabBar li[title*=' + CSS.escape('/db/uploads/test2.txt') + ']').click();
      cy.get('[role=presentation].editor-scrollable').contains('Test text file.');
      
      cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads/test.xml')).should('be.visible').contains('test.xml');

      cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads/test.xml')).dblclick();
      cy.waitForLoading();
      cy.get('.p-Widget.p-TabBar li[title*=' + CSS.escape('/db/uploads/test.xml') + ']').click();
      cy.get('.p-Widget.theia-editor.p-DockPanel-widget:not(.p-mod-hidden) [role=presentation].editor-scrollable').then(el => {
        cy.get(el).contains('<file>');
        cy.get(el).contains('<name>test.xml</name>');
        cy.get(el).contains('<modified>23 Mar 17 22:20</modified>');
        cy.get(el).contains('<owner>root</owner>');
        cy.get(el).contains('</file>');
      });
    });
    // cy.getTreeNode(mkApiPathUrl('admin', '/db/uploads')).rightclick();
    // cy.getMenuCommand('fusion.delete').should('be.visible').click();
    // cy.get(dialogMainButton).should('be.visible').click();
    // cy.waitForLoading();
  });
});
