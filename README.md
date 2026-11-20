# FrogCog for Claude

Keep a record of every appliance and device in your home by talking to Claude. FrogCog keeps the records in a
folder on your own computer and works out the dates. More: https://frogcog.com/ai/

## Adding it to Claude

These are the steps as they looked in the Claude desktop app in November 2026. The names may change.

1. In Claude: Plugins, Add, "Add marketplace", and enter `frogcog-app/claude-plugin`.
2. Install **FrogCog** from it. Claude warns that the plugin includes a program that runs on your computer.
   That is the binder, which keeps your records in a folder you pick. Continue.
3. On the plugin's page, if it shows "Finish setup", press it, then "Connect" beside `FrogCog-lookups`.
   No sign-in is asked for.
4. Type `/frogcog:set-up`.

In Claude Code: `/plugin marketplace add frogcog-app/claude-plugin`, then `/plugin install frogcog@frogcog`.

What the plugin does, what it needs and who sees what: [frogcog/README.md](frogcog/README.md).
Privacy policy: https://frogcog.com/privacy/

This repository is copied from FrogCog's own source each time the plugin changes.
