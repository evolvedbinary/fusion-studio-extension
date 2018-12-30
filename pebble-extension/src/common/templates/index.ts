import { PebbleTemplateRN } from './rng';
import { PebbleTemplateRestXQ } from './restxq';
import { PebbleTemplateXLST } from './xslt';
import { PebbleTemplateXML } from './xml';
import { PebbleTemplateXQ } from './xq';
import { PebbleTemplateXQM } from './xqm';
import { PebbleTemplateXSD } from './xsd';
import { PebbleTemplate } from '../../classes/template';

export * from './rng';
export * from './xml';
export * from './xq';
export * from './xqm';
export * from './xsd';
export * from './xslt';

export const TEMPLATES: PebbleTemplate[] = [
  PebbleTemplateXML,
  PebbleTemplateXQ,
  PebbleTemplateXQM,
  PebbleTemplateRestXQ,
  PebbleTemplateXLST,
  PebbleTemplateXSD,
  PebbleTemplateRN,
];