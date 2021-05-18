/// <reference types="Cypress" />

context('Fusion Studio', function () {
    describe('API version', function () {
        it('should connect with newer api', function () {
            cy.visit('/')
            // TODO: Why does this have  UUID is the ID stable, this needs a meaningful selector
              .get('#d184cace-9938-4ad5-b8df-925a91942661')
              .should('be.visible')
        })

    })
})