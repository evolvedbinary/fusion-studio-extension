/// <reference types="Cypress" />
context('Connecting to Servers', () => {
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


        // TODO(DP): add Connection properties test here
        // it('Connection properties', function () {
        //     cy.waitForLoading();
        //     cy.getTreeNode(mkApiPathUrl('admin')).rightclick()
        //       .getMenuCommand('fusion.properties').should('be.visible').click()
        //     cy.get(dialogTitle).should('contain.text', 'Edit Connection');
        //     cy.get(dialogBody).should('be.visible').then(body => {
        //       cy.wrap(body).find('.vertical-form .name-field span').contains('Connection Name:')
        //         .find('+ input.theia-input[type=text]').should('have.value', 'localhost');
        //         cy.wrap(body).find('.vertical-form .server-field span').contains('Server URI:')
        //         .find('+ input.theia-input[type=text]').should('have.value', apiHost +  apiPort);
        //         cy.wrap(body).find('.vertical-form .username-field span').contains('Username:')
        //         .find('+ input.theia-input[type=text]').should('have.value', 'admin');
        //       cy.wrap(body).find('.vertical-form .password-field span').contains('Password')
        //         .find('+ input.theia-input[type=password]').should('have.value', '');
        //       cy.get(dialogSecondaryButton).should('be.visible').click();
        //       cy.get(dialog).should('not.exist');
        //     });
        //   })

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