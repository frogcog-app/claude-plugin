---
name: repair
description: Get an appliance fixed: see whether the maker's warranty or a protection plan still applies, get the maker's own repair page, the person's own repair contacts, free repair guides, and record where a repair stands. Use when something is broken, shows an error, or someone asks who to call.
argument-hint: <item> [what is wrong]
---
# Get something fixed

What the person said: $ARGUMENTS

## Steps

1. Call `repair_help` with the item and, in a few words, what is wrong or the error code.
2. Lead with what the binder leads with:
   - **Still under the maker's warranty:** the maker's repair is the free one. Give the maker's page and the details they will ask for. Say that someone else may charge for what the warranty would have paid for.
   - **A protection plan in force:** the plan's provider, its claims phone and the plan number.
   - **Neither:** the person's own contacts (`list_contacts`), the repair guides, and the local search.
3. Give the "fix it yourself" link as what it is: a search of free guides at iFixit. What a guide says about safety is the guide's; mains electricity and gas are not jobs to talk someone into.
4. When they say they have contacted someone: `set_repair` with `started` and what is wrong. When they say a visit is booked: `booked`. When it is over: `clear`. Never mark it booked on your own judgement.
5. A repair bill is a receipt worth keeping: /frogcog:receipts.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
