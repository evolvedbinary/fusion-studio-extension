/// <reference types="Cypress" />
context('Fusion Studio', function() {
  beforeEach('IDE', function(){
    cy.visit('/')
      .get('#theia-top-panel', {timeout: 60000})
      .should('be.visible')
      .get('.theia-preload').should('not.exist');
  })

  describe('Evaluation panel', function() {
    it('show evaluation panel', function(){
      // invoke command panel and run the command
      cy.get('body').trigger('keydown', { keyCode: 112, which: 112 })
        .trigger('keyup', { keyCode: 112, which: 112 });
      cy.get('.quick-open-overlay .quick-open-input input')
        .clear()
        .type('>Toggle Evaluation View{enter}');
      // check the panel
      cy.get('#shell-tab-fusion-eval').should('contain', 'Evaluation');
      cy.get('#fusion-eval').should('be.visible');
      cy.get('#fusion-eval > div.x-header > span.x-document').should('contain', 'Open a document to evaluate.');
      cy.get('#fusion-eval > div.x-header > span.x-document + span.x-separator + span').should('contain', 'Serialization Type:');
      cy.get('#fusion-eval > div.x-header > select').should('be.disabled')
      .should('contain.text', 'Adaptive')
      .should('contain.text', 'XML')
      .should('contain.text', 'JSON')
      .should('contain.text', 'Text');
      cy.get('#fusion-eval > div.x-header > button').should('be.disabled').should('contain', 'Evaluate');
      cy.get('#fusion-eval > div.x-body').should('be.empty');
      cy.get('#fusion-eval > div.x-footer > button').should('be.disabled').should('contain', 'New file');
      // invoke command panel and run the command again
      cy.get('body').trigger('keydown', { keyCode: 112, which: 112 })
      .trigger('keyup', { keyCode: 112, which: 112 });
      cy.get('.quick-open-overlay .quick-open-input input')
        .clear()
        .type('>Toggle Evaluation View{enter}');
      // check the panel
      cy.get('#shell-tab-fusion-eval').should('not.be.visible');
      cy.get('#fusion-eval').should('not.be.visible');
    })
  })
})
