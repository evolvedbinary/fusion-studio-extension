export function treenode(id) {
  return '[id=' + CSS.escape(id) + ']';
}
Cypress.Commands.add('waitForLoading', (options) => cy.wait(50).get('.fs-icon.fa-spinner', options).should('not.exist').wait(50));
Cypress.Commands.add('getMenuCommand', (command, options) => cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=command][data-command=' + CSS.escape(command) + ']', options).should('not.have.class', 'p-mod-disabled'));
Cypress.Commands.add('getSubMenu', (text, options) => cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=submenu]', options).should('contain.text', text).should('not.have.class', 'p-mod-disabled'));
Cypress.Commands.add('getTreeNode', (id, options) => cy.get(treenode(id), options));
Cypress.Commands.add('addConnection', (name = 'localhost', server = 'http://localhost:8080', username = 'admin', password = '') => {
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
  cy.getMenuCommand('fusion.new-collection').should('be.visible').click()
  cy.get(dialogTitle).should('contain.text', 'New collection');
  cy.get(dialogBody).should('be.visible').find('input.theia-input[type=text]').should('contain.value', 'untitled').type(name);
  cy.get(dialogMainButton).should('be.visible').click();
  cy.get(dialog).should('not.be.visible');
  cy.getTreeNode(id + '/' + name).should('be.visible');
});

export const dialogOverlay = '.p-Widget.dialogOverlay#theia-dialog-shell';
export const dialog = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock';
export const dialogTitle = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogTitle';
export const dialogBody = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogContent';
export const dialogFooter = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl';
export const dialogButtons = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button';
export const dialogMainButton = '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button.main';