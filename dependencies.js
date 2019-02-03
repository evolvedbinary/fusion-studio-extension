const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const search = '/// <reference types="monaco-editor-core/monaco" />';
const replace = '/// <reference types="@typefox/monaco-editor-core/monaco" />';

files = [
  'node_modules/monaco-languageclient/lib/monaco-converter.d.ts',
  'node_modules/monaco-languageclient/lib/monaco-languages.d.ts',
  'node_modules/monaco-languageclient/lib/monaco-workspace.d.ts',
];
console.log(chalk.white('-----------------------------------------'));
console.log(chalk.white('          Patching dependencies'));
console.log(chalk.white('-----------------------------------------'));
try {
  files.forEach(file => {
    file = path.join(__dirname, file);
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      let newContent = content.replace(search, replace);
      if (content != newContent) {
        fs.writeFileSync(file, newContent, {
          encoding: 'utf8',
          flag: 'w',
        })
        console.log(chalk.green(file.split(/[\/\\]/).pop() + ': done!'));
      } else {
        console.log(chalk.red('Couldn\'t find definition, wrong file? already patched?'));
      }
    } else {
      console.log(chalk.red('File not found.'));
    }
  });
} catch (e) {
  console.log('  Something went wrong:');
  console.log(chalk.red('  * ' + e));
}
console.log(chalk.white('-----------------------------------------'));