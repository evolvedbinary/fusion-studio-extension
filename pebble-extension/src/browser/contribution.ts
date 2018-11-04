import { injectable, inject } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService } from "@theia/core/lib/common";
import { CommonMenus, open, OpenerService } from "@theia/core/lib/browser";
// import { WorkspaceService } from "@theia/workspace/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { PEBBLE_RESOURCE_SCHEME } from "./resource";

export const ExCommand = {
    id: 'Ex.command',
    label: "Shows a message"
};

@injectable()
export class ExCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        // @inject(SidePanelHandler) private readonly test: SidePanelHandler,
        @inject(OpenerService) private readonly os: OpenerService,
        // @inject(WorkspaceService) private readonly ws: WorkspaceService,
    ) {}

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ExCommand, {
            execute: () => {
                this.messageService.info('Hello World! 4')
                // console.log(this.tree);
                open(this.os, new URI(PEBBLE_RESOURCE_SCHEME + ':///C:/Users/dc/w/tests/ex/ex/src/browser/test.xml'));
            }
        });
    }
}

@injectable()
export class ExMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: ExCommand.id,
            label: 'Say Hello'
        });
    }
}