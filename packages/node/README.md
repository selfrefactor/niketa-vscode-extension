# Niketa-client

Auto run `Jest` upon file save in `VSCode`

This library does the heavy work, while `Niketa` VSCode extension provides the communication with `VSCode`.

## Install

1. Install `Niketa` [vscode extension](https://marketplace.visualstudio.com/items?itemName=selfrefactor.niketa)

2. `git clone https://github.com/selfrefactor/niketa.git`

3. `cd packages/node`

4. `yarn`

5. Run `node start`

6. Open with VSCode project which already has `Jest` in `package.json` and also has its dependecies installed.

That is everything. Now every time you change one of `foo.js` or `foo.spec.js` files, `Jest` will be executed and its coverage result will be displayed in `VSCode`
