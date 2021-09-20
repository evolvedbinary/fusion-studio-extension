/// <reference types="Cypress" />

context.only('Document Operations', () => {
  describe('working with tree view', () => {
    before(() => {
      cy.connect()
      cy.visit('/')
      cy.get(`[node-id=${CSS.escape('admin@' + Cypress.env('API_HOST'))}]`)
        .should('be.visible')
      // TODO(DP): might have to improve by adding more before / after hooks to prevent dangling documents
      // see #400
    })

    describe('db context menu', () => {
      it('should display creation options', () => {

        cy.get('.ReactVirtualized__Grid')
          .should('be.visible')
        cy.get('.fusion-item')
          .should('be.visible')
          .click()
        //  all we need is the final part of the node-id attribute
        cy.get('[node-id$=db]')
          .should('be.visible')
          .rightclick()
          .then(() => {
            cy.get('.p-Menu')
              .should('be.visible')
              .contains('New document')
              .trigger('mousemove')
            cy.get('[data-command="fusion.new-document"] > .p-Menu-itemLabel')
              .should('be.visible')
              .click()            
          })
        // (DP): start workaround for #413
        cy.get('.fusion-item')
          .should('be.visible')
          .click()
        cy.get('[node-id$=db]')
          .should('be.visible')
          .focused()
          .type('{enter}')
        // end workaround for #413
        cy.get('.ReactVirtualized__Grid')
          .should('be.visible')
          .contains('untitled-1')

        // TODO(DP):
        // - add test for #413 : change order, remove workaround, might need a call to focused()
        // - check if tree view is deselected (it is but need not be), 
        // - check if Explorer is updated properly (seems inconsistent need to double click)
        // - check if editor window is opening the newly create doc in a new tab (it doesn't)
        // - two file create routes one with follow-up dialog (xquery lib) one without (txt, xml)
      })

      // see https://github.com/cypress-io/cypress/pull/15388/files#
      // see #414

      it('should let users edit new document', () => {
        cy.get('[node-id$=untitled-1]')
          .dblclick()
        if (Cypress.platform === 'darwin') {
          cy.get('.view-line')
            .type('asdf{meta+s}')
        } else {
          cy.get('.view-line')
            .type('asdf{ctrl+s}')
        }
      })
      // see #414 workaround is to run this after editing and saving the document, 
      // we should be able to rename before entering content
      it('should let users rename documents', () => {
        cy.get('[node-id$=untitled-1]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.rename"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
          .focused()
          .type('test.txt{enter}')
      })

      it('should display document properties', () => {
        cy.get('[node-id$=test\\.txt]')
          .should('be.visible')
          // .focused()
          .type('{alt+enter}', { force: true })
        cy.get('.dialogTitle')
          .should('contain.text', 'Properties')
        // rename file -> text.xml
        cy.get('.value > .theia-input')
          .clear()
          .type('test.xml')
        // check properties table 
        // TODO (DP) # 519 flaky test, properties table changes based on filetype
        //  hence only check visibility. 
        cy.get('.dialogContent')
          .find('.keys > tr')
          // .should('have.length', 11)
          .should('be.visible')
          // .contains('Media Type')
        cy.get('.dialogContent')
          .find('.keys > tr')
          .contains('Owner')
        // check permissions table  
        cy.get('.dialogContent')
          .find('.permissions-editor > tr')
          .should('have.length', 3)
          .contains('user')
        cy.get('.main')
          .click()
      })

      it('should not create duplicate documents', () => {
        cy.get('[node-id$=db]')
          .should('be.visible')
          .rightclick()
          .then(() => {
            cy.get('.p-Menu')
              .should('be.visible')
              .contains('New document')
              .trigger('mousemove')
            cy.get('[data-command="fusion.new-document-template:xml"] > .p-Menu-itemLabel')
              .should('be.visible')
              .click()
            cy.get('.fs-inline-input > .theia-input')
              .clear()
              .type('test.xml{enter}')
            cy.get('.error')
              .should('exist')
              .should('contain.text', 'Item already exists')
          })
      })

      it('should let users delete documents', () => {
        cy.get('[node-id$=test\\.xml]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
        cy.get('.main')
          .click()
        // make sure all test files are gone see #400
        cy.get('[node-id$=untitled-1]')
          .should('not.exist')
        cy.get('[node-id$=test\\.txt]')
          .should('not.exist')
        cy.get('[node-id$=test\\.xml]')
          .should('not.exist')
        cy.get('[node-id$=untitled-2]')
          .should('not.exist')
      })
    })
  })
})