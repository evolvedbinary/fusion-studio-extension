/// <reference types="Cypress" />

context('Talking to the api directly', () => {
    describe('API version', () => {
        it('should connect with newer api', () => {
            cy.visit('/')
            // TODO: Why does this have  UUID is the ID stable, this needs a meaningful selector
              .get('#d184cace-9938-4ad5-b8df-925a91942661')
              .should('be.visible')
        })

    })
})