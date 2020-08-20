import { FSTemplate } from "../../classes/template";

export const FSTemplateXML: FSTemplate = {
  id: 'xml',
  name: 'XML Document',
  ext: () => 'xml',
  execute: () => `<?xml version="1.0" encoding="UTF-8"?>
<hello/>
`,
};
