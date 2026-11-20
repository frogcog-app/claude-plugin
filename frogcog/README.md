# FrogCog for Claude

Keep a record of every appliance and device in your home by talking to Claude. FrogCog keeps the records in a
folder on your own computer and works out the dates: when a maker's warranty ends, the last day to register, when
an upkeep job is next due.

It does the same job as the FrogCog app, for a computer. On a phone, use the app: https://frogcog.com

## Adding it to Claude

These are the steps as they looked in the Claude desktop app in November 2026. The names may change.

1. In Claude: Plugins, Add, "Upload plugin", and choose the plugin's file.
2. Claude warns that the plugin includes a program that runs on your computer. That is the binder. Continue.
3. **Connect the lookups.** On the plugin's page, press "Finish setup",
   then "Connect" beside `FrogCog-lookups`. No sign-in is asked for. Uploading the plugin does not do this by itself, and
   until it is done FrogCog has no makers' warranties to give: items are saved with the warranty end unknown.
   Connecting adds a second entry to your list in Claude, under Connectors: "FrogCog-lookups", a custom connector
   at mcp.frogcog.com, beside the FrogCog plugin itself. It is this plugin's link to FrogCog's own service and
   nothing else. Removing it leaves the binder working, with no makers' figures.
4. Type `/frogcog:set-up`.

## What you can do

Type `/frogcog:` and pick a skill, or just say what you want. Claude may show a skill by its short name, for
example `/set-up` for `/frogcog:set-up`. Both work.

| Skill | What it does |
|---|---|
| `set-up` | Pick the folder and the country. Read who sees what. |
| `add-item`, `add-from-photo` | Add an appliance or device, typed in or read from a photo of its label or receipt. |
| `find-item`, `change-item`, `remove-item` | Find, change and remove items. |
| `whats-due`, `calendar` | See what is due. Get a calendar file of every date. |
| `backup` | Move your binder to or from the FrogCog app. |
| `attach`, `receipts`, `manual` | Keep photos, receipts and manuals. |
| `register`, `upkeep`, `seasonal`, `repair`, `contacts`, `protect`, `recalls`, `profile` | Registration, upkeep jobs, the season's checklist, repairs, your repair people, protection plans, possible safety recalls, your details. |
| `rooms`, `contents-list` | Rooms, and a contents list for insurance. |
| `ask` | Ask about a product with no binder at all. This one works everywhere, a phone included. |

## What it needs

- **A computer** (Windows or macOS) with the Claude desktop app or Claude Code. The binder is a small program
  that Claude starts on that computer, and your records stay there.
- **Node** (version 18 or later) installed on that computer: https://nodejs.org. The binder is a Node program.

On a phone or in a browser, the skills always answer questions about products. They reach your binder only when
that chat can reach your computer and the computer is on. When it cannot, they say so and save nothing.

**If you already added FrogCog lookups as a connector by itself,** you can skip step 3 above: Claude uses the one
you added. If you connect the plugin's own link as well, Claude has the same four questions twice and uses
either. To tidy up, keep one and remove the other.

## What Claude's page for this plugin says, and what each line means here

- **"Can run code without asking."** The plugin includes the binder, a program Claude starts on your computer. It
  is the files in `server/` and `lib/`, and nothing else. It reads and writes your FrogCog folder and its one
  settings file.
- **"Can send data to mcp.frogcog.com."** That is FrogCog lookups. Claude sends it a brand, a kind of device, a
  country or a month, and never anything about you or your records.
- **"Can also send data elsewhere."** A program on your computer could contact other places, and Claude's page
  warns of that. This one contacts three, and only after you switch on the check for possible safety recalls:
  `www.saferproducts.gov` or `www.gov.uk` with your items' brand names, and `frogcog.app` for one file that is
  the same for everyone. The next section lists everything.

## Everything this plugin runs, sends and fetches

**It runs** one program on your computer, `server/binder.mjs`, with the files in `lib/`. That is all of it:
there is nothing to install and nothing is downloaded. You can read every line.

**It keeps** your records in the folder you pick at set-up (`binder.json`, with your photos, receipts and
manuals under `files/`), and one small settings file that remembers where that folder is. No account. No copy
anywhere else.

**The program sends nothing**, with one exception that is off until you switch it on:

- **The check for possible safety recalls.** If you turn it on, the program sends each brand name in your
  binder, and nothing else, to the official public recall list for your country: `www.saferproducts.gov` (the US
  CPSC) or `www.gov.uk`. For the United States it also downloads one file from `frogcog.app`, FrogCog's published
  copy of the CPSC's safety warnings, the same file for everyone.

**The plugin also connects Claude to FrogCog lookups** (`https://mcp.frogcog.com/mcp`), a service of ours that
answers questions about products: how long a maker's warranty is, how often a kind of device needs upkeep, the
season's jobs, protection plan providers and their public ratings. Claude asks it with a brand, a kind of device, a
country or a month, each picked from a fixed list. It has no way to be sent a date, a model, a serial number, a
name or a receipt, and it keeps nothing.

**The answers are signed.** FrogCog lookups signs each answer about a maker's warranty or an upkeep job. The
program on your computer checks that signature against a public key in `lib/proof.mjs` before it works out a date,
and uses only the signed figures. So a figure that Claude miscopied, or one typed in by hand, is refused: you get
"unknown" instead of a wrong date. No setting switches this check off.

**Claude itself.** What you type, the photos you give Claude and what the binder tells Claude are handled by
Anthropic, the company that runs Claude, under its own terms. Your records are stored only on your computer; your
conversation about them is with Claude.

**A passphrase is never typed into the chat.** To lock a backup, you save the passphrase in a text file in the
binder's `inbox` folder; the program reads it and deletes the file.

## Whose words are whose

FrogCog gives records, dates and sources. Every figure comes from the maker's own page or a public body, with its
link; where FrogCog has no such source it says so and gives nothing. It is not legal, financial or safety advice.
Claude may add its own view in its own voice.

## Privacy and support

Privacy: https://frogcog.com/privacy/ . Support: https://frogcog.com/support/
