/**
 * Generated using theia-extension-generator
 */

import { ResourceResolver } from "@theia/core/lib/common";

import { ContainerModule, interfaces } from "inversify";
import { PebbleResourceResolver } from '../browser/resource';
import { PebbleViewWidgetFactory, PebbleViewWidget } from './widget/main';
import { createTreeContainer, TreeProps, defaultTreeProps, TreeWidget, WidgetFactory, bindViewContribution, FrontendApplicationContribution, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { PebbleViewService } from './view-service';

import '../../src/browser/style/index.css';
import { PebbleContribution } from "./contribution";
import { PebbleCore } from "./core";
import { CONTEXT_MENU } from "./commands";
import { DragController } from "./widget/drag";
import { PebbleFiles, pebbleFilesePath } from "../classes/files";
import { LanguageGrammarDefinitionContribution } from "@theia/monaco/lib/browser/textmate";
import { XQueryGrammaribution } from "./language-contribution";

export default new ContainerModule(bind => {

  bind(PebbleFiles).toDynamicValue(ctx => {
    const provider = ctx.container.get(WebSocketConnectionProvider);
    return provider.createProxy<PebbleFiles>(pebbleFilesePath);
  }).inSingletonScope();

  bind(PebbleViewWidgetFactory).toFactory(ctx =>
    () => createPebbleViewWidget(ctx.container)
  );

  bind(PebbleViewService).toSelf().inSingletonScope();
  bind(WidgetFactory).toDynamicValue(context => context.container.get(PebbleViewService));

  bindViewContribution(bind, PebbleContribution);
  bind(FrontendApplicationContribution).toService(PebbleContribution);

  bind(PebbleCore).toSelf().inSingletonScope();
  bind(DragController).toSelf().inSingletonScope();
  
  bind(PebbleResourceResolver).toSelf().inSingletonScope();
  bind(ResourceResolver).toService(PebbleResourceResolver);
  bind(LanguageGrammarDefinitionContribution).to(XQueryGrammaribution).inSingletonScope();
  
});

const TREE_PROPS = {
  multiSelect: true,
  contextMenuPath: CONTEXT_MENU,
}

function createPebbleViewWidget(parent: interfaces.Container): PebbleViewWidget {
  const child = createTreeContainer(parent);

  child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, ...TREE_PROPS });

  child.unbind(TreeWidget);
  child.bind(PebbleViewWidget).toSelf();

  return child.get(PebbleViewWidget);
}