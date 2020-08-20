import { FSTemplate } from "../../classes/template";

export const FSTemplateXQ: FSTemplate = {
  id: 'xq',
  name: 'XQuery Main Module',
  ext: () => 'xq',
  execute: () => `xquery version "3.1";

<hello at="{current-dateTime()}"/>
`,
};