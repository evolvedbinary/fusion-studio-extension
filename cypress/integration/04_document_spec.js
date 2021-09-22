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

    after(() => {
      // make sure all test files are gone see #400
      cy.get('[node-id$=db]')
        .should('be.visible')
      cy.get('[node-id$=untitled-1]')
        .should('not.exist')
      cy.get('[node-id$=test\\.txt]')
        .should('not.exist')
      cy.get('[node-id$=test\\.xml]')
        .should('not.exist')
      cy.get('[node-id$=untitled-2]')
        .should('not.exist')
    })

    describe('db context menu', () => {
      it('should display creation options', () => {
        cy.get('.ReactVirtualized__Grid')
          .should('be.visible')
        cy.get('.fusion-item')
          .should('be.visible')
          .click({ animationDistanceThreshold: 2 })
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
        // (DP) untitled-1 has been created
        // (DP): start workaround for #413
        cy.get('.fusion-item')
          .should('be.visible')
          .click({ animationDistanceThreshold: 2 })
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

      it('should let users edit document contents', () => {
        cy.get('.fusion-item')
          .should('be.visible')
        // (DP) edit and save untitled-1
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

      // (DP): TODO
      it.skip('should not loose edits on closing', () => {
        cy.get('.fusion-item')
          .should('be.visible')
      })

      it('should display document properties', () => {
        cy.get('[node-id$=untitled-1]')
          .should('be.visible')
          .type('{alt+enter}', { force: true })
        cy.get('.dialogTitle')
          .should('contain.text', 'Properties')
        // check properties table 
        // TODO (DP) # 519 flaky test, properties table changes based on filetype
        //  hence only check visibility. 
        cy.get('.dialogContent')
          .find('.keys > tr')
          // .should('have.length', 11)
          // .should('contain.text', 'Media Type')
          .should('be.visible')
        cy.get('.dialogContent')
          .find('.keys > tr')
          .should('contain.text', 'Owner')
        // check permissions table  
        cy.get('.dialogContent')
          .find('.permissions-editor > tr')
          .should('have.length', 3)
          .should('contain.text', 'user')
        cy.get('.secondary')
          .click()
      })

      // see #414 workaround is to run this after editing and saving the document, 
      // we should be able to rename before editing content
      it('should let users rename documents', () => {
        cy.get('.fusion-item')
          .should('exist')
        // (DP) rename untitled-1 -> test.txt
        cy.get('[node-id$=untitled-1]')
          .should('be.visible')
          // (DP) press F2 not working
          // .trigger('keydown', { keyCode: 112, which: 112 })
          // .trigger('keyup', { keyCode: 112, which: 112 })
          // (DP) see #522
          .rightclick({ force: true })
          // (DP) note to self: the problem is that the editor window remains open from previous runs, 
          // so there is untitled-1 there after the rename, we need to close it, without interferring with the 
          // logic of the first run, or just declare this test green because yolo
        cy.get('[data-command="fusion.rename"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
          .focused()
          .type('test.txt{enter}', { force: true })
        cy.get('[node-id$=test\\.txt]')
          .should('be.visible')
        // DP see #414 activate to confirm fix 
        // cy.get('[node-id$=untitled-1]')
        // .should('not.exist')  
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
            cy.get('[data-command="fusion.new-document"] > .p-Menu-itemLabel')
              .should('be.visible')
              .click()
            cy.get('.fs-inline-input > .theia-input')
              .clear()
              .type('test.txt{enter}')
            cy.get('.error')
              .should('exist')
              .should('contain.text', 'Item already exists')
            // DP see #414 activate to confirm fix    
            // cy.get('[node-id$=untitled-1]')
            // .should('not.exist')
          })
      })

      it('should let users delete documents', () => {
        cy.get('[node-id$=test\\.txt]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
        cy.get('.main')
          .click()
        // make sure all test files are gone see #400
        cy.get('[node-id$=db]')
          .should('be.visible')
        cy.get('[node-id$=test\\.txt]')
          .should('not.exist')
      })
    })
  })
})