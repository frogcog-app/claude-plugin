---
name: find-item
description: Find and list the items in the FrogCog binder: by name, brand, room, category or warranty status, with counts and the value still under warranty. Use when someone asks what they have, what is in a room, what is still under warranty, or wants to see one item.
argument-hint: [words] [room] [status]
---
# Find and list items

What the person asked: $ARGUMENTS

## Steps

1. Call `find_items` with what they asked for: words to look for, a room, a category, or a status (`active`, `soon`, `expired`, `none`, `unprotected`). With nothing, it lists everything.
2. Show the list as the binder gave it: each item with its warranty end date and status, then the counts and the value still under warranty. The statuses, the days left and the totals are worked out by the binder; do not recount them.
3. An item marked "Warranty end unknown" has no end date on file. Say it that way. It does not mean the warranty never ends.
4. For one item in full, call `show_item` with its id or its name: its details, where its end date comes from, the files kept with it and what is due for it.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
