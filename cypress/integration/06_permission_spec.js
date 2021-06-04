/// <reference types="Cypress" />

context('Permission Manager', () => {
    describe('working with tree view', () => {
        before(() => {
            cy.connect()
        })

        describe('db context menu', () => {
            it('display users and groups', function () {
                // expand users and groups
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security]').should('be.visible').click();
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security\\/user]').should('be.visible');
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security\\/group]').should('be.visible');
                // expand and check users
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security\\/user]').click();
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item .fa-user.fs-icon + [node-id*=security\\/user\\/]').should('have.length.gt', 0);
                // expand and check groups
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security\\/group]').click();
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item .fa-users.fs-icon + [node-id*=security\\/group\\/]').should('have.length.gt', 0);
            })
            it('open user information', function () {
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security\\/user]').should('be.visible');
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item .fa-user.fs-icon + [node-id*=security\\/user\\/]').should('have.length.gt', 0);
                const firstUser = cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item .fa-user.fs-icon + [node-id*=security\\/user\\/]').first();
                firstUser.then(user => {
                    const userName = user.text();
                    firstUser.rightclick();
                    cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=command][data-command=fusion\\.edit-user]').should('be.visible').click();
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogTitle').should('contain.text', 'Edit User: ' + userName);
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogContent .pb-body').should('be.visible').find('span + input.theia-input[type=text]').should('have.value', userName);
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button.secondary').should('be.visible').click();
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell').should('not.exist');
                });
            })
            it('open group information', function () {
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item [node-id$=security\\/group]').should('be.visible');
                cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item .fa-users.fs-icon + [node-id*=security\\/group\\/]').should('have.length.gt', 0);
                const firstGroup = cy.get('.p-Widget.theia-Tree .theia-TreeNode.fusion-item .fa-users.fs-icon + [node-id*=security\\/group\\/]').first();
                firstGroup.then(group => {
                    const groupName = group.text();
                    firstGroup.rightclick();
                    cy.get('.p-Widget.p-Menu .p-Menu-item[data-type=command][data-command=fusion\\.edit-group]').should('be.visible').click();
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogTitle').should('contain.text', 'Edit Group: ' + groupName);
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogContent .pb-body').should('be.visible').find('span + input.theia-input[type=text]').should('have.value', groupName);
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell .dialogBlock .dialogControl .theia-button.secondary').should('be.visible').click();
                    cy.get('.p-Widget.dialogOverlay#theia-dialog-shell').should('not.exist');
                });
            })
        })
    })
})