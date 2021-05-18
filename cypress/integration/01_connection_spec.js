/// <reference types="Cypress" />
context('Fusion Studio', function () {
    describe('Connection Dialog', function () {
        it('should accept user input', function () {
            cy.visit('/')
            cy.get('#theia-top-panel .p-MenuBar-item').contains('File')
                .click()
                .then(() => {
                    cy.get('[data-command="fusion.connect"] > .p-Menu-itemLabel')
                        .contains('New Server.')
                        .trigger('mousemove')
                        .click()
                    // set connection credentials
            cy.get('div.name-field > input').clear().type('localhost')
            cy.get('div.server-field > input').clear().type('http://localhost:8080')
            cy.get('div.username-field > input').clear().type('admin')
            cy.get('div.password-field > input').clear()
            cy.get('.main').click()
                })
            // set connection credentials
            // cy.get('div.name-field > input').clear().type('localhost')
            // cy.get('div.server-field > input').clear().type('http://localhost:8080')
            // cy.get('div.username-field > input').clear().type('admin')
            // const passwordField = cy.get('div.password-field > input').clear();
            // // if (password) {
            // //     passwordField.type(password);
            // // }
            // cy.get(dialogMainButton).click();
            // cy.getTreeNode('admin' + '@' + 'http://localhost:8080').click();
            // cy.waitForLoading();
        });
    })
})