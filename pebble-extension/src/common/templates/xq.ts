import { PebbleTemplate } from "../../classes/template";

export const PebbleTemplateXQ: PebbleTemplate = {
  name: 'XQuery Main Module',
  ext: () => 'xq',
  execute: () => `xquery version "3.1";

<hello at="{current-dateTime()}"/>
`,
};