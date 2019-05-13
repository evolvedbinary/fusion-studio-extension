# Fusion Studio Theia Extension
[![Build Status](https://travis-ci.com/evolvedbinary/fusion-studio-extension.svg?branch=master)](https://travis-ci.com/evolvedbinary/fusion-studio-extension)
[![Build status](https://ci.appveyor.com/api/projects/status/3fxvhf0k0cjjcukv/branch/master?svg=true)](https://ci.appveyor.com/project/AdamRetter/fusion-studio-extension/branch/master)

**Fusion DB**'s extension for [Theia IDE](https://theia-ide.org).
If you don't know what Theia is, then you likely want the full [Fusion Studio IDE application](https://github.com/evolvedbinary/fusion-studio).



## Getting started:
### Requirements:
*   [Fusion Studio API](https://github.com/evolvedbinary/fusion-studio-api) a compatible exist or fusion database.

#### For building
*   [Yarn](https://yarnpkg.com/lang/en/docs/install/#install-via-chocolatey). Tested with v1.7.0 and v1.15.2
*   [Node 8](https://nodejs.org/dist/v8.11.4/). Tested with v8.11.4 (it should be installed with nvm or Yarn)
*   [Python 2](https://www.python.org/). Tested with 2.7.16
*   Windows platforms only:
    *   Microsoft Visual Studio 2015 C++. Tested with Community Edition

#### For Testing
*   [cypress.js](https://www.cypress.io) v3.2.0    



### Install and build:
Clone the repo, and build the source:
```bash
$ git clone https://github.com/evolvedbinary/fusion-studio-extension.git
$ cd fusion-studio-extension
$ yarn
```

> You may get the error `No package 'x11' found` on Ubuntu (Minimal installation), you'll need to install these packages:
> ```bash
> sudo apt install libx11-dev libxkbfile-dev
> ```

### Test the extension
#### Test on the browser
*   run this after install, and run it right after switching from Electron to the browser:
```bash
$ yarn run rebuild:browser
```
*   Start the IDE:
```bash
$ cd browser-app
$ yarn start
```
#### Test Electron app
*   run this after install, and run it right after switching from the browser to Electron:
```bash
$ yarn run rebuild:electron
```
*   Start the IDE:
```bash
$ cd electron-app
$ yarn start
```

#### Integration Testing
To run the integrations tests you need a running database with the fusion-studio-api installed. It should be reachable at `localhost:8080` and have an empty admin password. You can then run the integration test GUI locally by using:
```bash
yarn run cypress open
```
or in cases where the above fails to load the [cypress test runner](https://docs.cypress.io/guides/core-concepts/test-runner.html#Overview), use:
```bash
./node_modules/.bin/cypress open
```

Integration tests are also run on travis. To see a similar command line style output use:
```bash
yarn run cypress run
```
### Developing
*   To compile css:
```bash
$ yarn run sass:watch
```
To watch for files changes:
*   To compile the extension
```bash
$ cd fusion-studio-extension
$ yarn watch
```
*   To compile the browser app
```bash
$ cd browser-app
$ yarn watch
```
*   To compile Electron app
```bash
$ cd browser-app
$ yarn watch
```

**Extra**
-   You can debug both the browser and Electron apps using VS Code launch configurations:
  -   `"Start Browser Backend"`
  -   `"Start Electron Backend"`
-   You can compile css file at anytime by running:
```bash
$ yarn run sass
```
**Known issues**
-   Building the extension after updating the dependencies may throw 3 non-breaking errors:
```
error TS2688: Cannot find type definition file for 'monaco-editor-core/monaco'.

1 /// <reference types="monaco-editor-core/monaco" />
                        ~~~~~~~~~~~~~~~~~~~~~~~~~
```
to fix this you'll need to give the correct reference in these 3 files:
  -   node_modules/monaco-languageclient/lib/monaco-converter.d.ts
  -   node_modules/monaco-languageclient/lib/monaco-languages.d.ts
  -   node_modules/monaco-languageclient/lib/monaco-workspace.d.ts
and change the first line:
```diff
- /// <reference types="monaco-editor-core/monaco" />
+ /// <reference types="@typefox/monaco-editor-core/monaco" />
```
or simply run `yarn run dependencies`
