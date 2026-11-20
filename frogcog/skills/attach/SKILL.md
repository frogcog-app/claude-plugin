---
name: attach
description: Keep a photo, a receipt or a manual with an item in the FrogCog binder, or take one off. Use when someone wants to file a receipt, a photo of an appliance or its label, or a manual PDF with their records.
argument-hint: <file> <item>
---
# Keep a photo, receipt or manual

What the person said: $ARGUMENTS

The binder keeps files in its own folder on this computer. It cannot take a file out of the chat, so the file has to be on the computer first.

## Steps

1. Ask the person to save the file into the binder's `inbox` folder, or to give its full path. `list_files` shows what is waiting in the inbox and where the inbox is.
2. Call `attach_file` with the file, what it is (`photo`, `receipt`, `manual` or `room photo`), and the item it belongs to. A manual has to be a PDF. A receipt can also go with a receipt record (/frogcog:receipts).
3. Tell the person what the binder filed and where. A file from the inbox is moved into the binder; a file from elsewhere is copied.
4. To take a file off an item: `list_files` with the item shows each file's label; `detach_file` puts that file back in the inbox. Nothing is deleted.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
