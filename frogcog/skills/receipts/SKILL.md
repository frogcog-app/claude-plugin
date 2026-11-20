---
name: receipts
description: Record the home's receipts in the FrogCog binder (purchases, repairs, upkeep, improvements), list and total them, and make a pack for a warranty claim, a home sale or a year. Use when someone wants to record a receipt, find one, see what they spent, or get their receipts together.
argument-hint: [add | list | pack] ...
---
# Receipts

What the person said: $ARGUMENTS

FrogCog holds the receipts and sorts them so they can be found at the right time. It gives no tax, legal or financial advice, and neither should you in its name: the person picks each label, and every pack says to check with an adviser.

## Steps

- **To record one:** `add_receipt` with what it is for, the kind (purchase, repair, upkeep, improvement, plan, other), the date as yyyy-mm-dd, the amount, the shop or who did the work, and the item it belongs to if there is one. If you read these off a picture, show them to the person to confirm first. A label is theirs to choose: do not suggest one for tax.
- **To keep the receipt's picture or PDF:** it has to be in the binder's `inbox` folder; then `attach_file` with the receipt record.
- **To correct or remove one:** `change_receipt`; `remove_receipt` after the person confirms (it goes to the removed list).
- **To list and total:** `list_receipts`, for a year, a kind, a label or some words. The totals are worked out by the binder. Do not add them up yourself.
- **To get them together:** `make_pack` writes a page to print and a spreadsheet file: `claim` (one item, for a warranty claim), `sale` (every improvement to the home), `year` (one year's receipts). Tell the person where the files are, and pass on the line about checking with an adviser.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
