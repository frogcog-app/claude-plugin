/* FrogCog binder, stage 3: registration, upkeep, the seasonal checklist, repairs, contacts, protection plans and
 * the owner's details.
 *
 * The states are honest ones, as in the app: FrogCog cannot see a maker's or a provider's records, so
 * "registered", "repair booked" and "plan bought" are set only when the person says so. Until then they stay
 * "started". FrogCog links to the maker's page and never fills in a maker's form.
 */
import { obj, text, pick, DAY } from './schema.mjs';
import { change, read, told } from './folder.mjs';
import { app, today, dayOr, termFor, regRule, homeState, one, money, clip, plural, upkeepPreset, statusWord } from './common.mjs';
import { upkeepJob, seasonList } from './proof.mjs';
import { itemText, outsideText } from './tools-items.mjs';

const ITEM = text(120, 'The item\'s id, or its exact name.');
const search = q => 'https://www.google.com/search?q=' + encodeURIComponent(q);

/* ---------- the owner's details ---------- */
const PROFILE = { title: text(20), name: text(120), email: text(160), phone: text(40), address: text(200, 'Street address.'), city: text(80),
  state: text(60, 'State (US) or county (UK).'), zip: text(20, 'ZIP code or postcode.'), country: text(60) };
const owner = b => { const p = b.profile || {}; return { title: p.title || '', name: p.name || '', email: p.email || '', phone: p.phone || '', street: p.address || '', city: p.city || '', region: p.state || '', postcode: p.zip || '', country: p.country || '' }; };
/* An item's own registration details win over the profile, field by field (the app's recReg). */
const ownerFor = (b, w) => { const out = owner(b), r = w.reg || {}; for (const k in r) if (r[k] != null && String(r[k]).trim() !== '') out[k] = r[k]; return out; };

/* ---------- registration ---------- */
function regNeeds(b, w){
  const r = ownerFor(b, w), need = [];
  if (!w.model) need.push('model number');
  if (!w.serial) need.push('serial number');
  if (!w.purchased) need.push('purchase date');
  if (!w.store) need.push('retailer');
  if (!r.name) need.push('your name');
  if (!r.email) need.push('your email');
  if (!(r.postcode || r.street)) need.push('your address');
  return need;
}
function regLink(b, w){
  const t = termFor(b, w);
  if (w.regLink) return { link: w.regLink, kind: 'the maker\'s page (from the item)' };
  if (t && t.reg && t.reg.link) return { link: t.reg.link, kind: 'the maker\'s registration page' };
  return { link: search('register ' + (w.manufacturer || '') + ' warranty' + (b.binder.country === 'US' ? ' USA' : '') + ' ' + (w.model || '')), kind: 'a web search (FrogCog has no registration page for this maker here)' };
}

/* ---------- upkeep ---------- */
const presetsOf = b => Object.values(b.binder.lookups.upkeep);
function buyLink(b, m){
  const item = m.itemId ? b.warranties.find(w => w.id === m.itemId) : null;
  const t = app.buyTarget(m, presetsOf(b), item, b.binder.country);
  if (!t) return null;
  return t.kind === 'parts' ? { what: t.label, link: t.url, where: t.shop + (t.pickModel ? ' (pick the ' + t.label + ' for model ' + t.model + ')' : '') }
    : { what: t.label, link: app.amazonSearchUrl(t.query, b.binder.country, ''), where: 'Amazon search' };
}
/* When a job is due, in words, so nobody has to do anything with the number of days. */
const dueWords = d => (d === null ? '' : d < 0 ? 'overdue by ' + plural(-d, 'day') : d === 0 ? 'due today' : 'in ' + plural(d, 'day'));
function jobLine(b, m){
  const d = app.daysFromToday(m.nextDue), buy = buyLink(b, m);
  return m.title + (m.product ? ' (' + m.product + ')' : '') + ': every ' + plural(m.interval, 'month') + ', next due ' + m.nextDue + (d === null ? '' : ', ' + dueWords(d))
    + (m.lastDone ? ', last done ' + m.lastDone : '') + (m.dueBecause ? ', moved to due on ' + m.dueBecause.on + ' at the person\'s word (' + m.dueBecause.reading + ')' : '') + '. Id ' + m.id + (buy ? '\n  To buy the ' + buy.what + ': ' + buy.link + ' (' + buy.where + ')' : '');
}

