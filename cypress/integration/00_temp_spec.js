/// <reference types="Cypress" />
context('Fusion Studio', () => {
    describe('Connection Dialogue', () => {
        before(() => {
            cy.connect() 
        })

        it('should create a connection', () => {
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