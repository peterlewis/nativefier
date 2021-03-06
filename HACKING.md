# Development Guide

Welcome, soon-to-be contributor 🙂! This document sums up what you
need to know to get started hacking on Nativefier.

## Guidelines

1. **Before starting work on a huge change, gauge the interest**
   of community & maintainers through a GitHub issue.
   For big changes, create a **[RFC](https://en.wikipedia.org/wiki/Request_for_Comments)**
   issue to enable a good peer review.
2. Do your best to **avoid adding new Nativefier command-line options**.
   If a new option is inevitable for what you want to do, sure,
   but as much as possible try to see if you change works without.
   Nativefier already has a ton of them, making it hard to use.
3. Do your best to **limit breaking changes**.
   Only introduce breaking changes when necessary, when required by deps, or when
   not breaking would be unreasonable. When you can, support the old thing forever.
   For example, keep maintaining old flags; to "replace" an flag you want to replace
   with a better version, you should keep honoring the old flag, and massage it
   to pass parameters to the new flag, maybe using a wrapper/adapter.
   Yes, our code will get a tiny bit uglier than it could have been with a hard
   breaking change, but that would be to ignore our users.
   Introducing breaking changes willy nilly is a comfort to us developers, but is
   disrespectful to end users who must constantly bend to the flow of breaking changes
   pushed by _all their software_ who think it's "just one breaking change".
4. **Avoid adding npm dependencies**. Each new dep is a complexity & security liability.
   You might be thinking your extra dep is _"just a little extra dep"_, and maybe
   you found one that is high-quality & dependency-less. Still, it's an extra dep,
   and over the life of Nativefier we requested changes to *dozens* of PRs to avoid
   "just a little extra dep". Without this constant attention, Nativefier would be
   more bloated, less stable for users, more annoying to maintainers. Now, don't go
   rewriting zlib if you need a zlib dep, for sure use a dep. But if you can write a
   little helper function saving us a dep for a mundane task, go for the helper :) .
   Also, an in-tree helper will always be less complex than a dep, as inherently
   more tailored to our use case, and less complexity is good.
5. Use **types**, avoid `any`, write **tests**.
6. **Document for users** in `API.md`
7. **Document for other devs** in comments, jsdoc, commits, PRs.
   Say _why_ more than _what_, the _what_ is your code!

## Setup

First, clone the project:

```bash
git clone https://github.com/nativefier/nativefier.git
cd nativefier
```

Install dependencies (for both the CLI and the Electron app):

```bash
npm install
```

The above `npm install` will build automatically (through the `prepare` hook).
When you need to re-build Nativefier,

```bash
npm run build
```

Set up a symbolic link so that running `nativefier` calls your dev version with your changes:

```bash
npm link
which nativefier
# -> Should return a path, e.g. /home/youruser/.node_modules/lib/node_modules/nativefier
# If not, be sure your `npm_config_prefix` env var is set and in your `PATH`
```

After doing so, you can run Nativefier with your test parameters:

```bash
nativefier --your-awesome-new-flag 'https://your-test-site.com'
```

Then run your nativefier app _through the command line too_ (to see logs & errors):

```bash
# Under Linux
./your-test-site-linux-x64/your-test-site

# Under Windows
your-test-site-win32-x64/your-test-site.exe

# Under macOS
./YourTestSite-darwin-x64/YourTestSite.app/Contents/MacOS/YourTestSite --verbose
```

## Linting & formatting

Nativefier uses [Prettier](https://prettier.io/), which will shout at you for
not formatting code exactly like it expects. This guarantees a homogenous style,
but is painful to do manually. Do yourself a favor and install a
[Prettier plugin for your editor](https://prettier.io/docs/en/editors.html).

## Tests

- To run all tests, `npm t`
- To run only unit tests, `npm run test:unit`
- To run only integration tests, `npm run test:integration`
- Logging is suppressed by default in tests, to avoid polluting Jest output.
  To get debug logs, `npm run test:withlog` or set the `LOGLEVEL` env. var.
- For a good live experience, open two terminal panes/tabs running code/tests watchers:
  1. Run a TSC watcher: `npm run build:watch`
  2. Run a Jest unit tests watcher: `npm run test:watch`
  3. Here is [a screencast of how the live-reload experience should look like](https://user-images.githubusercontent.com/522085/120407694-abdf3f00-c31b-11eb-9ab5-a531a929adb9.mp4)
- Alternatively, you can run both test processes in the same terminal by running: `npm run watch`

## Release

While on `master`, with no uncommitted changes, run:

```bash
npm run changelog -- $VERSION
# With no 'v'. For example: npm run changelog -- 42.5.0
```
