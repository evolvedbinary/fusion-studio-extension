/// <reference types="Cypress" />
context('Basic Operations', () => {
    describe('working with tree view', () => {
        before(() => {
            cy.connect()
        })

        describe('db context menu', () => {
            // TODO #413
            it('should display creation options', () => {
                cy.visit('/')
                cy.get('.ReactVirtualized__Grid')
                    .should('be.visible')
                cy.get('.fusion-item')
                    .click()
                //  all we need is the final part of the node-id attribute
                cy.get('[node-id$=db]')
                    .rightclick()
                    // TODO(DP): see if not using then allows for better flow
                    .then(() => {
                        cy.get('.p-Menu')
                            .should('be.visible')
                            .contains('New document')
                            .trigger('mousemove')
                        cy.get('[data-command="fusion.new-document"] > .p-Menu-itemLabel')
                            .should('be.visible')
                            .click()
                    })
                // TODO(DP):
                // - add test for #413, 
                // - check if tree view is deselected, 
                // - check if Explorer is updated properly, 
                // - check if editor window is opening the newly create doc in a new tab
                // - two routes one with follow-up dialog (xquery lib) one without (txt, xml)
            })

                // Get rid of this:
                // cy.addDocument(mkApiPathUrl('admin', '/db/test_col'), 'text_file.txt');

            it.skip('should let users create documents', () => {
                cy.get('[node-id$=db]')
                    .click()
                    .type('{enter}')
                    .contains('untitled')
            })
        })
    })

    describe('working with collections', () => {
        it.skip('should create a connection', () => {
            cy.visit('/')
            // see it in action
            cy.get('.ReactVirtualized__Grid')
                .should('be.visible')
                .should('contain', 'localhost')
            cy.get('.fusion-item')
                .click()
                .then(() => {
                    cy.get('.ReactVirtualized__Grid__innerScrollContainer')
                        .should('contain', 'db')
                        .should('contain', 'RestXQ')
                })
        })

    })


})