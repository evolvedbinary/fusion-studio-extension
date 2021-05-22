/// <reference types="Cypress" />
context('Basic Operations', () => {
    describe('working with tree view', () => {
        before(() => {
            cy.connect()
        })

        describe('db context menu', () => {
            it('should display creation options', () => {
                cy.visit('/')
                cy.get('.ReactVirtualized__Grid', {timeout: 55000})
                    .should('be.visible')
                cy.get('.fusion-item')
                    .click()
                //  all we need is the final part of the node-id attribute
                cy.get('[node-id$=db]')
                    .rightclick()
                    .then(() => {
                        cy.get('.p-Menu')
                            .should('be.visible')
                            .contains('New document')
                            .trigger('mousemove')
                        cy.get('[data-command="fusion.new-document"] > .p-Menu-itemLabel')
                            .should('be.visible')
                            .click()
                    })
                // (DP): start workaround for #413 
                cy.get('[node-id$=db]')
                  .trigger('mousemove')
                  .type('{enter}') 
                // end workaround for #413
                cy.get('.ReactVirtualized__Grid')
                  .contains('untitled-1')

                // TODO(DP):
                // - add test for #413 : change order, remove workaround, might need a call to focused()
                // - check if tree view is deselected (it is but need not be), 
                // - check if Explorer is updated properly (seems inconsistent need to double click)
                // - check if editor window is opening the newly create doc in a new tab (it doesn't)
                // - two file create routes one with follow-up dialog (xquery lib) one without (txt, xml)
            })

            // TODO(DP): make this work on all OS by either adjusting the key sequence ctrl+s cmd+s …
            // or by using the file menu UI instead
            // see #414
            it('should let users edit new document', () => {
                cy.get('[node-id$=untitled-1]')
                  .dblclick()
                cy.get('.view-line')
                  .type('asdf{meta+s}')  
            })    
            // see #414 workaround is to run this after editing and saving the document, 
            // we should be able to rename before entering content
            it('should let users rename documents', () => {
                cy.get('[node-id$=untitled-1]')
                  .rightclick()
                cy.get('[data-command="fusion.rename"] > .p-Menu-itemLabel')
                  .should('be.visible')
                  .click()
                  .focused()
                  .type('test.txt{enter}')  
            })

            // TODO(DP): documents properties test could go here
            // it('Document properties', function () {
            //   cy.waitForLoading();
            //   cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/text_file.txt')).rightclick()
            //     .getMenuCommand('fusion.properties').should('be.visible').click()
            //   cy.get(dialogTitle).should('contain.text', 'Properties');
            //   cy.get(dialogBody).should('be.visible').then(body => {
            //     cy.wrap(body).find('td.label').contains('Name')
            //       .find('+ td.value input.theia-input[type=text]').should('contain.value', 'text_file.txt');
            //     cy.wrap(body).find('td.label').contains('Collection')
            //       .find('+ td.value').should('contain.text', '/db/test_col');
            //     cy.wrap(body).find('td.label').contains('Created')
            //       .find('+ td.value').should('contain.text', Cypress.formatDate());
            //     cy.wrap(body).find('td.label').contains('Modified')
            //       .find('+ td.value').should('contain.text', Cypress.formatDate());
            //     cy.wrap(body).find('td.label').contains('Media Type')
            //       .find('+ td.value').should('contain.text', 'text/plain');
            //     cy.wrap(body).find('td.label').contains('Binary')
            //       .find('+ td.value').should('contain.text', 'Yes')
            //       .find('button.theia-button').should('contain.text', 'Convert to non-binary');
            //     cy.wrap(body).find('td.label').contains('Size')
            //       .find('+ td.value').should('contain.text', '24 B');
            //     cy.wrap(body).find('td.label').contains('Owner')
            //       .find('+ td.value input.theia-input[type=text]').should('contain.value', 'admin');
            //     cy.wrap(body).find('td.label').contains('Group')
            //       .find('+ td.value input.theia-input[type=text]').should('contain.value', 'dba');
            //     cy.wrap(body).find('table.permissions-editor tr').then(trs => {
            //       cy.wrap(trs).eq(0).find('td').then(tds => {
            //         cy.wrap(tds).eq(0).should('contain.text', 'user');
            //         cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            //         cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').checked();
            //         cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').notChecked();
            //         cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'setUID').notChecked();
            //       });
            //       cy.wrap(trs).eq(1).find('td').then(tds => {
            //         cy.wrap(tds).eq(0).should('contain.text', 'group');
            //         cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            //         cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').notChecked();
            //         cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').notChecked();
            //         cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'setGID').notChecked();
            //       });
            //       cy.wrap(trs).eq(2).find('td').then(tds => {
            //         cy.wrap(tds).eq(0).should('contain.text', 'other');
            //         cy.wrap(tds).eq(1).findCheckbox().should('contain.text', 'read').checked();
            //         cy.wrap(tds).eq(2).findCheckbox().should('contain.text', 'write').notChecked();
            //         cy.wrap(tds).eq(3).findCheckbox().should('contain.text', 'execute').notChecked();
            //         cy.wrap(tds).eq(4).findCheckbox().should('contain.text', 'sticky').notChecked();
            //       });
            //     });
            //   });
            //   cy.get(dialogSecondaryButton).should('be.visible').click();
            //   cy.get(dialog).should('not.exist');
            //   cy.getTreeNode(mkApiPathUrl('admin', '/db/test_col/xml_file.xml')).rightclick()
            //     .getMenuCommand('fusion.properties').should('be.visible').click()
            //   cy.get(dialogBody).should('be.visible').find('td.label').contains('Binary')
            //     .find('+ td.value').should('contain.text', 'No')
            //     .find('button.theia-button').should('contain.text', 'Convert to binary');
            //   cy.get(dialogSecondaryButton).should('be.visible').click();
            //   cy.get(dialog).should('not.exist');
            // })
            // TODO(DP): only allow unique document creation test should go here

            it('should let users delete documents', () => {
                cy.get('[node-id$=test\\.txt]')
                  .rightclick()
                cy.get('[data-command="fusion.delete"] > .p-Menu-itemLabel')
                  .should('be.visible')
                  .click()
                cy.get('.main')
                  .click()
                cy.get('[node-id$=test\\.txt]')
                  .should('not.exist')
            })
        })
    })
})