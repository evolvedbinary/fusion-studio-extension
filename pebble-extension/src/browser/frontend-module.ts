/**
 * Generated using theia-extension-generator
 */

import { ResourceResolver } from "@theia/core/lib/common";

import { ContainerModule } from "inversify";
import { PebbleResourceResolver } from '../browser/resource';
import { PebbleViewWidgetFactory } from './widget/main';
import { PebbleEvalWidgetFactory } from "./widget/eval";
import { WidgetFactory, bindViewContribution, WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { PebbleViewService, createPebbleViewWidget } from './view-service';
import { createPebbleEvalWidget, PebbleEvalService } from "./eval-service";
import { PebbleContribution } from "./contribution";
import { PebbleEvalContribution } from "./eval-contribution";
import { PebbleCore } from "./core";
import { DragController } from "./widget/drag";
import { PebbleFiles, pebbleFilesePath } from "../classes/files";
import { LanguageGrammarDefinitionContribution } from "@theia/monaco/lib/browser/textmate";
import { XQueryGrammaribution } from "./language-contribution";

import '../../src/browser/style/index.css';

export default new ContainerModule(bind => {

  bind(PebbleFiles).toDynamicValue(ctx => {
    const provider = ctx.container.get(WebSocketConnectionProvider);
    return provider.createProxy<PebbleFiles>(pebbleFilesePath);
  }).inSingletonScope();

  bind(PebbleViewWidgetFactory).toFactory(ctx =>
    () => createPebbleViewWidget(ctx.container)
  );
  bind(PebbleEvalWidgetFactory).toFactory(ctx =>
    () => createPebbleEvalWidget(ctx.container)
  );

  bind(PebbleViewService).toSelf().inSingletonScope();
  bind(WidgetFactory).toDynamicValue(context => context.container.get(PebbleViewService));
  bind(PebbleEvalService).toSelf().inSingletonScope();
  bind(WidgetFactory).toDynamicValue(context => context.container.get(PebbleEvalService));

  bindViewContribution(bind, PebbleContribution);
  bindViewContribution(bind, PebbleEvalContribution);

  bind(PebbleCore).toSelf().inSingletonScope();
  bind(DragController).toSelf().inSingletonScope();
  
  bind(PebbleResourceResolver).toSelf().inSingletonScope();
  bind(ResourceResolver).toService(PebbleResourceResolver);
  bind(LanguageGrammarDefinitionContribution).to(XQueryGrammaribution).inSingletonScope();
  
});