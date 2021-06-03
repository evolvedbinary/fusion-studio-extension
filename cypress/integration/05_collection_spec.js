/// <reference types="Cypress" />

context('Collection Operations', () => {
    describe('working with tree view', () => {
        before(() => {
            cy.connect()
        })

        describe('db context menu', () => {
            it('should display creation options', () => {
                cy.visit('/')
                cy.get('.ReactVirtualized__Grid')
                    .should('be.visible')
                cy.get('.fusion-item')
                    .click()
                //  all we need is the final part of the node-id attribute
                cy.get('[node-id$=db]')
                    .rightclick()
                    .then(() => {
                        cy.get('.p-Menu')
                            .should('be.visible')
                            .contains('New collection')
                            .trigger('mousemove')
                        cy.get('[data-command="fusion.new-collection"] > .p-Menu-itemLabel')
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
            })

            it('should let users rename collection', () => {
                cy.get('[node-id$=untitled-1]')
                    .rightclick()
                cy.get('[data-command="fusion.rename"] > .p-Menu-itemLabel')
                    .should('be.visible')
                    .click()
                    .focused()
                    .type('test_col{enter}')
            })

            it('should display collection properties', () => {
                cy.get('[node-id$=test_col]')
                    .rightclick()
                    .type('{alt+enter}', { force: true })
                cy.get('.dialogTitle')
                    .should('contain.text', 'Properties')
                // rename file -> text.xml
                cy.get('.value > .theia-input')
                    .clear()
                    .type('test_col2')
                // check properties table 
                cy.get('.dialogContent')
                    .find('.keys > tr')
                    .should('have.length', 7)
                    .contains('Created')
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

            it('should not create duplicate collection', () => {
                cy.get('[node-id$=db]')
                    .rightclick()
                    .then(() => {
                        cy.get('.p-Menu')
                            .should('be.visible')
                            .contains('New collection')
                            .trigger('mousemove')
                        cy.get('[data-command="fusion.new-collection"] > .p-Menu-itemLabel')
                            .should('be.visible')
                            .click()
                        cy.get('.fs-inline-input > .theia-input')
                            .clear()
                            .type('test_col2{enter}')
                        cy.get('.error')
                            .should('exist')
                            .should('contain.text', 'Item already exists')
                    })
            })

            it('should create nested collection', () => {
                cy.get('[node-id$=test_col2]')
                    .rightclick()
                    .then(() => {
                        cy.get('.p-Menu')
                            .should('be.visible')
                            .contains('New collection')
                            .trigger('mousemove')
                        cy.get('[data-command="fusion.new-collection"] > .p-Menu-itemLabel')
                            .should('be.visible')
                            .click()
                        cy.get('.fs-inline-input > .theia-input')
                            .clear()
                            .type('test_colA{enter}')
                            // TODO(DP): we migh want to check the proper nesting more explicitely,
                            // but that is already covered by checking for this collection after deleting
                            // its parent collection 
                        cy.get('.ReactVirtualized__Grid')
                            .contains('test_colA')
                    })
            })


            it('should let users delete collection', () => {
                cy.get('[node-id$=test_col2]')
                    .rightclick()
                cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
                    .should('be.visible')
                    .click()
                cy.get('.main')
                    .click()
                // make sure all test files are gone see #400
                cy.get('[node-id$=untitled-1]')
                    .should('not.exist')
                cy.get('[node-id$=untitled-2]')
                    .should('not.exist')
                cy.get('[node-id$=test_col]')
                    .should('not.exist')
                cy.get('[node-id$=test_col1]')
                    .should('not.exist')
                cy.get('[node-id$=test_col2]')
                    .should('not.exist')
                cy.get('[node-id$=test_colA]')
                    .should('not.exist')    
            })
        })
    })
})