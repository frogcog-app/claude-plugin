---
name: register
description: See what registering an appliance with its maker needs, the last day to do it and what registering keeps, get the maker's own registration link and the details to copy, and record that it is done. Use when someone asks whether or how to register a product, or says they have registered one.
argument-hint: <item>
---
# Register with the maker

What the person said: $ARGUMENTS

FrogCog links to the maker's own page and lists what the form will ask for. The person registers themselves. FrogCog never fills in a maker's form, and cannot see the maker's records.

## Steps

1. Call `registration` with the item. It gives: where registration stands, what is still missing, the last day to register and what registering keeps (where the maker sets a deadline), the link, and each detail to copy. The deadline is worked out by the binder from the maker's own rule. Never work it out yourself.
2. If the binder has no maker's answer for this item (it says there is no deadline it has a source for, and the link is a web search), ask FrogCog lookups `warranty_terms` for the brand and the binder's country, pass the `proof` from its answer, exactly as it came, as `lookup` to `change_item`, and call `registration` again.
3. If details are missing, ask for them. The item's own (model, serial, shop, purchase date) go in with `change_item`. The owner's (name, email, address) go in with `set_profile`.
4. Give the person the link and the details to copy.
5. When they say they have opened the page or sent the form: `set_registration` with `started`.
6. Only when they say the maker has confirmed it: `set_registration` with `confirmed`. Never mark it confirmed on your own judgement. `not` clears both.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. FrogCog lookups can still say whether a maker asks for registration and by how many days. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).

## If FrogCog lookups is not there

If you have no `warranty_terms` tool, FrogCog lookups is not connected yet. Uploading the plugin does not switch its link to lookups on by itself, so the person does that once. Tell them: open the FrogCog plugin's page in Claude, press "Finish setup" if it shows, then "Connect" beside FrogCog-lookups. No sign-in is asked for. Until it is connected, never fill in a maker's figure, an interval or a list yourself: do what can be done without it (an item is saved with its warranty end unknown), and say that the rest needs lookups.
