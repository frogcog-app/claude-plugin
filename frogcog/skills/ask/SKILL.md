---
name: ask
description: Ask FrogCog about a product, with no binder needed: how long a maker's warranty is, whether to register and by when, how often a kind of device needs upkeep, the home jobs for the season, and protection plan providers with their public ratings. Use when someone asks a question about a brand or a kind of appliance. Works on a computer, in a browser and on a phone.
argument-hint: <a question about a product>
---
# Ask FrogCog about a product

What the person asked: $ARGUMENTS

FrogCog lookups answers four kinds of question, for the United States and the United Kingdom. Every input is a pick from its lists. Never send it a date, a model, a serial number or a name, and it does not need them.

| The question | The tool | What it takes |
|---|---|---|
| How long is a maker's warranty? Must I register, and by when? | `warranty_terms` | a brand, a country |
| How often does this need upkeep, and what do I buy for it? | `upkeep_job` | a kind of device, a country |
| What should I do around the home this season? | `seasonal_checklist` | a country, a month |
| Who sells protection plans? | `protection_plans` | a country, one item or the whole home |

## Steps

1. If the country is not clear from what they said, ask: the United States or the United Kingdom.
2. Call the tool that fits.
3. Give the answer with its source link. When the answer says `"known": false`, FrogCog has no sourced figure: say so, and do not estimate one.
4. For protection plans, show the providers in the order given, with each one's own public rating, and the sentence about the links as given. Nothing is ranked or recommended: FrogCog supplies the data and the person chooses.
5. A warranty end date for their own purchase needs a sum. Never work out the end date yourself. With the binder set up (/frogcog:set-up), adding the item works it out; without it, say the length and let them count from their purchase date.
6. Anything you add beyond the answer is your own view; say so.

## If FrogCog lookups is not there

If you have no `warranty_terms` tool, FrogCog lookups is not connected yet. Uploading the plugin does not switch its link to lookups on by itself, so the person does that once. Tell them: open the FrogCog plugin's page in Claude, press "Finish setup" if it shows, then "Connect" beside FrogCog-lookups. No sign-in is asked for. Until it is connected, never fill in a maker's figure, an interval or a list yourself: do what can be done without it (an item is saved with its warranty end unknown), and say that the rest needs lookups.
