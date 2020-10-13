# Dev notes

TODO

- fallback to show in visible lines, when lines of console logs are not reliable(Angular, Typescript, compiled code)

- log on client after message to VSCode is sent. One can write to database.

## Cannot publish

`vsce ls` errors then small laptop can publish it. `npm i --no-optional` could help.

## To read

```javascript
import { window, commands, workspace } from "vscode";
import { ExtensionContext } from "vscode";
import * as ChildProcess from "child_process";

class Extension {
  public activate(context: ExtensionContext): void {
    const _item = window.createStatusBarItem();
    _item.text = "$(versions) Bump";
    _item.tooltip = "Bump Npm Package Version";
    _item.command = "bump-npm-package-version";
    _item.show();
    const _command = commands.registerCommand(
      "bump-npm-package-version",
      this.onBumpVersion.bind(this)
    );
    context.subscriptions.push(_item, _command);
  }

  public deactivate(): void {}

  private async onBumpVersion() {
    const _pick = await window.showQuickPick([
      "Major",
      "Minor",
      "Patch",
      "Pre-Major",
      "Pre-Minor",
      "Pre-Patch",
      "Pre-Release"
    ]);
    if (
      typeof _pick !== "undefined" &&
      typeof workspace.workspaceFolders !== "undefined" &&
      workspace.workspaceFolders.length > 0
    )
      ChildProcess.exec(
        `npm version ${_pick.toLowerCase().replace("-", "")}`,
        { cwd: workspace.workspaceFolders[0].uri.fsPath },
        _error => {
          window.showWarningMessage(
            typeof _error !== "undefined"
              ? `Something went wrong while bumping...\n\n${_error!.message}`
              : `Bumped ${_pick} NPM Package Version`
          );
        }
      );
  }
}

const extension = new Extension();
export function activate(context: ExtensionContext): void {
  extension.activate(context);
}
export function deactivate(): void {
  extension.deactivate();
}
```