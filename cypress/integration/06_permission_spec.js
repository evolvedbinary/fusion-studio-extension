/// <reference types="Cypress" />
context('Permission Manager', () => {
  describe('working with security item', () => {
    before(() => {
      cy.connect()
      cy.visit('/')
      cy.get(`[node-id=${CSS.escape('admin@' + Cypress.env('API_HOST'))}]`)
        .click()
    })

    // (DP)) we need frequent assertions to work around the fact that the tree collapes on new requests
    // see #513 #397
    it('should have user entries', () => {
      cy.get('[node-id$=security]')
        .should('be.visible')
        .click()
        .then(() => {
          cy.get('[node-id$=security\\/user]')
            .should('be.visible')
            .click()
            .then(() => {
              cy.get(`[node-id=${CSS.escape('admin@' + Cypress.env('API_HOST'))}]`)
                .should('be.visible')
                .click()
              cy.get('[node-id$=user\\/guest]')
                .should('be.visible')
            })
        })
    })

    it('should have group entries', () => {
      cy.get('.ReactVirtualized__Grid')
        .contains('Groups')
        .click()
      cy.get('[node-id$=group\\/guest]')
        .should('be.visible')
    })

    // TODO(DP): note how the tree expansion for groups and users is memorized we need to clean that up
    describe('the user item', () => {
      it('should let us create a new user', () => {
        cy.get('[node-id$=security]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.add-user"]')
          .contains('Add')
          .should('be.visible')
          .click()
        cy.get(':nth-child(1) > .theia-input')
          .type('cy-usr', { force: true })
        // TODO(DP): better selector see #411
        cy.get(':nth-child(2) > :nth-child(1) > .checkbox > .checkbox-box')
          .click()
        cy.get('.pb-headers > :nth-child(2)')
          .click()
        // s.a. #411
        cy.get('.awesomplete > .theia-input')
          .type('guest{enter}')
        cy.get('.main')
          .click()
        cy.get('[node-id$=user\\/cy-usr]')
          .should('be.visible')
      })

      it('should display user properties card', () => {
        cy.get('[node-id$=user\\/guest]')
          .should('be.visible')
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

      it('should let us delete a user', () => {
        cy.get('[node-id$=user\\/cy-usr]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.delete-user"]')
          .click()
        cy.get('.dialogContent')
          .contains('Are you sure')
        cy.get('.main')
          .click()
        cy.get('[node-id$=user\\/cy-usr]')
          .should('not.exist')
      })
    })

    describe('the groups item', () => {
      it('should let us create a new group', () => {
        cy.get('[node-id$=security]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.add-group"]')
          .contains('Add')
          .should('be.visible')
          .click()
          .focused()
          .type('cy-group{enter}', { force: true })
        cy.get('[node-id$=group\\/cy-group]')
          .should('be.visible')
      })

      it('should display group properties card', () => {
        cy.get('[node-id$=group\\/guest]')
          .should('be.visible')
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

      it('should let us delete a group', () => {
        cy.get('[node-id$=group\\/cy-group]')
          .should('be.visible')
          .rightclick()
        cy.get('[data-command="fusion.delete-group"]')
          .click()
        cy.get('.dialogContent')
          .contains('Are you sure')
        cy.get('.main')
          .click()
        cy.get('[node-id$=user\\/cy-group]')
          .should('not.exist')
      })
    })
  })
})