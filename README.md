# Niketa

`Niketa` is a suite for automatically running `Jest`. In short words, it is similar to `Wallaby`.

## `Niketa` vs `Wallaby`

There are several major differences between `Niketa` and `Wallaby`:

- `Niketa` runs on single file, while `Wallaby` will run all of the tests every time.

- `Niketa` is starts when file is saved. `Wallaby` quite annoying starts running on every single keypress.

- `Wallaby` has some absurd OS's resources footprint. `Niketa` is stupid in a good way and that makes it lightweight for any OS.

- `Niketa` actual work is performed outside the scope of `VSCode`, which is the other reason for the good performance.

- `Niketa` and `Wallaby` are only partially overlapping. In fact, the best case scenario is when you are using both.

## Niketa suite short explanation

The suite contains the following parts:

- `niketa` - `VSCode` extension

It sends file saved events to `niketa-client` and provide interface for accessing `VSCode` status bar.

- `niketa-client` - `Node.js` application

The main work is concetrated here. It waits for events from `niketa` extension and runs `Jest` on the saved file.

- `niketa-notify`(optional) - `Electron` application

It is used to show the logs of the test in a window that disappears after few seconds. It is WIP, so it still lacks any kind of documentation. Note that this is optional dependency and you are advised to ignore it for the time being.

## Detailed explanation to start `Niketa`

`Niketa` uses ports range `3011-3014`. Setting ports as settings is part of the future enhancement of `Niketa` and is not applied currently.

### Step 1 - Install `niketa-client`

- `git clone https://github.com/selfrefactor/niketa-client.git`

- `yarn install`

- `node prove`

At the end you should see `🏁` in your log. This means that the client is waiting for socket connection to be established.

### Step 2 - Install `niketa` extension

From your VSCode instance, search for `niketa` in the marketplace. Install it and restart `VSCode`.

Now you need to start the extension.

Press `Ctrl+Shift+p` to open `VSCode` commands. Search for `niketa` and start the command.

You should see `NIKETA` in your status bar.

Now `Niketa` is running and is waiting for a file change.

### Step 3 - Make a file change

Lets say that we have `foo.js` and `foo.spec.js`. In this case, change in any of those files will trigger `niketa-client`. Otherwise, it does nothing.

`Niketa` works currently only with `*.spec.js` pattern. Projects with `__tests__` pattern won't be able to use `Niketa`.

So, we make a change in either `spec.js` file or the file associated with a `spec.js` file and save it.

This will send filepath and CWD information to `niketa-client`. The client will run the test and send back the result. While we are waiting for the test result, you will see a loading bar in your status bar.

If any test in `foo.spec.js` is failing, you will see error icon and the number of failing tests.

If all tests in `foo.spec.js` are passig failing, you will see success icon and the number of passing tests.

The log in both cases will be in the tooltip, i.e. if you hover over `Niketa` info, you will see it. The test logs are also visible in `niketa-client` log.

That is it. I will continue explaining the very opiniated mode `WITH_COVERAGE`, but basically we are done here.

---

## `WITH_COVERAGE` mode

Mode is changed by clicking on either the `NIKETA` text(if you haven't run any tests) or `niketa` results(in case that you already have used the default mode).

Upon clicking, you should see the text `WITH_COVERAGE` appearing for a few seconds in the status bar. Further clicks toggle the mode. The current modes are `NO_COVERAGE`(default), `WITH_COVERAGE` and `OFF`.

`WITH_COVERAGE` is intended to be used, when you create new tests, so you don't care much for snapshot differences and you need to know how your coding reflects on coverage percentages.

What `WITH_COVERAGE` mode do is the following:

### It runs covarage on a single path

### If there is need to update snapshots, it does that

This means the snapshot difference is ignored and is only visible from `niketa-client` side.

### The first time you run the test upon `foo.spec.js`

You should see something like the following in your status bar:

```
🐰 st:65.43 br: 73.55 fn: 55 lns: 77
```

This means that you have 65.43% coverage for statements, 73.55% for branches, 55% for functions amd 77% for lines.

The rabbit icon is reference to the Bulgarian word for `freshman`, i.e. first-timer.

### The next time you run the test upon `foo.spec.js`

If there is no change in coverage percentages compared to the previous run, you will see basketball icon `⛹`. The reference is related to my opiniated observation that basketball tends to be boring to play if there is no enough quality and spirit on the field.

If there is difference in coverage percentages, then you should see something like:

```
✍:12 🎋:5 ☈: 3.5 📜: 11
```

This means that you have 12% increase in statement coverage, 5% increase in branches coverage, 3.5% increase of functions coverage and 11% increase of lines coverage.

### If there is error during test, you will see error icon

Also the error log will be visible as a tooltip upon hover.

## Note

Be aware that if your `Jest` config sets `coverageReporters`, then you need to disable them, otherwise you will see `LINE === undefined` in the status bar instead of the results.

---

`Niketa` also has a shortkey assosiated, which is `Ctrl+1`. It overlaps with `workbench.action.focusFirstEditorGroup`, so you will need to remove the default keybinding if you want to use it.
