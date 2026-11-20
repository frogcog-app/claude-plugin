---
name: rooms
description: See the FrogCog binder by room: what is in each room, the value still under warranty there, and photos of the room. Use when someone asks what is in a room, wants to rename a room, move an item, or keep a photo of a room.
argument-hint: [room]
---
# Rooms

What the person said: $ARGUMENTS

## Steps

- **To see the rooms:** `list_rooms`: each room with its items, the value still under warranty there and how many photos are kept. The sums are worked out by the binder. For one room's items in full: `find_items` with the room.
- **To put an item in a room, or move it:** `change_item` with the item and the room.
- **To rename a room:** `rename_room`. Every item in it and its photos follow.
- **To keep a photo of a room** (useful for an insurance claim): the picture goes into the binder's `inbox` folder, then `attach_file` with `room photo` and the room.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
