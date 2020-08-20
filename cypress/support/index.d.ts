/// <reference types="cypress" />

declare namespace Cypress {
  interface Cypress {
    formatDate(date?: Date): string;
  }
  interface Chainable<Subject> {
    getMenuCommand(command: string, options: any): Chainable<any>;
    getSubMenu(text: string, options: any): Chainable<any>;
    getTreeNode(id: string, options: any): Chainable<any>;
    getTreeNode(id: string, options: any): Chainable<any>;
    addConnection(name?: string, server?: string, username?: string, password?: string): Chainable<any>;
    addCollection(id: string, name: string): Chainable<any>;
    getDialogOverlay(): Chainable<any>;
    getDialog(): Chainable<any>;
    getDialogTitle(): Chainable<any>;
    getDialogBody(): Chainable<any>;
    getDialogFooter(): Chainable<any>;
    getDialogButtons(): Chainable<any>;
    getDialogMainButton(): Chainable<any>;
    addDocument(collection: string, name: string, type?: string): Chainable<any>;
  }
}