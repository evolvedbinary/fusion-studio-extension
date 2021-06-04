/// <reference types="Cypress" />
context('Permission Manager', () => {
    describe('working with tree view', () => {
      before(() => {
        cy.connect()
        cy.visit('/')
        cy.get(`[node-id=${CSS.escape('admin@' + Cypress.env('API_HOST'))}]`)
          .click()
      })    
  
      // TODO(DP): note how the tree expansion for groups and users is memorized we need to clean that up
  
      describe('the security item', () => {
        it('should have user entries', () => {
          cy.get('[node-id$=security]')
            .click()
          cy.get('.ReactVirtualized__Grid')
            .contains('Users')
            .click()
          cy.get('[node-id$=guest]')
            .should('be.visible')
        })
  
        it('should let us create a new user', () => {
          cy.get('[node-id$=security]')
            .rightclick()
            cy.get('[data-command="fusion.add-user"]')
            .contains('Add')
            .should('be.visible')
          // TODO(DP): finish creating a test user
        })
  
        it('should display user properties card', () => {
          cy.get('[node-id$=user\\/guest]')
            .rightclick()
          cy.get('.p-Menu > ul > .p-Menu-item')
            .should('be.visible')
            .should('have.length', 2)
          cy.get('[data-command="fusion.edit-user"]')
            .click()
          cy.get('.dialogTitle')
            .contains('guest')
          cy.get('.pb-headers > a')
            .should('have.length', 3)
          cy.get('.dialogContent')
            .contains('Username')
          cy.get('.pb-headers > a:nth-child(2)')
            .click()
          cy.get('.dialogContent')
            .contains('Primary group')
          cy.get('.pb-headers > a:nth-child(3)')
            .click()
          cy.get('.active > .pb-tab > .keys > tr')
            .should('have.length', 9)     
          cy.get('.secondary')
            .click()
        })
  
        it.skip('should let us delete a user', () => {
          cy.get('.ReactVirtualized__Grid')
            .contains('Users')
            .click()
          cy.get('[node-id$=use\\/guest]')
            .should('be.visible')
        })
  
      })
  
      describe('the groups item', () => {
        it('should have group entries', () => {
          cy.get('.ReactVirtualized__Grid')
            .contains('Groups')
            .click()
          cy.get('[node-id$=group\\/guest]')
            .should('be.visible')
        })
  
        it('should let us create a new group', () => {
          cy.get('[node-id$=security]')
            .rightclick()
            cy.get('[data-command="fusion.add-group"]')
            .contains('Add')
            .should('be.visible')
          // TODO(DP): finish creating a test group  
        })
  
        it('should display group properties card', () => {
          cy.get('[node-id$=group\\/guest]')
            .rightclick()
          cy.get('.p-Menu > ul > .p-Menu-item')
            .should('be.visible')
            .should('have.length', 2)
          cy.get('[data-command="fusion.edit-group"]')
            .click()
          cy.get('.dialogTitle')
            .contains('guest')
          cy.get('.pb-headers > a')
            .should('have.length', 2)
          cy.get('.dialogContent')
            .contains('Group name')
          cy.get('.pb-headers > a:nth-child(2)')
            .click()
          cy.get('.active > .pb-tab > .keys > tr')
            .should('have.length', 3)     
          cy.get('.secondary')
            .click()    
        })
  
        it.skip('should let us delete a group', () => {
          cy.get('.ReactVirtualized__Grid')
            .contains('Users')
            .click()
          cy.get('[node-id$=use\\/guest]')
            .should('be.visible')
        })
      })
  
    })
  })