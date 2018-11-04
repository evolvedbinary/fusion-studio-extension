/**
 * Generated using theia-extension-generator
 */

import { ExCommandContribution, ExMenuContribution } from './contribution';
import {
  CommandContribution,
  MenuContribution,
  ResourceResolver,
} from "@theia/core/lib/common";

import { ContainerModule, interfaces } from "inversify";
import { PebbleResourceResolver } from '../browser/resource';
import { PebbleViewWidgetFactory, PebbleViewWidget } from './widget';
import { createTreeContainer, TreeProps, defaultTreeProps, TreeWidget, WidgetFactory, bindViewContribution, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PebbleViewService } from './view-service';
import { PebbleViewContribution } from './view-contribution';

import '../../src/style/index.scss';

export default new ContainerModule(bind => {

  bind(PebbleViewWidgetFactory).toFactory(ctx =>
    () => createPebbleViewWidget(ctx.container)
  );

  bind(PebbleViewService).toSelf().inSingletonScope();
  bind(WidgetFactory).toDynamicValue(context => context.container.get(PebbleViewService));
  
  bind(PebbleResourceResolver).toSelf().inSingletonScope();
  bind(ResourceResolver).toService(PebbleResourceResolver);

  bindViewContribution(bind, PebbleViewContribution);
  bind(FrontendApplicationContribution).toService(PebbleViewContribution);
  
  bind(CommandContribution).to(ExCommandContribution);
  bind(MenuContribution).to(ExMenuContribution);
  
});

function createPebbleViewWidget(parent: interfaces.Container): PebbleViewWidget {
  const child = createTreeContainer(parent);

  child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, search: true });

  child.unbind(TreeWidget);
  child.bind(PebbleViewWidget).toSelf();

  return child.get(PebbleViewWidget);
}