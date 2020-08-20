import { FSTemplate } from "../../classes/template";

export interface FSTemplateXQMParams {
  prefix: string;
  namespace: string;
}
export const FSTemplateXQM: FSTemplate<FSTemplateXQMParams> = {
  id: 'xqm',
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
  execute: ({ prefix, namespace }: FSTemplateXQMParams) => `xquery version "3.1";

module namespace ${prefix} = "${namespace}";

declare function ${prefix}:hello() as element(hello) {
    <hello at="{current-dateTime()}"/>
};
`,
};