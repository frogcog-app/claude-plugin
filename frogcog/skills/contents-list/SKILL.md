---
name: contents-list
description: Build a contents list of the home in FrogCog for insurance: every item by room with what was paid and the person's own estimate to buy it again, as a page to print and a spreadsheet. Use when someone wants a home inventory, a contents list, or to add furniture and belongings that are not appliances.
---
# The contents list

What the person said: $ARGUMENTS

The contents list is everything in the home worth listing for insurance: the appliances and devices already in the binder, and anything else the person adds (a sofa, a bike, jewellery).

## Steps

1. **To add something that is not an appliance:** `add_contents_item` with its name, room, how many, what was paid for one, and the person's own estimate of what one would cost to buy again. The estimate is theirs. Never suggest a value.
2. **To add a quantity or an estimate to an item already in the binder:** `change_item` with `quantity` or `estimate_to_buy_again`.
3. **To see the totals:** `list_rooms`. They are worked out by the binder; do not add them up yourself.
4. **To make the list:** `make_pack` with `insurance`. The binder writes a page to print and a spreadsheet file into its `exports` folder, with every item by room, the values, the receipt pictures it holds and the room photos. Tell the person where the files are, and to keep a copy somewhere that is not the house.
5. Pass on the binder's line: FrogCog keeps the records; what to insure and for how much is for them and their insurer.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