/* ---------- protection plans ---------- */
function beforeYouBuy(b, w){
  const us = b.binder.country === 'US', out = [], st = app.warrantyStatus(w.expiry);
  if (st.key === 'soon') out.push('Still under the maker\'s warranty until ' + w.expiry + ' (' + app.daysWord(st.days) + '). You may not need to buy anything yet.');
  else if (st.key === 'none' && !w.noWarranty) out.push('No maker\'s end date is on file. Check whether the maker still covers it' + (us ? '' : ', and register it,') + ' before paying for anything.');
  if (w.purchased) { const d = app.daysFromToday(w.purchased); if (d !== null && d <= 0 && d > -183) out.push(us
    ? 'Bought recently? A fault now is likely the maker\'s warranty (and the retailer) to fix, and a protection plan is a service contract, not insurance. Written-warranty rights are protected federally (Magnuson-Moss).'
    : 'Bought under 6 months ago. Under the Consumer Rights Act a fault now is presumed the retailer\'s to fix free, so an extra warranty is likely redundant.'); }
  out.push(us ? 'Many US credit cards extend the maker\'s warranty for free on what you buy with them. Check your card\'s benefits before paying for a plan.'
    : 'Paid by credit card? For anything costing over £100 (up to £30,000), Section 75 of the Consumer Credit Act makes the card company jointly responsible if it turns out faulty. Worth knowing before paying for a plan.');
  const t = termFor(b, w);
  if (t && t.note && /regist/i.test(t.note) && /(up to|parts)/i.test(t.note) && !w.regConfirmed) out.push((w.manufacturer || 'The maker') + ' may extend your warranty for free if you register: ' + t.note + '. Worth doing first.');
  out.push('If you do buy, check what the plan pays when it can\'t fix something. Some pay out less than a new one costs.');
  return out;
}

