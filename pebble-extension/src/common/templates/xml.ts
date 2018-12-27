import { PebbleTemplate } from "../../classes/template";

export const PebbleTemplateXML: PebbleTemplate = {
  name: 'XML Document',
  ext: () => 'xml',
  execute: () => `<?xml version="1.0" encoding="UTF-8"?>
<hello/>
`,
};
