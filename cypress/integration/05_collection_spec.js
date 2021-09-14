/// <reference types="Cypress" />

context.skip('Collection Operations', () => {
  let fetchSpy;
  describe('working with tree view', () => {
    before(() => {
      cy.connect()
      cy.visit('/');
    })
    beforeEach(() => {
      cy.window().then(win => fetchSpy = cy.spy(win, 'fetch').as('fetch'));
    })

    describe('db context menu', () => {
      it('should display creation options', () => {
        cy.get('.fusion-view')
          .should('be.visible')
        cy.get('.fusion-item')
          .click()
        //  all we need is the final part of the node-id attribute
        // (DP): start workaround for #413
        cy.get('[node-id$=db]')
          .click()
        cy.get('.fa-spinner')
          .should('not.exist')
        // (DP): end workaround for #413
        cy.get('@fetch').should('be.calledWith', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/explorer?uri=/db');
        cy.get('[node-id$=db]')
          .rightclick();
        cy.get('.p-Menu')
          .should('be.visible')
          .find('[data-command="fusion.new-collection"]')
          .should('be.visible')
          .contains('New collection')
          .click()
        cy.focused()
          .type('{enter}')
        cy.get('.fusion-view')
          .contains('untitled-1')
        cy.get('@fetch').should('be.calledWithMatch', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/collection?uri=/db/untitled-1', { method: 'PUT' });
      })

      it('should let users rename collection', () => {
        cy.get('[node-id$=untitled-1]')
          .rightclick()
        cy.get('[data-command="fusion.rename"]')
          .should('be.visible')
          .contains('Rename')
          .click()
        cy.focused()
          .type('test_col{enter}')
        cy.get('@fetch').should('be.calledWithMatch', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/collection?uri=/db/test_col', {
          method: 'PUT',
          headers: { 'x-fs-move-source': '/db/untitled-1' },
        });
        cy.get('.fusion-view')
          .contains('test_col')
        cy.get('[node-id$=untitled-1]')
          .should('not.exist')
      })

      it('should display collection properties', () => {
        cy.get('[node-id$=test_col]')
          .click()
          .type('{alt+enter}', { force: true })
        cy.get('.dialogTitle')
          .should('contain.text', 'Properties')
        // rename file -> text.xml
        cy.get('.value > .theia-input')
          .should('have.value', 'test_col')
          .clear()
          .type('test_col2')
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
        cy.get('.main')
          .click()
        cy.get('.dialogBlock')
          .should('not.exist');
        cy.get('[node-id$=test_col2]')
          .should('exist')
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
            cy.focused()
              .clear()
              .type('test_col2{enter}')
            cy.get('.error')
              .should('exist')
              .should('contain.text', 'Item already exists')
          })
      })

      it('should create nested collection', () => {
        cy.get('[node-id$=test_col2]')
          .click()
          .rightclick()
        cy.get('.p-Menu')
          .should('be.visible')
          .contains('New collection')
        cy.get('[data-command="fusion.new-collection"]')
          .should('be.visible')
          .click()
        cy.focused()
          .clear()
          .type('test_colA{enter}')
        // TODO(DP): we migh want to check the proper nesting more explicitely,
        // but that is already covered by checking for this collection after deleting
        // its parent collection 
        cy.get('.fusion-view')
          .contains('test_colA')
      })


      it('should let users delete collection', () => {
        cy.get('[node-id$=test_col2]')
          .rightclick()
        cy.get('[data-command="fusion.delete"]')
          .should('be.visible')
          .contains('Delete')
          .click()
        cy.get('.main')
          .click()
        cy.get('@fetch').should('be.calledWithMatch', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/collection?uri=/db/test_col2', { method: 'DELETE' });
        // make sure all test files are gone see #400, including those produced by failed create commands
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
    })
  })
})