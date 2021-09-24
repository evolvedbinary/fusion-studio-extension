/// <reference types="Cypress" />

context('Collection Operations', () => {
  // let fetchSpy 
  describe('working with tree view', () => {
    before(() => {
      cy.connect()
      cy.visit('/')
      cy.get(`[node-id=${CSS.escape('admin@' + Cypress.env('API_HOST'))}]`)
        .should('be.visible')
    })
    // beforeEach(() => {
    //   cy.window().then(win => fetchSpy = cy.spy(win, 'fetch').as('fetch'));
    // })
    after(() => {
      // make sure all test collections are gone see #400
      cy.get('[node-id$=untitled-1]')
        .should('not.exist')
      cy.get('[node-id$=untitled-2]')
        .should('not.exist')
      cy.get('[node-id$=test_col]')
        .should('not.exist')
      cy.get('[node-id$=test_col1]')
        .should('not.exist')
      cy.get('[node-id$=test_col2]')
        .should('not.exist')
      cy.get('[node-id$=test_colA]')
        .should('not.exist')
    })

    describe('db context menu', () => {
      it('should create collections', () => {
        cy.get('.fusion-view')
          .should('be.visible')
        cy.get('.fusion-item')
          .should('be.visible')
          .click()
        //  all we need is the final part of the node-id attribute

        cy.get('[node-id$=db]')
          .should('be.visible')
          // .click()
          // cy.get('.fa-spinner')
          //   .should('not.exist')
          // cy.get('@fetch').should('be.calledWith', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/explorer?uri=/db');
          // cy.get('[node-id$=db]')
          .rightclick()
          .then(() => {
            cy.get('.p-Menu')
              .should('be.visible')
              .contains('New collection')
            cy.get('[data-command="fusion.new-collection"]')
              .should('be.visible')
              .click()
            // (DP) untitled-1 collection has been created…
            // … the tree however has collapsed and is hidding the currently active input prompt from the user
            // (DP): start workaround for #413
            cy.get('.fusion-item')
              .should('be.visible')
              .click()
            cy.get('[node-id$=db]')
              .should('be.visible')
              .focused()
              // end workaround for #413
              .type('{enter}')
          })
        cy.get('.fusion-view')
          .should('contain.text', 'untitled-1')
        cy.get('[node-id$=untitled-1]')
          .should('be.visible')
        cy.get('[node-id$=untitled-2]')
          .should('not.exist')

        // cy.get('@fetch').should('be.calledWithMatch', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/collection?uri=/db/untitled-1', { method: 'PUT' });
      })

      it('should display collection properties', () => {
        cy.get('[node-id$=untitled-1]')
          .click()
          .type('{alt+enter}', { force: true })
        cy.get('.dialogTitle')
          .should('contain.text', 'Properties')
        cy.get('.value > .theia-input')
          .should('have.value', 'untitled-1')
        // check properties table 
        cy.get('.dialogContent')
          .find('.keys > tr')
          .should('have.length', 7)
          .should('contain', 'Created')
          .should('contain', 'Owner')
          .should('contain', 'Group')
        // check permissions table  
        cy.get('.dialogContent')
          .find('.permissions-editor > tr')
          .should('have.length', 3)
          .should('contain', 'user')
          .should('contain', 'group')
          .should('contain', 'other')
        cy.get('.secondary')
          .click()
        cy.get('.dialogBlock')
          .should('not.exist');
        cy.get('[node-id$=test_col]')
          .should('not.exist')
      })

      it('should not create duplicate collection', () => {
        cy.get('[node-id$=db]')
          .rightclick()
          .then(() => {
            cy.get('.p-Menu')
              .should('be.visible')
              .contains('New collection')
              .trigger('mousemove')
            cy.get('[data-command="fusion.new-collection"]')
              .should('be.visible')
              .click()
              .focused()
              .clear()
              .type('untitled-1{enter}')
            cy.get('.error')
              .should('exist')
              .should('contain.text', 'Item already exists')
              .type('{esc}')
          })
      })

      it('should create nested collection', () => {
        cy.get('[node-id$=untitled-1]')
          .trigger('mousemove')
          .rightclick()
          .then(() => {
            cy.get('.p-Menu')
              .should('be.visible')
              .contains('New collection')
            cy.get('[data-command="fusion.new-collection"]')
              .should('be.visible')
              .click()
              .focused()
              .clear()
              .type('test_colA{enter}')
          })
        cy.get('.fusion-view')
          .contains('test_colA')
      })

      it('should rename collection', () => {
        cy.get('[node-id$=test_colA]')
          .rightclick()
          .then(() => {
            cy.get('[data-command="fusion.rename"]')
              .should('be.visible')
              .contains('Rename')
              .click()
              .focused()
              .clear()
              .type('test_col{enter}')
          })
        // cy.get('@fetch').should('be.calledWithMatch', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/collection?uri=/db/test_col', {
        //   method: 'PUT',
        //   headers: { 'x-fs-move-source': '/db/untitled-1' },
        // })
        cy.get('.fusion-view')
          .contains('test_col')
        cy.get('[node-id$=test_colA]')
          .should('not.exist')
      })

      it('should delete collection', () => {
        cy.get('[node-id$=untitled-1]')
          .rightclick()
        cy.get('[data-command="fusion.delete"]')
          .should('be.visible')
          .contains('Delete')
          .click()
        cy.get('.main')
          .click()
        // cy.get('@fetch').should('be.calledWithMatch', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/collection?uri=/db/test_col2', { method: 'DELETE' });
        // make sure collections are gone see #400, including those produced by failed create commands
        cy.get('[node-id$=untitled-1]')
          .should('not.exist')
        cy.get('[node-id$=test_col]')
          .should('not.exist')
      })
    })
  })
})