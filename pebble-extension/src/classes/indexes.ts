import { isArray } from "util";

export interface LuceneTextAttrPtn {
  qname: string;
  value: string;
  boost: number;
}
export interface LuceneAnalyzer {
  id: string;
  class: string;
  params: string
}
export interface LuceneText {
  qname: string;
  match: string;
  analyzer: string;
  ignore: LuceneIgnore[];
  boost: number;
  matchSiblingAttr: LuceneTextAttrPtn[];
  hasSiblingAttr: LuceneTextAttrPtn[];
  matchAttr: LuceneTextAttrPtn[];
  hasAttr: LuceneTextAttrPtn[];
}
export interface LuceneIgnore {
  qname: string;
}
export interface NgramIndex {
  qname: string;
}
export interface LegacyRangeIndex {
  qname: string;
  path: string;
  type: string;
}
export interface RangeIndexCondition {
  attribute: string;
  value: string;
  type: string;
}
export interface RangeIndexField {
  name: string;
  match: string;
  type: string;
}
export interface RangeIndex {
  qname: string;
  type: string;
  collation: string;
  case: boolean;
  conditions: RangeIndexCondition[];
  fields: RangeIndexField[];
}
export interface LuceneIndex {
  analyzers: LuceneAnalyzer[];
  text: LuceneText[];
  ignore: LuceneIgnore[];
}
export interface PebbleIndex {
  uri: string;
  lucene: LuceneIndex;
  ngram: LegacyRangeIndex[];
  range: RangeIndex[];
  legacyRange: LegacyRangeIndex[];
}

export function readIndex(data: any): PebbleIndex {
  const result: PebbleIndex = {
    uri: data.uri,
    lucene: {
      analyzers: [],
      ignore: [],
      text: [],
    },
    ngram: isArray(data.ngram) ? data.ngram : [],
    range: isArray(data.range) ? data.range : [],
    legacyRange: isArray(data['legacy-range']) ? data['legacy-range'] : [],
  };
  if (data.lucene) {
    console.log(isArray);
    if (data.lucene.analyzers && isArray(data.lucene.analyzers)) {
      result.lucene.analyzers = data.lucene.analyzers;
    }
    if (data.lucene.ignore && isArray(data.lucene.ignore)) {
      result.lucene.ignore = data.lucene.ignore;
    }
    if (data.lucene.text && isArray(data.lucene.text)) {
      data.lucene.text.matchSiblingAttr = data.lucene.text['match-sibling-attr'];
      data.lucene.text.hasSiblingAttr = data.lucene.text['has-sibling-attr'];
      data.lucene.text.matchAttr = data.lucene.text['match-attr'];
      data.lucene.text.hasAttr = data.lucene.text['has-attr'];
      delete(data.lucene.text['match-sibling-attr']);
      delete(data.lucene.text['has-sibling-attr']);
      delete(data.lucene.text['match-attr']);
      delete(data.lucene.text['has-attr']);
      result.lucene.text = data.lucene.text;
    }
  }
  return result;
}