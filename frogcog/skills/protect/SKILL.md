---
name: protect
description: Protection plans and extended warranties in FrogCog: record a plan the person already holds, see which items' maker warranties have ended or are ending, read the checks worth making before buying, and see providers with their public ratings. Use when someone asks about an extended warranty or protection plan, or says they bought one.
argument-hint: [item]
---
# Protection plans

What the person said: $ARGUMENTS

FrogCog supplies the data and the person chooses. Do not rank providers, recommend one, or say a plan is or is not worth buying in FrogCog's name.

## A plan they already hold

`set_plan` with the item (or `whole_home` true), the provider, and the end date, plan number and claims phone if they gave them. Only the provider is needed. An empty provider clears it. It is the person's own record; FrogCog cannot check with a provider.

## Thinking about one

1. Call `protection_overview`, with an item if they named one. It lists the items whose maker's warranty has ended, is ending or is unknown, and for one item the checks worth making before buying anything.
2. Give those checks first, as the binder wrote them. They are there to stop someone paying for what they already have.
3. For providers: ask FrogCog lookups `protection_plans` with the binder's country and `item` or `home`. Show them in the order given, each with its own public rating, how it is regulated and its note, then the sentence about the links as given.
4. If they buy one, record it with `set_plan`.

## Rules

- The binder works out every date and every count of days. Never work out a date, a deadline or a number of days yourself: pass on what the person said and read back what the binder returns.
- Where the binder says how long is left in words ("5 months left", "in 12 days"), use its words as they are. Do not turn a number of days into months or years yourself, and do not add "about".
- Show the person what the binder says it saved, in its words, so a misheard value is seen.
- An answer from FrogCog lookups about a warranty or an upkeep job has a field called `proof`: one long piece of text that starts `fc1.` and holds the same figures, signed by FrogCog. That is all the binder needs. Pass the `proof` on as `lookup`, exactly as it came, every character; do not copy out the rest of the answer. The binder uses only the signed figures. If it says an answer is not signed or was changed on the way, ask FrogCog lookups again and pass the new `proof` on. Never type a figure in yourself.
- FrogCog gives records, dates and sources. Anything you add beyond what the tools returned is your own view, not FrogCog's; say so. FrogCog does not give legal, financial or safety advice.

## If the binder is not there

Call `binder_status` first. If there is no such tool, the binder is not available here. It is a small program on the person's own computer: it is there in the Claude desktop app and in Claude Code on that computer, with Node installed (nodejs.org), and in a chat on a phone or in a browser only when that chat can reach the computer and the computer is on. Say that in a sentence or two. FrogCog lookups can still list protection plan providers and their public ratings. On a phone, the FrogCog app does this: frogcog.com.

If `binder_status` says the binder is not set up, do the set-up first (/frogcog:set-up).

## If FrogCog lookups is not there

If you have no `warranty_terms` tool, FrogCog lookups is not connected yet. Uploading the plugin does not switch its link to lookups on by itself, so the person does that once. Tell them: open the FrogCog plugin's page in Claude, press "Finish setup" if it shows, then "Connect" beside FrogCog-lookups. No sign-in is asked for. Until it is connected, never fill in a maker's figure, an interval or a list yourself: do what can be done without it (an item is saved with its warranty end unknown), and say that the rest needs lookups.
