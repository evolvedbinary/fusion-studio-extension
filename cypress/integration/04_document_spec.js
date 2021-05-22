/// <reference types="Cypress" />
context('Basic Operations', () => {
    describe('working with tree view', () => {
        before(() => {
            cy.connect()
        })

        describe('db context menu', () => {
            it('should display creation options', () => {
                cy.visit('/')
                cy.get('.ReactVirtualized__Grid', {timeout: 55000})
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

            // TODO(DP): documents properties test could go here

            // TODO(DP): only allow unique file creation test should go here

            it('should let users delete documents', () => {
                cy.get('[node-id$=test\\.txt]')
                  .rightclick()
                cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
                  .should('be.visible')
                  .click()
                cy.get('.main')
                  .click()
                cy.get('[node-id$=test\\.txt]')
                  .should('not.exist')
            })
        })
    })
})