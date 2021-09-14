/// <reference types="Cypress" />

context('Talking to the api directly', () => {
  describe('API version', () => {
    before(function () {
      cy.connect()
      cy.visit('/')
    })
    describe('With outdated API', () => {
      it('should fail to connect with older api', () => {
        cy.intercept('GET', Cypress.env('API_HOST') + '/exist/restxq/fusiondb/version', { fixture: 'bad_api' })
        cy.get('.fusion-item').click().then(() => {
          cy.get('.dialogTitle').should('contain.text', 'New Connection')
          cy.get('.dialogContent').should('be.visible')
            .should('contain.text', 'Outdated API "0.0.1"')
            .should('contain.text', 'You need to update your API to version "0.2.0" or higher')
          cy.get('.theia-button.main').should('be.visible').click()
          cy.get('.dialogBlock').should('not.exist')
        })
      })
    })
    describe('With current API', () => {
      it('should reach all api endpoints', () => {
        cy.window().then(function (win) {
          const fetchSpy = cy.spy(win, 'fetch')
          fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/version').as('/version')
          fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/explorer?uri=/').as('/explorer')
          fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/user').as('/user')
          fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/group').as('/group')
          fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/index').as('/index')
          // See #508
          // fetchSpy.withArgs(Cypress.env('API_HOST') + '/exist/restxq/fusiondb/restxq').as('/restxq')
          cy.get('.fusion-item').click()
          cy.get('@/version').should('be.called')
          cy.get('@/explorer').should('be.called')
          cy.get('@/user').should('be.called')
          cy.get('@/group').should('be.called')
          cy.get('@/index').should('be.called')
          // See #508
          // cy.get('@/restxq').should('be.called')
        })
      })

      // (DP) we might want to merge the three cases again at a future time
      it('should display db tree item', () => {
        cy.contains('localhost').click()
        cy.get('.fusion-view')
          .should('contain', 'db')
          // .should('contain', 'Security')
          // .should('contain', 'RestXQ')          
      })

      it('should display security tree item', () => {
        cy.contains('localhost')
        cy.get('.fusion-view')
          .should('contain', 'Security')      
      })

      // see #508
      it.skip('should display restxq tree item', () => {
        cy.contains('localhost')
        cy.get('.fusion-view')
          .should('contain', 'RestXQ')          
      })
    })
  })
})
