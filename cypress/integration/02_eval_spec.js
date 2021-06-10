/// <reference types="Cypress" />
context.skip('Evaluation', () => {
  before(() => {
    cy.visit('/')
      .get('#theia-top-panel')
      .should('be.visible')
      .get('.theia-preload').should('not.exist')
  })

  describe('The Theia Panel', () => {
    it('should be accessible from command panel', () => {
      // invoke command panel and run the command
      cy.get('body').trigger('keydown', { keyCode: 112, which: 112 })
        .trigger('keyup', { keyCode: 112, which: 112 })
      cy.get('.quick-open-overlay .quick-open-input input')
        .clear()
        .type('>Toggle Evaluation View{enter}')
      // check the panel
      cy.get('.x-body')
        .should('be.visible')
      cy.get('#shell-tab-fusion-eval')
        .should('contain', 'Evaluation')
      cy.get('#fusion-eval')
        .should('be.visible')
    })

    it('should offer serialization selections', () => {
      cy.get('.x-header > span.x-document')
        .should('contain', 'Open a document to evaluate.')
      cy.get('.x-header > span.x-document + span.x-separator + span')
        .should('contain', 'Serialization Type:')
      cy.get('.x-header > select')
        .should('be.disabled')
        .should('contain.text', 'Adaptive')
        .should('contain.text', 'XML')
        .should('contain.text', 'JSON')
        .should('contain.text', 'Text')
    })

    // TODO see #401 
    it.skip('should let users do stuff', () => {
      cy.get('.x-footer > :nth-child(4)')
        .contains('file')
        .click()
    })
    
    it('should have proper header and footer', () => {
      cy.get('.x-header > button')
        .should('be.disabled')
        .should('contain', 'Evaluate')
      cy.get('.x-body')
        .should('be.empty')
      cy.get('.x-footer > button')
        .should('be.disabled')
        .should('contain', 'New file')
    })
    
    it('should disappear again', () => {
      // invoke command panel and run the command again
      cy.get('body')
        .trigger('keydown', { keyCode: 112, which: 112 })
        .trigger('keyup', { keyCode: 112, which: 112 })
      cy.get('.quick-open-overlay .quick-open-input input')
        .clear()
        .type('>Toggle Evaluation View{enter}')
      // check the panel
      cy.get('#shell-tab-fusion-eval')
        .should('not.be.visible')
      cy.get('#fusion-eval')
        .should('not.be.visible')
    })
  })
})
