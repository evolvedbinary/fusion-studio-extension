import { apiHost, apiPort } from '../support/config.js';

export function treenode(id) {
  return '[node-id=' + CSS.escape(id) + ']';
}
export function checkbox() {
  return 'span.checkbox';
}
Cypress.formatDate = (date) => {
  if (!date) {
    date = new Date();
  }
  var month = (date.getMonth() + 1).toString();
  var day = date.getDate().toString();
  if (month.length < 2) {
    month = '0' + month;
  }
  if (day.length < 2) {
    day = '0' + day;
  }
  return day + '-' + month + '-' + date.getUTCFullYear().toString()
}
Cypress.Commands.add('waitForLoading', (options) => cy.wait(50).get('.fs-icon.fa-spinner', { ...options, timeout: options?.timeout || 10000 }).should('not.exist').wait(50));
Cypress.Commands.add('getMenuCommand', (command, options) => cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=command][data-command=' + CSS.escape(command) + ']', options).should('exist').should('not.have.class', 'p-mod-disabled'));
Cypress.Commands.add('getSubMenu', (text, options) => cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=submenu]', options).should('contain.text', text).should('not.have.class', 'p-mod-disabled'));
Cypress.Commands.add('getTreeNode', (id, options) => cy.get(treenode(id), options));
Cypress.Commands.add('getCheckbox', (label, options) => {
  const result = cy.get(checkbox(label), options);
  return label ? result.contains(label) : result;
});
Cypress.Commands.add('findCheckbox', { prevSubject: true }, (subject, label, options) => {
  const result = cy.wrap(subject).find(checkbox(label), options);
  return label ? result.contains(label) : result;
});
Cypress.Commands.add('checked', { prevSubject: true }, subject => cy.wrap(subject).find('.checkbox-box').should('have.class', 'checked'));
Cypress.Commands.add('notChecked', { prevSubject: true }, subject => cy.wrap(subject).find('.checkbox-box').should('not.have.class', 'checked'));
Cypress.Commands.add('addConnection', (name = 'localhost', server = apiHost + apiPort, username = 'admin', password = '') => {
  cy.get('#theia-top-panel .p-MenuBar-item').contains('File')
    .click()
    .then(() => {
      cy.get('[data-command="fusion.connect"] > .p-Menu-itemLabel')
        .contains('New Server.')
        .trigger('mousemove')
        .click()
    })
  // set connection credentials
  cy.get('div.name-field > input').clear().type(name)
  cy.get('div.server-field > input').clear().type(server)
  cy.get('div.username-field > input').clear().type(username)
  const passwordField = cy.get('div.password-field > input').clear();
  if (password) {
    passwordField.type(password);
  }
  cy.get(dialogMainButton).click();
  cy.getTreeNode(username + '@' + server).click();
  cy.waitForLoading();
});
Cypress.Commands.add('addCollection', (id, name) => {
  cy.waitForLoading();
  cy.getTreeNode(id).rightclick()
  cy.getMenuCommand('fusion.new-collection').should('be.visible').click();
  cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'untitled').type(name + '{enter}');
  cy.get('.fs-inline-input').should('not.exist');
  cy.waitForLoading();
  cy.getTreeNode(id + '/' + name).should('be.visible');
});
Cypress.Commands.add('addDocument', (collection, name, type = '') => {
  cy.waitForLoading();
  const command = 'fusion.new-document' + (type ? '-template:' + type : '');
  cy.getTreeNode(collection).rightclick()
  cy.getSubMenu('New document...').trigger('mousemove').getMenuCommand(command).should('be.visible').click();
  cy.get('.fs-inline-input').should('exist').find('input.theia-input[type=text]').should('contain.value', 'untitled').clear().type(name + '{enter}');
  if (type === '') {
    cy.get('.p-Widget.p-TabBar li[title=' + CSS.escape(collection + '/' + name) + ']').click();
    cy.get('[role=presentation].editor-scrollable').click().type('Sample text file content');
  }
  cy.get('#theia-top-panel .p-MenuBar-item').contains('File').click()
  cy.get('.p-Menu-item[data-type=command][data-command=core\\.save]').click()
});

export const dialogOverlay = '.p-Widget.dialogOverlay#theia-dialog-shell';
export const dialog = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock';
export const dialogTitle = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogTitle';
export const dialogBody = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogContent';
export const dialogFooter = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl';
export const dialogButtons = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button';
export const dialogMainButton = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button.main';
export const dialogSecondaryButton = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button.secondary';
