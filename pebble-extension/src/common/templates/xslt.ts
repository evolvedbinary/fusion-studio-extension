import { PebbleTemplate } from "../../classes/template";

export type PebbleTemplateXLSTVersion = 1 | 2 | 3;
export interface PebbleTemplateXLSTParams {
  version: PebbleTemplateXLSTVersion;
};
export const PebbleTemplateXLST: PebbleTemplate<PebbleTemplateXLSTParams> = {
  name: 'XSLT Stylesheet',
  defaults: {
    version: 1,
  },
  ext: () => 'xslt',
  execute: ({ version }: PebbleTemplateXLSTParams) => {
    switch (version) {
      default:
      case 1: return `<?xml version="1.0" encoding="UTF-8"?>
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
      case 2: return `<?xml version="1.0" encoding="UTF-8"?>
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
      case 3: return `<?xml version="1.0" encoding="UTF-8"?>
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