export const careTools = [
  /* ---- the owner's details ---- */
  {
    name: 'set_profile', title: 'Save the owner\'s details',
    description: 'Saves the owner\'s details that makers\' registration forms ask for: name, email, phone and address. Pass only what the person gave. They are kept in the binder folder and used to list what a registration form needs.',
    input: obj(PROFILE),
    async run(a){
      return change(b => {
        for (const k of Object.keys(PROFILE)) if (a[k] !== undefined) b.profile[k] = clip(a[k], 200);
        const p = b.profile;
        return { text: 'Owner\'s details saved: ' + ([p.title, p.name].filter(Boolean).join(' ') || 'no name') + ', ' + (p.email || 'no email') + ', ' + (p.phone || 'no phone') + ', ' + ([p.address, p.city, p.state, p.zip, p.country].filter(Boolean).join(', ') || 'no address') + '.', data: { profile: p } };
      });
    },
  },
  {
    name: 'show_profile', title: 'Show the owner\'s details', readOnly: true,
    description: 'Shows the owner\'s details the binder holds.',
    input: obj({}),
    async run(){ const { b } = read(); const p = b.profile || {}; return { text: Object.keys(PROFILE).map(k => k + ': ' + (p[k] || 'not given')).join('\n'), data: { profile: p } }; },
  },

  /* ---- registration ---- */
  {
    name: 'registration', title: 'What registering an item needs', readOnly: true,
    description: 'For one item: whether it is registered with the maker, what is still missing before it can be, the last day to register and what registering keeps (where the maker sets a deadline), the link to the maker\'s own registration page, and each detail the form will ask for, ready to copy. FrogCog links to the maker\'s page; the person registers themselves.',
    input: obj({ item: ITEM }, ['item']),
    async run(a){
      const { b } = read();
      const w = one(b.warranties, a.item, 'item');
      const need = regNeeds(b, w), status = app.regStatusOf(w, () => need.length === 0), rule = regRule(b, w);
      const dl = app.registrationDeadline(w, rule, today(), homeState(b)), link = regLink(b, w), o = ownerFor(b, w), names = String(o.name || '').trim().split(/\s+/), al = app.addressLabels(b.binder.country);
      const rows = [['Manufacturer', w.manufacturer], ['Product', w.name], ['Model', w.model], ['Serial', w.serial], ['Retailer', w.store], ['Purchase date', w.purchased], ['Price', w.price == null ? '' : money(w.price, w.currency || app.defaultCurrency(b.binder.country))],
        ['Title', o.title], ['First name', names.length > 1 ? names.slice(0, -1).join(' ') : names[0] || ''], ['Last name', names.length > 1 ? names[names.length - 1] : ''], ['Email', o.email], ['Phone', o.phone],
        ['Street address', o.street], ['City', o.city], [al.region, o.region], [al.zip, o.postcode], ['Country', o.country]].filter(r => r[1]);
      const deadline = !dl ? 'The maker sets no registration deadline that FrogCog has a source for.'
        : dl.notRequired ? 'Registration is not needed in ' + dl.state + (dl.gives ? ' to keep ' + dl.gives : '') + '.'
        : dl.daysLeft < 0 ? 'The last day to register was ' + dl.date + (dl.gives ? ' (to keep ' + dl.gives + ')' : '') + '.'
        : 'Register by ' + dl.date + ' (' + plural(dl.daysLeft, 'day') + ' left)' + (dl.gives ? ' to keep ' + dl.gives : '') + '. Counted from the ' + (dl.counted === 'install' ? 'installation' : 'purchase') + ' date' + (dl.from && dl.from !== dl.counted ? ', because the binder has no ' + dl.from + ' date' : '') + '.';
      const state = status.key === 'confirmed' ? 'Registered (the person confirmed it on ' + w.regConfirmed + ').' : status.key === 'started' ? 'Registration started' + (w.regStarted ? ' on ' + w.regStarted : '') + ', not confirmed.' : status.key === 'none' ? 'Nothing to register.' : need.length ? 'Not registered. Still needed: ' + need.join(', ') + '.' : 'Not registered. Everything the form needs is here.';
      return { text: w.name + '\n' + state + '\n' + deadline + '\nWhere: ' + link.link + ' (' + link.kind + ')\nTo copy into the form:\n' + rows.map(r => '- ' + r[0] + ': ' + r[1]).join('\n') + (need.length ? '' : '\nA receipt is worth keeping on file; it is not needed to register.'),
        data: { item: w.id, state: status.key, missing: need, deadline: dl && !dl.notRequired ? { date: dl.date, days_left: dl.daysLeft, time_left: dl.daysLeft < 0 ? plural(-dl.daysLeft, 'day') + ' ago' : plural(dl.daysLeft, 'day') + ' left', keeps: dl.gives } : null, not_required_in: dl && dl.notRequired ? dl.state : null, link: link.link, link_is: link.kind, details: Object.fromEntries(rows) } };
    },
  },
  {
    name: 'set_registration', title: 'Record where registration stands',
    description: 'Records what the person did: "started" (they opened the maker\'s page or sent the form), "confirmed" (only when the person says the maker has registered it), or "not" to clear both. FrogCog cannot check with the maker, so it never marks an item registered by itself.',
    input: obj({ item: ITEM, state: pick(['started', 'confirmed', 'not']) }, ['item', 'state']),
    async run(a){
      return change(b => {
        const w = one(b.warranties, a.item, 'item');
        if (a.state === 'started') w.regStarted = w.regStarted || today();
        else if (a.state === 'confirmed') { w.regConfirmed = today(); w.regStarted = w.regStarted || today(); }
        else { delete w.regStarted; delete w.regConfirmed; delete w.registeredDone; }
        return { text: '"' + w.name + '": ' + (a.state === 'confirmed' ? 'marked registered, on the person\'s word, ' + w.regConfirmed + '.' : a.state === 'started' ? 'registration started ' + w.regStarted + '. It stays "started" until the person says the maker has confirmed it.' : 'registration cleared.'), data: { item: w.id, started: w.regStarted || null, confirmed: w.regConfirmed || null } };
      });
    },
  },

  /* ---- upkeep ---- */
  {
    name: 'add_upkeep', title: 'Add an upkeep job',
    description: 'Adds a repeating upkeep job (a filter change, an alarm test, a descale). For a job from FrogCog lookups, pass the upkeep_job answer\'s proof as lookup: its interval and its source come with it. For a job of the person\'s own, pass title and every_months as they gave them. The next due date is worked out here.',
    input: obj({
      lookup: { description: 'The "proof" from FrogCog lookups\' upkeep_job answer: the long text that starts fc1., passed on exactly as it came, every character. It holds the figures, signed, and is all the binder needs; the whole answer is taken too.' },
      title: text(120, 'The job, in the person\'s words, when it is their own.'),
      every_months: { type: 'integer', minimum: 1, maximum: 240, description: 'How often, in months, when the person gave their own interval.' },
      item: text(120, 'The id or exact name of the item it is for. Optional.'),
      last_done: { ...DAY, description: 'When it was last done, if the person said.' },
      detail: text(200, 'For example the filter size, in the person\'s words.'),
    }),
    async run(a){
      return change(b => {
        const item = a.item ? one(b.warranties, a.item, 'item') : null, last = dayOr(a.last_done, 'last-done date');
        let preset;
        if (a.lookup !== undefined && a.lookup !== null && a.lookup !== '') {
          const u = upkeepJob(a.lookup);
          if (u.country !== b.binder.country) throw told('That answer from FrogCog lookups is for ' + u.country + ', and this binder is set to ' + b.binder.country + '. Nothing was saved.');
          if (!u.known) throw told('FrogCog lookups has no sourced interval for that kind of device in this country. If the person has their own interval, pass title and every_months instead. Nothing was saved.');
          preset = upkeepPreset(u, a.detail ? clip(a.detail, 200) : '');
          b.binder.lookups.upkeep[preset.key] = preset;
        } else {
          const title = clip(a.title, 120);
          if (!title || !a.every_months) throw told('An upkeep job needs either the answer from FrogCog lookups, or a title and how often in months. Nothing was saved.');
          preset = { key: 'other', title, interval: a.every_months, spec: clip(a.detail, 200) };
        }
        const first = last ? app.iso(app.addMonths(app.parse(last), preset.interval)) : undefined;
        const m = item ? app.upkeepReminder(item, preset, today(), app.uid(), first)
          : { id: app.uid(), title: preset.title, product: '', spec: preset.spec || '', type: preset.key, interval: preset.interval, lastDone: '', nextDue: first || app.iso(app.addMonths(app.parse(today()), preset.interval)) };
        if (last) m.lastDone = last;
        b.maintenance.push(m);
        return { text: 'Upkeep job saved.\n' + jobLine(b, m) + (preset.src ? '\nSource for the interval: ' + preset.src : preset.key === 'other' ? '\nThe interval is the person\'s own.' : ''), data: { saved: m, source: preset.src || null } };
      });
    },
  },
  {
    name: 'list_upkeep', title: 'List upkeep jobs', readOnly: true,
    description: 'Lists every upkeep job with when it is next due, how many days that is from today, and a link to buy the right part where one applies. The dates and days are worked out here.',
    input: obj({ item: text(120, 'Only the jobs for this item (its id or exact name). Optional.') }),
    async run(a){
      const { b } = read();
      const id = a.item ? one(b.warranties, a.item, 'item').id : null;
      const jobs = b.maintenance.filter(m => !id || m.itemId === id).sort((x, y) => String(x.nextDue).localeCompare(String(y.nextDue)));
      return { text: 'Today is ' + today() + '.\n' + (jobs.length ? jobs.map(m => '- ' + jobLine(b, m)).join('\n') : 'No upkeep jobs yet.'),
        data: { today: today(), jobs: jobs.map(m => ({ id: m.id, title: m.title, for: m.product || '', every_months: m.interval, next_due: m.nextDue, days: app.daysFromToday(m.nextDue), due: dueWords(app.daysFromToday(m.nextDue)), last_done: m.lastDone || null, due_because: m.dueBecause || null, buy: buyLink(b, m) })) } };
    },
  },
  {
    name: 'upkeep_done', title: 'Mark an upkeep job done',
    description: 'Marks one upkeep job done, today or on the day the person gives, and works out the next due date from it.',
    input: obj({ job: text(120, 'The job\'s id, or its exact title.'), done_on: { ...DAY, description: 'The day it was done, if not today.' } }, ['job']),
    async run(a){
      return change(b => {
        const m = one(b.maintenance, a.job, 'upkeep job', x => x.title), on = dayOr(a.done_on, 'done-on date') || today();
        m.lastDone = on; m.nextDue = app.iso(app.addMonths(app.parse(on), m.interval)); delete m.dueBecause;
        return { text: 'Done on ' + on + '.\n' + jobLine(b, m), data: { saved: m } };
      });
    },
  },
  {
    name: 'upkeep_due_now', title: 'Move an upkeep job to due now, at the person\'s word',
    description: 'Moves one upkeep job to due today because a reading says it is needed, for example a hub\'s "filter life 5%" or a battery warning, or the person noticed it. Only when the person has said to: FrogCog counts months, and a reading never moves a job by itself. Records what was said. When the job is done, upkeep_done counts the next one from that day.',
    input: obj({
      job: text(120, 'The job\'s id, or its exact title.'),
      reading: text(200, 'What the reading or the person said, for example "Filter life 5%".'),
      person_agreed: { type: 'boolean', description: 'True only when the person has said to move this job to due now.' },
    }, ['job', 'reading', 'person_agreed']),
    async run(a){
      if (a.person_agreed !== true) throw told('Only the person can move a job to due now: ask them first. Nothing was changed.');
      return change(b => {
        const m = one(b.maintenance, a.job, 'upkeep job', x => x.title), reading = outsideText(a.reading, 200);
        if (!reading) throw told('Say what the reading or the person said. Nothing was changed.');
        m.nextDue = today(); m.dueBecause = { on: today(), reading };
        return { text: 'Moved to due today.\n' + jobLine(b, m), data: { saved: m } };
      });
    },
  },
  {
    name: 'change_upkeep', title: 'Change or remove an upkeep job', destructive: true,
    description: 'Removes or changes one upkeep job: its title, how often it comes round, its detail or its next due date, as the person gives them; or removes the job to the folder\'s "removed" list when remove is true (ask the person first).',
    input: obj({ job: text(120, 'The job\'s id, or its exact title.'), title: text(120), every_months: { type: 'integer', minimum: 1, maximum: 240 }, next_due: DAY, detail: text(200), remove: { type: 'boolean' } }, ['job']),
    async run(a){
      return change(b => {
        const m = one(b.maintenance, a.job, 'upkeep job', x => x.title);
        if (a.remove) { b.maintenance = b.maintenance.filter(x => x !== m); b.binder.removed.push({ at: today(), upkeep: [m] }); return { text: 'Removed the upkeep job "' + m.title + '". It is kept on the removed list.', data: { removed: m.id } }; }
        if (a.title !== undefined) { const t = clip(a.title, 120); if (!t) throw told('A job needs a title. Nothing was changed.'); m.title = t; }
        if (a.detail !== undefined) m.spec = clip(a.detail, 200);
        if (a.every_months !== undefined) { m.interval = a.every_months; if (a.next_due === undefined) m.nextDue = app.iso(app.addMonths(app.parse(m.lastDone || today()), m.interval)); }
        if (a.next_due !== undefined) m.nextDue = dayOr(a.next_due, 'next-due date') || m.nextDue;
        return { text: 'Changed.\n' + jobLine(b, m), data: { saved: m } };
      });
    },
  },

  /* ---- the seasonal checklist ---- */
  {
    name: 'season_jobs', title: 'The season\'s home checklist',
    description: 'Call it with nothing to learn today\'s month, season and country. Then ask FrogCog lookups seasonal_checklist for that country and month, and call this again with that whole answer as lookup: it returns each job with whether the person has ticked or hidden it.',
    input: obj({ lookup: { description: 'The whole answer from FrogCog lookups seasonal_checklist, passed on unchanged.' } }),
    readOnly: true,
    async run(a){
      const { b } = read();
      const s = app.seasonOf(today()), st = app.seasonalState(b.seasonal), month = Number(today().slice(5, 7)), label = app.seasonLabel(s.name, b.binder.country);
      const base = { today: today(), month, country: b.binder.country, season: label, season_id: s.id, days_left_in_season: s.daysLeft, checklist_on: !st.off };
      if (a.lookup === undefined || a.lookup === null || a.lookup === '') return { text: 'It is ' + label + ' (month ' + month + ', ' + b.binder.country + ')' + (st.off ? '. The seasonal checklist is switched off in this binder.' : '. Ask FrogCog lookups seasonal_checklist for country ' + b.binder.country + ' and month ' + month + ', then pass its answer here.'), data: base };
      const answer = seasonList(a.lookup);
      if (answer.country !== b.binder.country || answer.season !== s.name) throw told('That list is for ' + (answer.season || 'another season') + ' in ' + (answer.country || 'another country') + '. It is ' + s.name + ' here: ask lookups for ' + b.binder.country + ', month ' + month + '.');
      const done = st.done[s.id] || {};
      // A job is ticked by its key, the app's own. An older lookups service gives none: then the job's own words
      // stand in ("t-test-your-smoke-alarms"), so the list still works; such ticks are the binder's alone.
      const keyOf = j => /^[\w-]{1,40}$/.test(j.key || '') ? j.key : 't-' + String(j.job || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 38);
      const jobs = (Array.isArray(answer.jobs) ? answer.jobs : []).filter(j => j && typeof j.job === 'string' && j.job.trim()).map(j => ({ ...j, key: keyOf(j) })).map(j => ({ key: j.key, job: clip(String(j.job || ''), 160), why: clip(String(j.why || ''), 300),
        sources: (Array.isArray(j.sources) ? j.sources : []).filter(x => typeof x === 'string' && /^https:\/\//.test(x)).slice(0, 4), done_on: done[j.key] || null, hidden: st.hide.includes(j.key) }));
      const shown = jobs.filter(j => !j.hidden);
      return { text: label + ' checklist, ' + shown.filter(j => j.done_on).length + ' of ' + shown.length + ' done:\n' + shown.map(j => '- [' + (j.done_on ? 'done ' + j.done_on : ' ') + '] ' + j.job + (j.why ? ' ' + j.why : '') + (j.sources[0] ? ' Source: ' + j.sources[0] : '') + ' (key ' + j.key + ')').join('\n')
          + (jobs.length > shown.length ? '\nHidden: ' + jobs.filter(j => j.hidden).map(j => j.job).join('; ') + '.' : ''), data: { ...base, jobs } };
    },
  },
  {
    name: 'season_tick', title: 'Tick or hide a seasonal job',
    description: 'Records what the person did with one job on this season\'s checklist: "done", "undo", "hide" (it does not fit their home) or "show". Or switches the whole checklist "off" or "on". The job is named by its key, as season_jobs gives it.',
    input: obj({ what: pick(['done', 'undo', 'hide', 'show', 'off', 'on']), key: { type: 'string', pattern: '^[\\w-]{1,40}$', description: 'The job\'s key from season_jobs. Not needed for off or on.' } }, ['what']),
    async run(a){
      return change(b => {
        const s = app.seasonOf(today());
        if (a.what === 'off' || a.what === 'on') { const st = app.seasonalState(b.seasonal); st.off = a.what === 'off'; b.seasonal = st; return { text: 'The seasonal checklist is ' + a.what + '.', data: { checklist_on: !st.off } }; }
        if (!a.key) throw told('Which job? Give its key from season_jobs. Nothing was changed.');
        b.seasonal = a.what === 'done' ? app.tickSeasonal(b.seasonal, s.id, a.key, today()) : a.what === 'undo' ? app.untickSeasonal(b.seasonal, s.id, a.key) : a.what === 'hide' ? app.hideSeasonal(b.seasonal, a.key) : app.unhideSeasonal(b.seasonal, a.key);
        return { text: 'Noted: ' + a.key + ' ' + ({ done: 'done ' + today(), undo: 'not done', hide: 'hidden', show: 'shown again' })[a.what] + '.', data: { season_id: s.id, key: a.key, what: a.what } };
      });
    },
  },

  /* ---- repairs ---- */
  {
    name: 'repair_help', title: 'Ways to get an item fixed', readOnly: true,
    description: 'For one item: whether the maker\'s warranty or a protection plan still applies, the link to the maker\'s own repair page, the person\'s own contacts, a free repair-guide search (iFixit) for doing it themselves, a local repair search, and what repairs have cost so far. A repair by someone else may cost money that the warranty would have covered: say so when it is still under warranty.',
    input: obj({ item: ITEM, problem: text(80, 'What is wrong, or an error code, in a few words. Optional.') }, ['item']),
    async run(a){
      const { b } = read();
      const w = one(b.warranties, a.item, 'item'), st = app.displayStatus(w), t = termFor(b, w), us = b.binder.country === 'US';
      const under = st.key === 'active' || st.key === 'soon', viaPlan = st.via === 'plan';
      const maker = (t && t.service) ? { link: t.service, kind: 'the maker\'s repair page' } : { link: search('book a repair ' + (w.manufacturer || '') + ' warranty service' + (us ? ' USA' : ' UK') + ' ' + (w.model || '')), kind: 'a web search for the maker\'s service' };
      const guide = app.ifixitSearchUrl(app.repairGuideQuery(w, a.problem)), local = search((w.name || w.category || 'appliance') + ' repair near me' + (us ? ' USA' : ' UK'));
      const costs = Object.entries(app.repairCostsFor(b.receipts, w.id)).map(([c, n]) => money(n, c || app.defaultCurrency(b.binder.country))).join(' + ');
      const people = b.contacts.map(c => ({ name: c.name, trade: c.trade || '', phone: c.phone || '', call: app.telHref(c.phone) || null }));
      const lines = [w.name + ': ' + (viaPlan ? 'covered by the protection plan with ' + w.plan.provider + (w.plan.phone ? ', claims phone ' + w.plan.phone : '') + (w.plan.ref ? ', plan number ' + w.plan.ref : '') + '.' : under ? 'still under the maker\'s warranty until ' + w.expiry + '. The maker\'s repair is the free one; someone else may charge for what the warranty covers.' : st.key === 'expired' ? 'the maker\'s warranty ended ' + w.expiry + '.' : 'no warranty end date on file.')];
      if (!viaPlan) lines.push((under ? 'Book with the maker: ' : 'The maker\'s service: ') + maker.link + ' (' + maker.kind + ')');
      lines.push('Details they will ask for: ' + [w.manufacturer, w.model && 'model ' + w.model, w.serial && 'serial ' + w.serial, w.purchased && 'bought ' + w.purchased].filter(Boolean).join(', ') + '.');
      if (people.length) lines.push('Someone you know: ' + people.map(p => p.name + (p.trade ? ' (' + p.trade + ')' : '') + (p.phone ? ' ' + p.phone : '')).join('; ') + '.');
      lines.push('Fix it yourself (free guides, iFixit): ' + guide);
      if (!under) lines.push('Find a local repairer: ' + local);
      if (costs) lines.push('Repairs recorded for it so far: ' + costs + '.');
      if (w.repair && w.repair.started) lines.push('A repair was started ' + w.repair.started + (w.repair.booked ? ' and is booked.' : ' and is not confirmed as booked.'));
      return { text: lines.join('\n'), data: { item: w.id, under_makers_warranty: under && !viaPlan, plan: viaPlan ? w.plan : null, makers_service: maker.link, makers_service_is: maker.kind, repair_guides: guide, local_search: under ? null : local, contacts: people, repair_costs: costs || null, repair: w.repair || null } };
    },
  },
  {
    name: 'set_repair', title: 'Record where a repair stands',
    description: 'Records what the person did about a repair: "started" (they contacted the maker or a repairer), "booked" (only when the person says a visit is booked), or "clear" once it is over. FrogCog cannot see a maker\'s bookings, so it never marks one booked by itself.',
    input: obj({ item: ITEM, state: pick(['started', 'booked', 'clear']), fault: text(200, 'What is wrong, in the person\'s words.') }, ['item', 'state']),
    async run(a){
      return change(b => {
        const w = one(b.warranties, a.item, 'item');
        if (a.state === 'clear') delete w.repair;
        else { w.repair = Object.assign({ fault: '', started: today(), booked: false }, w.repair || {}); if (a.fault !== undefined) w.repair.fault = clip(a.fault, 200); if (a.state === 'booked') { w.repair.booked = true; w.repair.bookedAt = today(); } }
        return { text: '"' + w.name + '": ' + (a.state === 'clear' ? 'repair cleared.' : a.state === 'booked' ? 'repair booked, on the person\'s word, ' + today() + '.' : 'repair started ' + w.repair.started + '. It stays "started" until the person says a visit is booked.'), data: { item: w.id, repair: w.repair || null } };
      });
    },
  },

  /* ---- contacts ---- */
  {
    name: 'save_contact', title: 'Add or change a service contact',
    description: 'Saves someone who fixes the home (a plumber, an electrician, an appliance repairer): name, trade, company, phone, email, notes. Pass contact to change one that is already there; leave it out to add a new one.',
    input: obj({ contact: text(120, 'To change one: its id or exact name.'), name: text(120), trade: text(60), company: text(120), phone: text(40), email: text(160), notes: text(2000) }),
    async run(a){
      return change(b => {
        let c = a.contact ? one(b.contacts, a.contact, 'contact') : null;
        if (!c) { if (!clip(a.name, 120)) throw told('A contact needs a name. Nothing was saved.'); c = { id: app.uid(), createdAt: Date.now(), name: '', trade: '', company: '', phone: '', email: '', notes: '' }; b.contacts.push(c); }
        for (const k of ['name', 'trade', 'company', 'phone', 'email', 'notes']) if (a[k] !== undefined) c[k] = clip(a[k], k === 'notes' ? 2000 : 160);
        if (!c.name) throw told('A contact needs a name. Nothing was saved.');
        return { text: 'Contact saved: ' + c.name + (c.trade ? ', ' + c.trade : '') + (c.company ? ', ' + c.company : '') + (c.phone ? ', ' + c.phone : '') + (c.email ? ', ' + c.email : '') + '. Id ' + c.id + '.', data: { saved: c, call: app.telHref(c.phone) || null } };
      });
    },
  },
  {
    name: 'list_contacts', title: 'List service contacts', readOnly: true,
    description: 'Lists the people who fix the home, with a phone link for each that has a number that can be dialled.',
    input: obj({ trade: text(60, 'Only this trade. Optional.') }),
    async run(a){
      const { b } = read();
      const list = b.contacts.filter(c => !a.trade || String(c.trade || '').toLowerCase().includes(a.trade.trim().toLowerCase()));
      return { text: list.length ? list.map(c => '- ' + c.name + (c.trade ? ' (' + c.trade + ')' : '') + (c.company ? ', ' + c.company : '') + (c.phone ? ', ' + c.phone : '') + (c.email ? ', ' + c.email : '') + (c.notes ? '. ' + c.notes : '') + '. Id ' + c.id).join('\n') : 'No contacts yet.',
        data: { contacts: list.map(c => ({ id: c.id, name: c.name, trade: c.trade, company: c.company, phone: c.phone, email: c.email, notes: c.notes, call: app.telHref(c.phone) || null })) } };
    },
  },
  {
    name: 'remove_contact', title: 'Remove a service contact', destructive: true,
    description: 'Takes one contact out of the binder and keeps it on the folder\'s "removed" list. Ask the person to confirm first.',
    input: obj({ contact: text(120, 'The contact\'s id or exact name.') }, ['contact']),
    async run(a){
      return change(b => {
        const c = one(b.contacts, a.contact, 'contact');
        b.contacts = b.contacts.filter(x => x !== c); b.binder.removed.push({ at: today(), contact: c });
        return { text: 'Removed the contact "' + c.name + '". It is kept on the removed list.', data: { removed: c.id } };
      });
    },
  },

  /* ---- protection plans ---- */
  {
    name: 'set_plan', title: 'Record a protection plan the person holds',
    description: 'Records a protection plan or extended warranty the person already has, bought anywhere: for one item, or for the whole home when whole_home is true. Only the provider is needed; the end date, plan number and claims phone are optional. Pass an empty provider to clear it. FrogCog cannot check with a provider: this is the person\'s own record.',
    input: obj({ item: text(120, 'The item\'s id or exact name. Leave out for a whole-home plan.'), whole_home: { type: 'boolean' }, provider: text(80), ends: { ...DAY, description: 'The day the plan ends, if known.' }, plan_number: text(60), claims_phone: text(40) }, ['provider']),
    async run(a){
      return change(b => {
        const w = a.whole_home ? null : one(b.warranties, a.item, 'item'), existing = w ? w.plan : b.homePlan;
        const res = app.planFromForm(existing || null, { provider: a.provider, ends: dayOr(a.ends, 'plan end date'), ref: a.plan_number, phone: a.claims_phone }, today());
        if (res.error) throw told(res.error + ' Nothing was saved.');
        if (w) { if (res.plan) w.plan = res.plan; else delete w.plan; } else b.homePlan = res.plan || null;
        const p = res.plan;
        return { text: (w ? '"' + w.name + '"' : 'The whole home') + ': ' + (p ? 'protection plan with ' + p.provider + (p.ends ? ', ends ' + p.ends : ', no end date given') + (p.ref ? ', plan number ' + p.ref : '') + (p.phone ? ', claims phone ' + p.phone : '') + '.' : 'no protection plan recorded.') + (w ? '\n' + itemText(b, w) : ''), data: { plan: p || null, item: w ? w.id : null } };
      });
    },
  },
  {
    name: 'protection_overview', title: 'Which items a protection plan might suit', readOnly: true,
    description: 'Lists the items whose maker\'s warranty has ended, is ending or is unknown, with any plan already held and the whole-home plan, and for one item the checks worth making before buying anything. It names no provider: for providers and their public ratings ask FrogCog lookups protection_plans. FrogCog supplies the data and the person chooses.',
    input: obj({ item: text(120, 'One item\'s id or exact name, for its before-you-buy checks. Optional.') }),
    async run(a){
      const { b } = read();
      const one_ = a.item ? one(b.warranties, a.item, 'item') : null;
      const list = b.warranties.filter(w => !w.contents && app.planEligible(w)).sort((x, y) => app.planUrgency(x) - app.planUrgency(y));
      const hp = b.homePlan && b.homePlan.state === 'purchased' ? b.homePlan : null;
      const row = w => '- ' + w.name + ': ' + statusWord(w) + (w.expiry ? ' (maker\'s warranty ' + (app.warrantyStatus(w.expiry).key === 'expired' ? 'ended ' : 'ends ') + w.expiry + ')' : '') + (w.plan && w.plan.state === 'purchased' ? ', plan with ' + w.plan.provider + (w.plan.ends ? ' to ' + w.plan.ends : '') : '') + '. Id ' + w.id;
      const checks = one_ ? beforeYouBuy(b, one_) : [];
      return { text: (hp ? 'Whole-home plan: ' + hp.provider + (hp.ends ? ', ends ' + hp.ends : '') + '.\n' : 'No whole-home plan recorded.\n') + (list.length ? 'Items a plan might suit:\n' + list.map(row).join('\n') : 'No item\'s warranty has ended, is ending or is unknown.')
          + (one_ ? '\nBefore you buy, for "' + one_.name + '":\n' + checks.map(c => '- ' + c).join('\n') : '') + '\nFor providers and their public ratings, ask FrogCog lookups protection_plans (country ' + b.binder.country + ', for one item or for the whole home).',
        data: { whole_home_plan: hp, items: list.map(w => ({ id: w.id, name: w.name, status: statusWord(w), warranty_ends: w.expiry || null, plan: w.plan && w.plan.state === 'purchased' ? w.plan : null })), before_you_buy: checks, country: b.binder.country } };
    },
  },
];
