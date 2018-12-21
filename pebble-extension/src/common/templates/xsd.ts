import { PebbleTemplate } from "../../classes/template";

export type PebbleTemplateXSDVersion = 1 | 1.1;
export interface PebbleTemplateXSDParams {
  version: PebbleTemplateXSDVersion;
  namespace: string;
};

export const PebbleTemplateXSD: PebbleTemplate<PebbleTemplateXSDParams> = {
  name: 'XML Schema',
  defaults: {
      version: 1,
      namespace: 'mynamespace',
  },
  ext: () => 'xsd',
  execute: ({ version, namespace }: PebbleTemplateXSDParams) => `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
    xmlns="${namespace}"
    targetNamespace="${namespace}"
    elementFormDefault="qualified"
    vc:minVersion="1.${ version === 1 ? '0" vc:maxVersion="1.1' : '1'}"
    version="1.${ version === 1 ? '0' : '1'}">
    
</xs:schema>
`,
};