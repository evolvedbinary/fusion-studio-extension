/// <reference types="Cypress" />
function utils(cy) {
  return {
    treenode: id => '[id=' + CSS.escape(id) + ']',
    getTreeNode(id, options) {
      return cy.get(this.treenode(id), options);
    },
    dialogOverlay: '.p-Widget.dialogOverlay#theia-dialog-shell',
    dialog: '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock',
    dialogTitle: '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogTitle',
    dialogBody: '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogContent',
    dialogFooter: '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl',
    dialogButtons: '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button',
    dialogMainButton: '.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button.main',
    getMenuCommand: (command, options) => cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=command][data-command=' + CSS.escape(command) + ']', options),
    getSubMenu: (text, options) => cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=submenu]', options).should('contain.text', text),
    addConnection(name = 'localhost', server = 'http://localhost:8080', username = 'admin', password = '') {
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
      // open connection
      cy.get('.main').click()
      // see it in action
      cy.get('.ReactVirtualized__Grid')
      .should('be.visible')
      .should('contain', 'localhost')
      this.getTreeNode(username + '@' + server).click()
      this.getTreeNode(username + '@' + server + '/db').should('be.visible')
    },
    addCollection(id, name) {
      this.getTreeNode(id).rightclick()
      this.getMenuCommand('fusion.new-collection').should('be.visible').click()
      cy.get(this.dialogTitle).should('contain.text', 'New collection');
      cy.get(this.dialogBody).should('be.visible').find('input.theia-input[type=text]').should('contain.value', 'untitled').type(name);
      cy.get(this.dialogMainButton).should('be.visible').click();
      cy.get(this.dialog).should('not.be.visible');
      this.getTreeNode(id + '/' + name).should('be.visible');
    }
  };
}
export default utils;