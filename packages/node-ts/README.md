# Niketa tools

## TODO

logging it doesn't work with `niketa-theme`

// pipenv run pytest tests/unit_tests/foo.py -v -rf --capture=no

## Request Jest action

`alt+w`

## Request lint action

`ctrl+1`

### package.json

It will sort `package.json` file

### *.html files

Lint with `pretty-html`

## Install

1. Install `Niketa` [vscode extension](https://marketplace.visualstudio.com/items?itemName=selfrefactor.niketa-tools)

2. Add `niketa` to your **PATH** by running `npm i -g niketa`

3. Run `niketa` in terminal

4. In VSCode, go to Jest spec file and press `alt+w` to trigger Jest action

5. After Jest is complete, you will receive coverage info in your VSCode

## TODO

- remove `any`

- Doesn't work with `magic-beans` as it uses `exports.foo = foo`

## Jest version

Work with `25.4.0` onwards
