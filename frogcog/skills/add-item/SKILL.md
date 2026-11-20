---
name: add-item
description: Add an appliance or device to the FrogCog binder and find out when the maker's warranty ends. Use when someone says they bought, own or want to record an appliance or device, for example "add my new Whirlpool fridge, bought 3 May".
argument-hint: <what it is> [brand] [purchase date] [model] [serial] [room]
---
# Add an appliance or device

What the person said: $ARGUMENTS

Two tools do the work, and you carry what the person said between them.

- **FrogCog lookups** (`warranty_terms`): how long a maker's own warranty runs. It takes a brand and a country, picked from its lists. Never send it a date, a model, a serial number or a name.
- **The binder** (`add_item`): saves the item and works out the dates.

## Steps

1. **Gather.** Take from what the person said: a name for the item, the brand, the purchase date, and any model, serial number, room, shop or price they gave. Ask only for the name if it is missing. Leave out anything they did not give. Do not guess a purchase date: if they gave a day and a month with no year, ask which year.
2. **Write each date as yyyy-mm-dd.**
3. **Ask the binder its country:** `binder_status`.
4. **Ask FrogCog lookups** `warranty_terms` with the brand, spelled as its list spells it, and the binder's country. Add the category only when the item is consumer electronics. If the brand is not on its list, or the answer says `"known": false`, there is no sourced figure: go on without one. Never fill in a typical length.
5. **Save** with `add_item`: the fields from step 1, and the `proof` from step 4's answer, exactly as it came, as `lookup`. The `proof` alone is enough; do not write the rest of the answer out again.
6. **Tell the person what the binder said,** every value it gave back: the name, the brand and model, the serial number, the room, the shop, the price, the purchase date, the day the maker's warranty ends and the maker's page it comes from, and the binder's own line that the maker's figures are signed by FrogCog lookups and were checked on this computer, shown as given. If there is no end date, say the warranty end is unknown and why. Say "unknown": never "no expiry" or "never expires".
7. If they have the receipt or a photo of the label, offer to keep it with the item (/frogcog:attach).

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. FrogCog lookups can still answer questions about a product: how long a maker's warranty is, how often a kind of device needs upkeep, the season's jobs.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).

## If FrogCog lookups is not there

If you have no `warranty_terms` tool, FrogCog lookups is not connected yet. Uploading the plugin does not switch its link to lookups on by itself, so the person does that once. Tell them: open the FrogCog plugin's page in Claude, press "Finish setup" if it shows, then "Connect" beside FrogCog-lookups. No sign-in is asked for. Until it is connected, never fill in a maker's figure, an interval or a list yourself: do what can be done without it (an item is saved with its warranty end unknown), and say that the rest needs lookups.
