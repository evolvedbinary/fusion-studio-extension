/// <reference types="Cypress" />

context('Document Operations', () => {
  describe('working with tree view', () => {
    before(() => {
      cy.connect()
      cy.visit('/')
      cy.get(`[node-id=${CSS.escape('admin@' + Cypress.env('API_HOST'))}]`)
        .should('be.visible')
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
      it('should create documents', () => {
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
        // (DP) untitled-1 document has been created
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
        // (DP) cleanup welcome tab so we don't have to deal with it in later tests
        cy.get('#shell-tab-fusion-welcome > .p-TabBar-tabCloseIcon')
          .click()
        cy.get('#shell-tab-fusion-welcome')
          .should('not.exist')


        // TODO(DP):
        // - add test for #413 : remove workaround
        // - check if tree view is deselected (it is but need not be), 
        // - check if Explorer is updated properly (seems inconsistent need to double click)
        // - check if editor window is opening the newly create doc in a new tab (it doesn't)
        // - two file create routes one with follow-up dialog (xquery lib) one without (txt, xml)
      })

      // see https://github.com/cypress-io/cypress/pull/15388/files#
      // see #414

      it('should edit document contents', () => {
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
        // (DP): see #525 close edited editor pane
        cy.get('#theia-main-content-panel > .p-TabBar > .p-TabBar-content-container > .p-TabBar-content')
          .within(() => {
            cy.get('.p-TabBar-tabCloseIcon')
              .click({ multiple: true })
          })
        cy.get('.main')
          .click()
        cy.get('.view-lines')
          .should('not.exist')
        cy.get('[node-id$=untitled-1]')
          .should('exist')
        cy.get('[node-id$=untitled-2]')
          .should('not.exist')
      })

      // (DP): Fix #527 then finish this
      it.skip('should load previously stored document', () => {
        cy.get('.fusion-item')
          .should('be.visible')
        cy.get('[node-id$=untitled-1]')
          .dblclick()
        cy.get('.view-lines')
          .should('exist')
          .contains('asdf')
        cy.get('#theia-main-content-panel > .p-TabBar > .p-TabBar-content-container > .p-TabBar-content')
          .within(() => {
            cy.get('.p-TabBar-tabCloseIcon')
              .click({ multiple: true })
          })
        cy.get('.main')
          .click()
        cy.get('[node-id$=untitled-1]')
          .should('exist')
        cy.get('[node-id$=untitled-2]')
          .should('not.exist')
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
        cy.get('[node-id$=untitled-1]')
          .should('exist')
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
              .type('untitled-1{enter}')
            cy.get('.error')
              .should('exist')
              .should('contain.text', 'Item already exists')
              .type('{esc}')
            cy.get('[node-id$=untitled-1]')
              .should('exist')
          })
      })

      it('should delete documents', () => {
        cy.get('[node-id$=untitled-1]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
        cy.get('.main')
          .click()
        cy.get('[node-id$=db]')
          .should('be.visible')
        cy.get('[node-id$=untitled-1]')
          .should('not.exist')
      })

      // see #414 workaround is to run this after editing and saving the document, 
      // we should be able to rename before editing content
      it.skip('should let users rename documents', () => {
        cy.get('.fusion-item')
          .should('exist')
        // (DP) rename untitled-1 -> test.xml
        cy.get('[node-id$=untitled-1]')
          .should('be.visible')
          // (DP) press F2 not working see #526
          // .trigger('keydown', { keyCode: 112, which: 112 })
          // .trigger('keyup', { keyCode: 112, which: 112 })
          // (DP) see #522
          .rightclick({ force: true })
        cy.get('[data-command="fusion.rename"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
          .focused()
          .clear()
          .type('test.txt{enter}', { force: true })
        // (DP): see #414 here the funkyness starts instead of having renamed the first file upon hitting {enter}
        // - we now have 2 files in the db tree untitled-1 and test.txt, there should only be 1 => test.txt
        // - test.txt isn't really renamed as its contents are empty, it should have the contents previously stored as untitled-1
        // - uncomment the following to test any potential fixes
        // cy.get('[node-id$=untitled-1]')
        //   .should('not.exist')

        // (DP): failed workaround which needs to include a subworkaround but ultimately fails due to #527
        // cy.get('.ReactVirtualized__Grid')
        //   .then(() => {
        //     cy.get('[node-id$=test\\.txt]')
        //       .dblclick()
        //   })
        // if (Cypress.platform === 'darwin') {
        //   cy.get('.view-line')
        //     .type('fdsa{meta+s}')
        // } else {
        //   cy.get('.view-line')
        //     .type('fdsa{ctrl+s}')
        // }
        // // (DP): subworkaround #525 close edited editor pane
        // cy.get('#theia-main-content-panel > .p-TabBar > .p-TabBar-content-container > .p-TabBar-content')
        //   .within(() => {
        //     cy.get('.p-TabBar-tabCloseIcon')
        //       .click({ multiple: true })
        //   })
        // cy.get('.main')
        //   .click()
        // (DP): end workarounds #414 #525 #527

        // (DP): if #414 is fixed the below needs to be activated
        // cy.get('[node-id$=test\\.txt]')
        //   .should('be.visible')
      })

      it.skip('should not create duplicate documents', () => {
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

      it.skip('should delete documents', () => {
        cy.get('[node-id$=test\\.txt]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
          .should('be.visible')
          .click()
        cy.get('.main')
          .click()
        cy.get('[node-id$=db]')
          .should('be.visible')
        cy.get('[node-id$=test\\.txt]')
          .should('not.exist')
      })
    })
  })
})