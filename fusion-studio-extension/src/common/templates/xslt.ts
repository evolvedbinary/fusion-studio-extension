import { FSTemplate } from "../../classes/template";

export type FSTemplateXLSTVersion = '1' | '2' | '3';
export interface FSTemplateXLSTParams {
  version: FSTemplateXLSTVersion;
};
export const FSTemplateXLST: FSTemplate<FSTemplateXLSTParams> = {
  name: 'XSLT Stylesheet',
  fields: {
    version: {
      label: 'Version',
      options: [
        { label: '1.0', value: '1' },
        { label: '2.0', value: '2' },
        { label: '3.0', value: '3' },
      ],
    },
  },
  defaults: {
    version: '2',
  },
  ext: () => 'xslt',
  execute: ({ version }: FSTemplateXLSTParams) => {
    switch (version) {
      default: return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="1.0">
    
    <!-- identity transform -->
    <xsl:template match="node()|@*">
        <xsl:copy>
            <xsl:apply-templates select="node()|@*"/>
        </xsl:copy>
    </xsl:template>
    
</xsl:stylesheet>
`;
      case '2': return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">
    
    <!-- identity transform -->
    <xsl:template match="node()|@*">
        <xsl:copy>
            <xsl:apply-templates select="node()|@*"/>
        </xsl:copy>
    </xsl:template>
    
</xsl:stylesheet>
`;
      case '3': return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:math="http://www.w3.org/2005/xpath-functions/math"
    exclude-result-prefixes="xs math"
    version="3.0">
    
    <!-- identity transform -->
    <xsl:template match="node()|@*">
        <xsl:copy>
            <xsl:apply-templates select="node()|@*"/>
        </xsl:copy>
    </xsl:template>
    
</xsl:stylesheet>
`;
    }
  },
};