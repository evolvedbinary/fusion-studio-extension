/// <reference types="Cypress" />
context('Fusion Studio', function() {
  beforeEach('IDE', function(){
    cy.visit('http://localhost:3000')
      .get('#theia-top-panel', {timeout: 12000})
      .should('be.visible')
  })

  describe('Connections', function() {
    it('create a new connection', function(){
      // trigger new connection dialog
      cy.get(':nth-child(1) > .p-MenuBar-itemLabel')
        .click()
        .then(() => {
          cy.get('[data-command="fusion.connect"] > .p-Menu-itemLabel')
            .contains('New Server.')
            .trigger('mousemove')
            .click()
        })
      // accept default credentials
      cy.get('.main').click()
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
    it('fails gracefully', function(){
      // trigger new connection dialog
      cy.get(':nth-child(1) > .p-MenuBar-itemLabel')
        .click()
        .then(() => {
          cy.get('[data-command="fusion.connect"] > .p-Menu-itemLabel')
            .contains('New Server.')
            .trigger('mousemove')
            .click()
        })
      // bad credentials
      cy.get('.password-field > input')
        .type('123456')
      cy.get('.main').click()
      // see it in action
      cy.get('.ReactVirtualized__Grid')
        .should('be.visible')
        .should('contain', 'localhost')
      cy.get('.fusion-item')
        .click()
        .then(() => {
          cy.get('.ReactVirtualized__Grid__innerScrollContainer')
            .should('not.contain', 'db')
            .should('not.contain', 'RestXQ')
        })
    })
  })
})
