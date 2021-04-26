/// <reference types="Cypress" />
import { mkApiPathUrl, apiHost, apiPort } from '../support/config.js';
import '@4tw/cypress-drag-drop'
import { dialogTitle, dialogBody, dialogMainButton, dialogSecondaryButton, dialog } from '../support/utils';
context('Properties dialog', function () {
  afterEach(function () {
    if (this.currentTest.state === 'failed') {
      Cypress.runner.stop()
    }
  });
  after(function () {
    cy.waitForLoading();
    cy.getTreeNode(mkApiPathUrl('admin', '/db/new_test_col')).rightclick();
    cy.getMenuCommand('fusion.delete').click()
    cy.get(dialogMainButton).click();
  });
  before(function () {
    cy.visit('/')
      .get('#theia-top-panel', { timeout: 30000 })
      .should('be.visible')
      .get('.theia-preload').should('not.exist');
    cy.addConnection();
    cy.waitForLoading();
    cy.getTreeNode(mkApiPathUrl('admin', '/db')).click();
    cy.addCollection(mkApiPathUrl('admin', '/db'), 'test_col');
    cy.waitForLoading();
    cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).click();
    cy.addDocument(mkApiPathUrl('admin', '/db/test_col'), 'text_file.txt')
    cy.addDocument(mkApiPathUrl('admin', '/db/test_col'), 'xml_file.xml', 'xml')
  })
  describe('Correct information', function () {
    it('Document properties', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/text_file.txt')).rightclick()
        .getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Properties');
      cy.get(dialogBody).should('be.visible').then(body => {
        cy.wrap(body).find('td.label').contains('Name')
          .find('+ td.value input.theia-input[type=text]').should('contain.value', 'text_file.txt');
        cy.wrap(body).find('td.label').contains('Collection')
          .find('+ td.value').should('contain.text', '/db/test_col');
        cy.wrap(body).find('td.label').contains('Created')
          .find('+ td.value').should('contain.text', Cypress.formatDate());
        cy.wrap(body).find('td.label').contains('Modified')
          .find('+ td.value').should('contain.text', Cypress.formatDate());
        cy.wrap(body).find('td.label').contains('Media Type')
          .find('+ td.value').should('contain.text', 'text/plain');
        cy.wrap(body).find('td.label').contains('Binary')
          .find('+ td.value').should('contain.text', 'Yes')
          .find('button.theia-button').should('contain.text', 'Convert to non-binary');
        cy.wrap(body).find('td.label').contains('Size')
          .find('+ td.value').should('contain.text', '24 B');
        cy.wrap(body).find('td.label').contains('Owner')
          .find('+ td.value input.theia-input[type=text]').should('contain.value', 'admin');
        cy.wrap(body).find('td.label').contains('Group')
          .find('+ td.value input.theia-input[type=text]').should('contain.value', 'dba');
        cy.wrap(body).find('table.permissions-editor tr').then(trs => {
          cy.wrap(trs).eq(0).find('td').then(tds => {
            cy.wrap(tds).eq(0).should('contain.text', 'user');
            cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').checked();
            cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').notChecked();
            cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'setUID').notChecked();
          });
          cy.wrap(trs).eq(1).find('td').then(tds => {
            cy.wrap(tds).eq(0).should('contain.text', 'group');
            cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').notChecked();
            cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').notChecked();
            cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'setGID').notChecked();
          });
          cy.wrap(trs).eq(2).find('td').then(tds => {
            cy.wrap(tds).eq(0).should('contain.text', 'other');
            cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').notChecked();
            cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').notChecked();
            cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'sticky').notChecked();
          });
        });
      });
      cy.get(dialogSecondaryButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/xml_file.xml')).rightclick()
        .getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogBody).should('be.visible').find('td.label').contains('Binary')
        .find('+ td.value').should('contain.text', 'No')
        .find('button.theia-button').should('contain.text', 'Convert to binary');
      cy.get(dialogSecondaryButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
    })
    it('Collection properties', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).rightclick()
        .getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Properties');
      cy.get(dialogBody).should('be.visible').then(body => {
        cy.wrap(body).find('td.label').contains('Name')
          .find('+ td.value input.theia-input[type=text]').should('contain.value', 'test_col');
        cy.wrap(body).find('td.label').contains('Collection')
          .find('+ td.value').should('contain.text', '/db');
        cy.wrap(body).find('td.label').contains('Created')
          .find('+ td.value').should('contain.text', Cypress.formatDate());
        cy.wrap(body).find('td.label').contains('Owner')
          .find('+ td.value input.theia-input[type=text]').should('contain.value', 'admin');
        cy.wrap(body).find('td.label').contains('Group')
          .find('+ td.value input.theia-input[type=text]').should('contain.value', 'dba');
        cy.wrap(body).find('table.permissions-editor tr').then(trs => {
          cy.wrap(trs).eq(0).find('td').then(tds => {
            cy.wrap(tds).eq(0).should('contain.text', 'user');
            cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').checked();
            cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').checked();
            cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'setUID').notChecked();
          });
          cy.wrap(trs).eq(1).find('td').then(tds => {
            cy.wrap(tds).eq(0).should('contain.text', 'group');
            cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').notChecked();
            cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').checked();
            cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'setGID').notChecked();
          });
          cy.wrap(trs).eq(2).find('td').then(tds => {
            cy.wrap(tds).eq(0).should('contain.text', 'other');
            cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').notChecked();
            cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').checked();
            cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'sticky').notChecked();
          });
        });
        cy.get(dialogSecondaryButton).should('be.visible').click();
        cy.get(dialog).should('not.exist');
        cy.getTreeNode(mkApiPathUrl('admin', '/db')).rightclick()
          .getMenuCommand('fusion.properties').should('be.visible').click()
        cy.get(dialogBody).should('be.visible').find('td.label').should('not.contain.text', 'Collection');
        cy.get(dialogSecondaryButton).should('be.visible').click();
        cy.get(dialog).should('not.exist');
      });
    })
    it('Connection properties', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin')).rightclick()
        .getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Edit Connection');
      cy.get(dialogBody).should('be.visible').then(body => {
        cy.wrap(body).find('.vertical-form .name-field span').contains('Connection Name:')
          .find('+ input.theia-input[type=text]').should('have.value', 'locahost');
          cy.wrap(body).find('.vertical-form .server-field span').contains('Server URI:')
          .find('+ input.theia-input[type=text]').should('have.value', apiHost +  apiPort);
          cy.wrap(body).find('.vertical-form .username-field span').contains('Username:')
          .find('+ input.theia-input[type=text]').should('have.value', 'admin');
        cy.wrap(body).find('.vertical-form .password-field span').contains('Password')
          .find('+ input.theia-input[type=password]').should('have.value', '');
        cy.get(dialogSecondaryButton).should('be.visible').click();
        cy.get(dialog).should('not.exist');
      });
    })
  })
  describe('Renaming objects', function () {
    it('Rename a connection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin')).rightclick()
      .getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Edit Connection');
      cy.get(dialogBody).should('be.visible').then(body => {
        cy.wrap(body).find('.vertical-form .name-field span').contains('Connection Name:')
        .find('+ input.theia-input[type=text]').should('have.value', apiHost).clear().type('new_name');
        cy.get(dialogMainButton).should('be.visible').click();
        cy.get(dialog).should('not.exist');
      });
      cy.getTreeNode(mkApiPathUrl('admin')).should('be.visible').contains('new_name');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db')).click();
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).click();
    })
    it('rename a document', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/text_file.txt')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Properties');
      cy.get(dialogBody).should('be.visible')
        .find('td.label').contains('Name')
        .find('+ td.value input.theia-input[type=text]').should('contain.value', 'text_file.txt').type('new_name.txt');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/text_file.txt')).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/new_name.txt')).should('be.visible');
    })
    it('rename a collection', function () {
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).should('be.visible').rightclick();
      cy.getMenuCommand('fusion.properties').should('be.visible').click()
      cy.get(dialogTitle).should('contain.text', 'Properties');
      cy.get(dialogBody).should('be.visible')
        .find('td.label').contains('Name')
        .find('+ td.value input.theia-input[type=text]').should('contain.value', 'test_col').type('new_test_col');
      cy.get(dialogMainButton).should('be.visible').click();
      cy.get(dialog).should('not.exist');
      cy.waitForLoading();
      cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col')).should('not.exist');
      cy.getTreeNode(mkApiPathUrl('admin', '/db/new_test_col')).should('be.visible');
    })
  })
})
