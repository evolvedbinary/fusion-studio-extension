import { FSTemplateRN } from './rng';
import { FSTemplateRestXQ } from './restxq';
import { FSTemplateXLST } from './xslt';
import { FSTemplateXML } from './xml';
import { FSTemplateXQ } from './xq';
import { FSTemplateXQM } from './xqm';
import { FSTemplateXSD } from './xsd';
import { FSTemplate } from '../../classes/template';

export * from './rng';
export * from './xml';
export * from './xq';
export * from './xqm';
export * from './xsd';
export * from './xslt';

export const TEMPLATES: FSTemplate[] = [
  FSTemplateXML,
  FSTemplateXQ,
  FSTemplateXQM,
  FSTemplateRestXQ,
  FSTemplateXLST,
  FSTemplateXSD,
  FSTemplateRN,
];