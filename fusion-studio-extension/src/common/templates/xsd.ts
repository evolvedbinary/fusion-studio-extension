import { FSTemplate } from "../../classes/template";

export type FSTemplateXSDVersion = '1' | '1.1';
export interface FSTemplateXSDParams {
  version: FSTemplateXSDVersion;
  namespace: string;
};

export const FSTemplateXSD: FSTemplate<FSTemplateXSDParams> = {
  name: 'XML Schema',
  fields: {
    namespace: 'Namespace',
    version: {
      label: 'Version',
      options: [
        { label: '1.0', value: '1' },
        { label: '1.1', value: '1.1' },
      ],
    },
  },
  defaults: {
      version: '1',
      namespace: 'mynamespace',
  },
  ext: () => 'xsd',
  execute: ({ version, namespace }: FSTemplateXSDParams) => `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:vc="http://www.w3.org/2007/XMLSchema-versioning"
    xmlns="${namespace}"
    targetNamespace="${namespace}"
    elementFormDefault="qualified"
    vc:minVersion="1.${ version === '1' ? '0" vc:maxVersion="1.1' : '1'}"
    version="1.${ version === '1' ? '0' : '1'}">
    
</xs:schema>
`,
};