## Niketa scripts (Zed)

A Zed port of the [niketa-vscode-extension](https://github.com/selfrefactor/niketa-vscode-extension)
"Run Niketa scripts" tool. It reads the current project's `package.json`
(`niketaScripts` / `niketaScriptsLegacy`, old and new `scripts + active` format)
and runs the matching script against a file.

Zed extensions expose no command-palette/keybind API, so the tool lives in the
Assistant as slash commands:

| Slash command | Effect |
| --- | --- |
| `/niketa run <path>` | Run the `niketaScripts` command matching `<path>` (spec-file resolution included). Falls back to lint when nothing is configured. |
| `/niketa lint <path>` | Run `run fmt <path>`. |
| `/niketa status` | Show the current project's active script sets / globs / legacy entries. |

`<path>` is relative to the project (worktree) root. Scripts run with
`sh -lc "cd <root> && <command> <path>"` and output is returned into the
Assistant.

## Binding to a key like in VS Code (alt-w / ctrl+1)

Zed extensions cannot contribute keybindings (v0.7.0 API), but the **Task**
system can. This repo ships a standalone dispatcher,
[`scripts/niketa-run.js`](scripts/niketa-run.js), with byte-for-byte the same
logic as the slash commands (`niketaScripts`, `niketaScriptsLegacy`, spec
resolution, lint fallback). Wire it up once:

1. Copy the tasks from [`tasks.example.json`](tasks.example.json) into your
   global `~/.config/zed/tasks.json` (or any project's `.zed/tasks.json`).
   Adjust the dispatcher path if this repo lives elsewhere.
2. Copy the bindings from [`keymap.example.json`](keymap.example.json) into
   `~/.config/zed/keymap.json`:

```json
{
  "context": "Workspace",
  "bindings": {
    "alt-w": ["task::Spawn", { "task_name": "niketa: run" }],
    "ctrl-1": ["task::Spawn", { "task_name": "niketa: lint" }]
  }
}
```

Now `alt-w` runs the script for the current file and shows output in the task
terminal — the same flow as the VS Code `niketa.request.run.script` binding.
`alt-w` again reruns it (`task: rerun` semantics).

## Install as dev extension

1. Open the Extensions panel (`zed: extensions`).
2. Click **Install Dev Extension** (or run `zed: install dev extension`).
3. Select this `zed-extension/` directory (Rust is compiled to WASM automatically).
4. In any project, open the Assistant and use `/niketa status`, `/niketa run src/foo.ts`.

### Scope differences from the VS Code version

- No keybindings / status bar (Zed has no extension API for those yet).
- `niketa.cycle.script` (writing the new `active` set back into `package.json`)
  is not ported — the extension API cannot write worktree files.
- Scripts run synchronously in the Assistant; long-running scripts block until
  they finish (same as the hidden `spawnCommand` path of the original).