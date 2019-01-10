import { injectable } from "inversify";
import { LanguageGrammarDefinitionContribution, TextmateRegistry } from '@theia/monaco/lib/browser/textmate';
import { XQUERY_PLIST, XQUERY_CONFIG } from '../data/xquery';

@injectable()
export class XQueryGrammaribution implements LanguageGrammarDefinitionContribution {

  readonly id = 'xquery';
  readonly scopeName = 'source.xquery';

  registerTextmateLanguage(registry: TextmateRegistry) {
    monaco.languages.register({
      id: this.id,
      extensions: ['xq', 'xql', 'xqm', 'xqy', 'xquery'],
      aliases: ['XQuery', 'xquery'],
      firstLine: '^\bxquery version\b.*',
    });

    monaco.languages.setLanguageConfiguration(this.id, XQUERY_CONFIG);
    registry.registerTextmateGrammarScope(this.scopeName, {
      async getGrammarDefinition() {
        return {
          format: 'plist',
          content: XQUERY_PLIST,
        }
      }
    });
    registry.mapLanguageIdToTextmateGrammar(this.id, this.scopeName);
  }
}