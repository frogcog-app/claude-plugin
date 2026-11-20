---
name: seasonal
description: The season's home checklist in FrogCog: a short list of home jobs for the time of year, each with its public source, which the person ticks off or hides. Use when someone asks what to do around the home this season, this month or before winter.
---
# The season's home checklist

## Steps

1. Call `season_jobs` with nothing. It gives today's month, the season and the binder's country. Do not work out the month or the season yourself.
2. Ask FrogCog lookups `seasonal_checklist` with that country and that month.
3. Call `season_jobs` again with that whole answer, unchanged, as `lookup`. This answer has no `proof`: the season's list is not signed, so the whole answer is what the binder needs. It returns each job with whether the person has ticked it or hidden it.
4. Show the list: each job, why, its source link, and what is done. Timing depends on where the person lives; a job that does not fit their home can be hidden.
5. When they say a job is done, or does not apply: `season_tick` with `done`, `undo`, `hide` or `show`, and the job's key. `off` and `on` switch the whole checklist.
6. The four seasons' dates are in the calendar file (/frogcog:calendar).

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. FrogCog lookups can still give the season's jobs for a country and a month; ask the person which month it is where they are. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).

## If FrogCog lookups is not there

If you have no `warranty_terms` tool, FrogCog lookups is not connected yet. Uploading the plugin does not switch its link to lookups on by itself, so the person does that once. Tell them: open the FrogCog plugin's page in Claude, press "Finish setup" if it shows, then "Connect" beside FrogCog-lookups. No sign-in is asked for. Until it is connected, never fill in a maker's figure, an interval or a list yourself: do what can be done without it (an item is saved with its warranty end unknown), and say that the rest needs lookups.
