/********************************************************************************
 * Copyright (C) 2019 Arm and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable } from 'inversify';
import { DidChangeLabelEvent, LabelProviderContribution } from '@theia/core/lib/browser/label-provider';
import { Emitter, Event } from '@theia/core';
import { FSCore } from './core';
import { inject } from "inversify";
import { FSNode } from '../classes';
import { TreeNode } from '@theia/core/lib/browser';

@injectable()
export class FSLabelProviderContribution implements LabelProviderContribution {

    constructor(
        @inject(FSCore) protected readonly core: FSCore,
    ) {
        core.setLabelProvider(this);
    }
    
    canHandle(element: object): number {
        if (TreeNode.is(element) && FSNode.is(element)) {
            return Number.MAX_SAFE_INTEGER;
        }
        return 0;
    }
    
    update(nodes: FSNode[]): void {
        this.fireLabelsDidChange(nodes);
    }

    private fireLabelsDidChange(nodes: FSNode[]): void {
        this.onDidChangeEmitter.fire({
            affects: (node: FSNode) => !!nodes.find(_node => _node.id === node.id),
        });
    }

    getIcon(node: FSNode): string {
        return this.core.getIcon(node);
    }

    protected readonly onDidChangeEmitter = new Emitter<DidChangeLabelEvent>();

    getName(node: FSNode): string | undefined {
        return node.nodeName;
    }

    getLongName(node: FSNode): string {
        return node.uri;
    }

    get onDidChange(): Event<DidChangeLabelEvent> {
        return this.onDidChangeEmitter.event;
    }

}
