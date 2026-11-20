---
name: calendar
description: Make a calendar file of every date in the FrogCog binder: warranties ending, registration deadlines, return windows, upkeep jobs and the seasons. Use when someone wants reminders, wants the dates in their calendar, or asks how they will be reminded.
---
# The calendar file

## Steps

1. Call `calendar_file`. The binder writes one file, `frogcog-reminders.ics`, into the binder folder, with every date and its alerts worked out by the binder.
2. Tell the person where the file is and how many entries it holds, and that they open it to add the entries to their own calendar (Outlook, Apple Calendar, Google Calendar).
3. Say plainly what this is: the calendar is the reminder. A plugin cannot send a notification or wake itself up. After adding or changing items, make the file again and open it again; the entries are updated, not doubled.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).
