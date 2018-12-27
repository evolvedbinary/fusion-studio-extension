import { PebbleTemplate } from "../../classes/template";

export interface PebbleTemplateXQMParams {
  prefix: string;
  namespace: string;
}
export const PebbleTemplateXQM: PebbleTemplate<PebbleTemplateXQMParams> = {
  name: 'XQuery Library Module',
  fields: {
    namespace: 'Namespace',
    prefix: 'Prefix',
  },
  defaults: {
    namespace: 'mynamepsace',
    prefix: 'myprefix',
  },
  ext: () => 'xqm',
  execute: ({ prefix, namespace }: PebbleTemplateXQMParams) => `xquery version "3.1";

module namespace ${prefix} = "${namespace}";

declare function ${prefix}:hello() as element(hello) {
    <hello at="{current-dateTime()}"/>
};
`,
};