/// <reference types="Cypress" />

context('Document Operations', () => {
  describe('working with tree view', () => {
    before(() => {
      cy.connect()
      // TODO(DP): might have to improve by adding more before / after hooks to prevent dangling documents
      // see #400
    })

    describe('db context menu', () => {
      it('should display creation options', () => {
        cy.visit('/')
        cy.get('.ReactVirtualized__Grid', { timeout: 55000 })
          .should('be.visible')
        cy.get('.fusion-item')
          .click()
        //  all we need is the final part of the node-id attribute
        cy.get('[node-id$=db]')
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
        cy.get('[node-id$=db]')
          .trigger('mousemove')
          .type('{enter}')
        // end workaround for #413
        cy.get('.ReactVirtualized__Grid')
          .contains('untitled-1')

        // TODO(DP):
        // - add test for #413 : change order, remove workaround, might need a call to focused()
        // - check if tree view is deselected (it is but need not be), 
        // - check if Explorer is updated properly (seems inconsistent need to double click)
        // - check if editor window is opening the newly create doc in a new tab (it doesn't)
        // - two file create routes one with follow-up dialog (xquery lib) one without (txt, xml)
      })

      // TODO(DP): make this work on all OS by either adjusting the key sequence ctrl+s cmd+s …
      // or by using the file menu UI instead
      // see #414
      it('should let users edit new document', () => {
        cy.get('[node-id$=untitled-1]')
          .dblclick()
        cy.get('.view-line')
          .type('asdf{meta+s}')
      })
      // see #414 workaround is to run this after editing and saving the document, 
      // we should be able to rename before entering content
      it('should let users rename documents', () => {
        cy.get('[node-id$=untitled-1]')
          .rightclick()
        cy.get('[data-command="fusion.rename"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
          .focused()
          .type('test.txt{enter}')
      })

      it('should display document properties', () => {
        cy.get('[node-id$=test\\.txt]')
          .rightclick()
          .type('{alt+enter}', { force: true })
        cy.get('.dialogTitle')
          .should('contain.text', 'Properties')
        // rename file -> text.xml
        cy.get('.value > .theia-input')
          .clear()
          .type('test.xml')
        // check properties table 
        cy.get('.dialogContent')
          .find('.keys > tr')
          .should('have.length', 11)
          .contains('Media Type')
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