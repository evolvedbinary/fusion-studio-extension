/// <reference types="Cypress" />
context('Fusion Studio', () => {
    describe('Connection Dialogue', () => {
        after(() => {
            // cleanup connections after test            
            cy.clearLocalStorage('connections')
            cy.reload()    
        })

        it('should create a connection', () => {
            cy.visit('/')
            cy.get('#theia-top-panel .p-MenuBar-item').contains('File')
                .click()
                .then(() => {
                    cy.get('[data-command="fusion.connect"] > .p-Menu-itemLabel')
                        .contains('New Server.')
                        .click()
                    // set connection credentials
                    cy.get('div.name-field > input').clear().type('server1')
                    cy.get('div.server-field > input').clear().type(Cypress.env('API_HOST'))
                    cy.get('div.username-field > input').clear().type('admin')
                    cy.get('div.password-field > input').clear()
                    cy.get('.main').click()
                })
            // see it in action
            cy.get('.ReactVirtualized__Grid')
                .should('be.visible')
                .should('contain', 'server1')
            cy.get('.fusion-item')
                .click()
                .then(() => {
                    cy.get('.ReactVirtualized__Grid__innerScrollContainer')
                        .should('contain', 'db')
                        .should('contain', 'RestXQ')
                })
        })

        it('should fail gracefully', () => {
            // Use a differet route
            cy.get('#fusion-toolbar-button-add > .fa-fw')
                .click()
                .then(() => {
                    // bad credentials
                    cy.get('div.name-field > input').clear().type('server2')
                    cy.get('div.server-field > input').clear().type(Cypress.env('API_HOST'))
                    cy.get('div.username-field > input').clear().type('badmin')
                    cy.get('.main').click()
                })

            // see it in action
            cy.get('.ReactVirtualized__Grid')
                .should('be.visible')
                .should('contain', 'server2')
            cy.get(`[node-id=${CSS.escape('badmin@' + Cypress.env('API_HOST'))}]`)
                .click()
                .then(() => {
                    cy.get('.dialogContent')
                        // TODO(DP): #408 this needs a meaningful error message
                        .contains('error')
                        cy.get('.dialogControl > .theia-button').click()
                })
        })

        it('should remove bad connection', () => {
            cy.get(`[node-id=${CSS.escape('badmin@' + Cypress.env('API_HOST'))}]`)
                .rightclick()
                .then(() => {
                    cy.get('[data-command="fusion.disconnect"] > .p-Menu-itemLabel')
                        .click()
                    cy.get('.dialogContent')
                      .contains('you sure') 
                    cy.get('.main').click()
                })
            cy.get('.ReactVirtualized__Grid')
                .should('be.visible')
                .should('not.contain', 'server2')    
        })
    })


})