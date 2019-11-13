# Niketa-notify

It should be on the same level as `niketa-client`

## Prepare

Run `node prepare` and paste to `config.json`

## Calculate screen size

Run `node setSize`, and remove config.json if it exists beforehand.

## Issues

`yarn prod` is not working

`
		"prod": "webpack --mode production --config webpack.build.config.js && electron --noDevServer .",
`