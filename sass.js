const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const SASS_RULE = '\\n            {\\n                test: /\\.scss$/,\\n                use: [\\n                    \\"style-loader\\", // creates style nodes from JS strings\\n                    \\"css-loader\\", // translates CSS into CommonJS\\n                    \\"sass-loader\\" // compiles Sass to CSS, using Node Sass by default\\n                ]\\n            },';

file = 'node_modules/@theia/application-manager/lib/generator/webpack-generator.js';
file = path.join(__dirname, file);
console.log(chalk.white('-----------------------------------------'));
console.log(chalk.white('      Patching Webpack configuration'));
console.log(chalk.white('-----------------------------------------'));
try {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let matches = content.match(/rules: \[(.*)\].*";/);
    if (matches && matches.length > 1) {
      const webpackRules = matches[1];
      if (webpackRules.match(/test: \/\\\.scss\$\//)) {
        throw 'Already patched.';
      }
      fs.writeFileSync(file, content.replace(webpackRules, SASS_RULE + webpackRules), {
        encoding: 'utf8',
        flag: 'w',
      })
      console.log(chalk.green('  * done!'));
    } else {
      throw 'Couldn\'t find webpack rules.';
    }
  } else {
    throw 'File not found.';
  }
} catch (e) {
  console.log('  Something went wrong:');
  console.log(chalk.red('  * ' + e));
}
console.log(chalk.white('-----------------------------------------'));