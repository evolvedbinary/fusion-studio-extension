import { PebbleTemplate } from "../../classes/template";

export interface PebbleTemplateRestXQParams {
  prefix: string;
  namespace: string;
}
export const PebbleTemplateRestXQ: PebbleTemplate = {
  name: 'XQuery RESTXQ Module',
  defaults: {
    namespace: 'mynamepsace',
    prefix: 'myprefix',
  },
  ext: () => 'xqm',
  execute: ({ prefix, namespace }: PebbleTemplateRestXQParams) => `xquery version "3.1";

module namespace ${prefix} = "${namespace}";

declare namespace err = "http://www.w3.org/2005/xqt-errors";
declare namespace rest = "http://exquery.org/ns/restxq";
declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";
declare namespace http = "http://expath.org/ns/http-client";


declare
    %rest:GET
    %rest:path("/${prefix}/hello")
    %rest:query-param("name", "{$name}")
    %rest:produces("application/xml")
function ${prefix}:hello-xml($name) {
    <hello at="{current-dateTime()}">{$name}</hello>
};

declare
    %rest:GET
    %rest:path("/${prefix}/hello")
    %rest:query-param("name", "{$name}")
    %rest:produces("application/json")
    %output:method("json")
function ${prefix}:hello-json($name) {
    map {
        "hello": $name,
        "at": current-dateTime()
    }
};
`,
};