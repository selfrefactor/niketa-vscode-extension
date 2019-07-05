# Niketa-client

Auto run `Jest` upon file save in `VSCode`

This library does the heavy work, while `Niketa` VSCode extension provides the communication with `VSCode`.

## Install

`yarn add https://github.com/selfrefactor/niketa-client#LATEST_RELEASE`

You need to change `LATEST_RELEASE` with latest release visible in [https://github.com/selfrefactor/releases](https://github.com/selfrefactor/releases)

## Usage

```
const {niketaClient} = require('niketa-client')

niketaClient()
```

## Modes

### NO_SNAPSHOTS

### WITH_SNAPSHOTS

## Niketa-notify

`Niketa-client` must be run before `Niketa-notify`