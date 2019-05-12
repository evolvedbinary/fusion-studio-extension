/// <reference types="Cypress" />
describe('Connection to server', function() {
  it('should load', function(){
    cy.visit('http://localhost:3000')
    cy.get(':nth-child(1) > .p-MenuBar-itemLabel')
      .click()
  })

  describe('Create Connection', function() {
    // WIP
  })
})
