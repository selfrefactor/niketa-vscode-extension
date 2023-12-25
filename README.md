# Niketa tools

It expects this in `package.json`

```
"niketaScripts": [
  {
    "**/*.js": "yarn lint:file"
  },
  {
    "**/*.js": "yarn run:file"
  }
],
```

In this case, when pressing `ctrl+1`, it will run `yarn lint:file` with the current path as additional argument.

When pressing `alt+w`, it will run `yarn run:file` with the current path as additional argument.
