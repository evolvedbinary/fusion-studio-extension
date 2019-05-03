# Fusion Studio Theia Extension
[![Build Status](https://travis-ci.com/evolvedbinary/fusion-studio-extension.svg?branch=master)](https://travis-ci.com/evolvedbinary/fusion-studio-extension)

**Fusion DB**'s extension for [Theia IDE](https://theia-ide.org).
If you don't know what Theia is, then you likely want the full [Fusion Studio IDE application](https://github.com/evolvedbinary/fusion-studio).



## Getting started:
### Requirements:
* [Yarn](https://yarnpkg.com/lang/en/docs/install/#install-via-chocolatey). Tested with v1.7.0 and v1.15.2
* [Node 8](https://nodejs.org/dist/v8.11.4/). Tested with v8.11.4 (it should be installed with nvm or Yarn)
* [Python 2](https://www.python.org/). Tested with 2.7.16
* Windows platforms only:
    * Microsoft Visual Studio 2015 C++. Tested with Community Edition
 
### Install and build:
Clone the repo, and build the source:
```bash
$ git clone https://github.com/evolvedbinary/fusion-studio-extension.git
$ cd fusion-studio-extension
$ yarn
```
### Test the extension
#### Test on the browser
* run this after install, and run it right after switching from Electron to the browser:
```bash
$ yarn run rebuild:browser
```
* Start the IDE:
```bash
$ cd browser-app
$ yarn start
```
#### Test Electron app
* run this after install, and run it right after switching from the browser to Electron:
```bash
$ yarn run rebuild:electron
```
* Start the IDE:
```bash
$ cd electron-app
$ yarn start
```
### Developing
To watch for files changes:
* To compile css:
```bash
$ yarn run sass:watch
```
* To compile the extension
```bash
$ cd pebble-extension
$ yarn watch
```
* To compile the browser app
```bash
$ cd browser-app
$ yarn watch
```
* To compile Electron app
```bash
$ cd browser-app
$ yarn watch
```

**Extra**
- You can debug both the browser and Electron apps using VS Code launch configurations:
  - `"Start Browser Backend"`
  - `"Start Electron Backend"`
- You can compile css file at anytime by running:
```bash
$ yarn run sass
```
**Known issues**
- Building the extension after updating the dependencies may throw 3 non-breaking errors:
```
error TS2688: Cannot find type definition file for 'monaco-editor-core/monaco'.

1 /// <reference types="monaco-editor-core/monaco" />
                        ~~~~~~~~~~~~~~~~~~~~~~~~~
```
to fix this you'll need to give the correct reference in these 3 files:
  - node_modules/monaco-languageclient/lib/monaco-converter.d.ts
  - node_modules/monaco-languageclient/lib/monaco-languages.d.ts
  - node_modules/monaco-languageclient/lib/monaco-workspace.d.ts
and change the first line:
```diff
- /// <reference types="monaco-editor-core/monaco" />
+ /// <reference types="@typefox/monaco-editor-core/monaco" />
```
or simply run `yarn run dependencies`
