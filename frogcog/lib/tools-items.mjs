/* FrogCog binder, stage 1: items, what is due, and the calendar file.
 *
 * An item is saved in the shape the app saves it, so a backup moves between the two. Every date is worked out
 * here, by the app's own code; the AI tool only carries what the person said.
 */
import fs from 'node:fs';
import path from 'node:path';
import { obj, text, pick, DAY } from './schema.mjs';
import { change, read, told } from './folder.mjs';
import { app, today, dayOr, warrantyEnd, sameMaker, termFor, keepTerm, regRule, homeState, one, money, clip, plural, statusWord } from './common.mjs';
import { makerTerm } from './proof.mjs';

const LOOKUP = { description: 'The "proof" from FrogCog lookups\' warranty_terms answer for this brand and country: the long text that starts fc1., passed on exactly as it came, every character. It holds the maker\'s figures, signed, and is all the binder needs; the whole answer is taken too. A missing or changed proof is refused. Leave out when the brand is not on lookups\' list.' };
const FIELDS = {
  name: text(120, 'What the person calls it, for example "Kitchen fridge".'),
  brand: text(80, 'The maker. Use the spelling from FrogCog lookups\' list when the maker is on it.'),
  category: text(60, 'For example "Appliances" or "Consumer Electronics".'),
  model: text(80), serial: text(80), store: text(80, 'Where it was bought.'), room: text(60), notes: text(2000),
  purchased: { ...DAY, description: 'The purchase date, yyyy-mm-dd. Leave out if not known; never guess it.' },
  installed: { ...DAY, description: 'The installation date, when the person gave one.' },
  return_by: { ...DAY, description: 'The last day to return it, when the person gave one.' },
  warranty_ends: { ...DAY, description: 'Only when the person read an end date off their own paperwork. Never work one out: leave it out and the binder does the sum.' },
  price: { type: 'number', minimum: 0 },
  quantity: { type: 'integer', minimum: 1, maximum: 9999, description: 'How many, for the contents list.' },
  estimate_to_buy_again: { type: 'number', minimum: 0, description: 'The person\'s own estimate of what one would cost to buy again. Never suggest one.' },
  no_warranty: { type: 'boolean', description: 'True when the person says it has no warranty at all (an old or second-hand item with no dates).' },
  lookup: LOOKUP,
};

const SIGNED_LINE = 'The maker\'s figures are signed by FrogCog lookups, and the signature was checked on this computer.';

/* Take the maker's answer for this item, if one was passed, and keep it with the binder. */
function takeTerm(b, w, lookup){
  if (lookup === undefined || lookup === null || lookup === '') return null;
  const t = makerTerm(lookup);
  if (t.country !== b.binder.country) throw told('That answer from FrogCog lookups is for ' + t.country + ', and this binder is set to ' + b.binder.country + '. Ask lookups for ' + b.binder.country + '. Nothing was saved.');
  if (!sameMaker(t.brand, w.manufacturer)) throw told('That answer from FrogCog lookups is for ' + (t.brand || 'another maker') + ', and this item\'s maker is ' + (w.manufacturer || 'not given') + '. Nothing was saved.');
  keepTerm(b, w, t);
  return t;
}

/* What the person is told about one item: exactly what is saved, and where each date comes from. */
export function itemView(b, w){
  const st = app.displayStatus(w), t = termFor(b, w), cur = w.currency || app.defaultCurrency(b.binder.country);
  const fromMaker = !!(t && t.years && w.purchased && warrantyEnd(w.purchased, t.years) === w.expiry);
  return {
    id: w.id, name: w.name, brand: w.manufacturer || '', model: w.model || '', serial: w.serial || '', category: w.category || '', room: w.location || '',
    store: w.store || '', purchased: w.purchased || null, installed: w.installed || null, return_by: w.returnBy || null,
    warranty_ends: w.expiry || null, status: statusWord(w), days_left: st.days === undefined ? null : st.days,
    end_date_from: w.expiry ? (fromMaker ? 'the maker\'s ' + t.years + (t.years === 1 ? ' year' : ' years') + ' from the purchase date' : 'entered by the person') : null,
    // How long is left, in the app's own words ("5 months left"), so nobody has to turn the days into months.
    time_left: st.days === undefined ? null : app.daysWord(st.days),
    maker_source: t && t.source ? t.source : null, maker_note: t && t.note ? t.note : null, maker_answer_signed: !!(t && t.trust === 'signed' && t.proof),
    // A line to show the person as it stands, when the maker's figures came from a signed answer.
    maker_answer_note: (t && t.trust === 'signed' && t.proof) ? SIGNED_LINE : null,
    price: w.price == null ? null : money(w.price, cur), notes: w.notes || '',
    plan: w.plan && w.plan.state === 'purchased' ? { provider: w.plan.provider, ends: w.plan.ends || null } : null,
    files: (w.docs || []).length, manual: w.manual ? w.manual.name : null, contents_item: !!w.contents,
  };
}
export function itemText(b, w){
  const v = itemView(b, w), lines = [v.name + (v.brand ? ' (' + [v.brand, v.model].filter(Boolean).join(' ') + ')' : '') + (v.room ? ', ' + v.room : '') + '. Id ' + v.id + '.'];
  lines.push('Bought: ' + (v.purchased || 'not given') + (v.store ? ' at ' + v.store : '') + '.');
  // Every value the person gave is read back in words, so a misheard one is seen: the price and the serial number too.
  const given = [v.serial && 'Serial number: ' + v.serial, v.price && 'Price: ' + v.price, w.qty > 1 && 'Quantity: ' + w.qty,
    w.replaceEst != null && 'Your estimate to buy it again: ' + money(w.replaceEst, w.currency || app.defaultCurrency(b.binder.country)), v.installed && 'Installed: ' + v.installed].filter(Boolean);
  if (given.length) lines.push(given.join('. ') + '.');
  if (v.warranty_ends) lines.push('Warranty ends: ' + v.warranty_ends + ' (' + v.end_date_from + '). ' + v.status + (v.days_left === null ? '' : ', ' + app.daysWord(v.days_left)) + '.');
  else if (w.noWarranty) lines.push('No warranty.');
  else if (!w.contents) {
    const t = termFor(b, w);
    lines.push('Warranty end: unknown. ' + (t && t.years ? 'The maker gives ' + t.years + (t.years === 1 ? ' year' : ' years') + ', and there is no purchase date to count from.' : 'There is no sourced warranty length for this maker here.'));
  }
  if (v.maker_source) lines.push('Maker\'s source: ' + v.maker_source + (v.maker_note ? ' (' + v.maker_note + ')' : '') + (v.maker_answer_note ? '\n' + v.maker_answer_note : ''));
  if (v.return_by) lines.push('Return by: ' + v.return_by + '.');
  if (v.plan) lines.push('Protection plan: ' + v.plan.provider + (v.plan.ends ? ', ends ' + v.plan.ends : '') + '.');
  return lines.join('\n');
}

function applyFields(b, w, a, isNew){
  const set = (k, v) => { if (v !== undefined) w[k] = v; };
  if (a.name !== undefined) { const n = clip(a.name, 120); if (!n) throw told('An item needs a name. Nothing was saved.'); w.name = n; }
  set('manufacturer', a.brand === undefined ? undefined : clip(a.brand, 80));
  set('category', a.category === undefined ? undefined : (clip(a.category, 60) || 'Appliances'));
  set('model', a.model === undefined ? undefined : clip(a.model, 80));
  set('serial', a.serial === undefined ? undefined : clip(a.serial, 80));
  set('store', a.store === undefined ? undefined : clip(a.store, 80));
  set('location', a.room === undefined ? undefined : clip(a.room, 60));
  set('notes', a.notes === undefined ? undefined : clip(a.notes, 2000));
  const before = { purchased: w.purchased || '', expiry: w.expiry || '' }, oldTerm = isNew ? null : termFor(b, w);
  if (a.purchased !== undefined) w.purchased = dayOr(a.purchased, 'purchase date');
  if (a.installed !== undefined) { const d = dayOr(a.installed, 'installation date'); if (d) w.installed = d; else delete w.installed; }
  if (a.return_by !== undefined) { const d = dayOr(a.return_by, 'return-by date'); if (d) w.returnBy = d; else delete w.returnBy; }
  if (a.price !== undefined) { if (a.price === null) delete w.price; else { w.price = Math.round(a.price * 100) / 100; w.currency = w.currency || app.defaultCurrency(b.binder.country); } }
  if (a.quantity !== undefined) { if (a.quantity > 1) w.qty = a.quantity; else delete w.qty; }
  if (a.estimate_to_buy_again !== undefined) { w.replaceEst = Math.round(a.estimate_to_buy_again * 100) / 100; w.currency = w.currency || app.defaultCurrency(b.binder.country); }
  const term = takeTerm(b, w, a.lookup) || termFor(b, w);
  // The end date. A date the person read off their own paperwork wins. Otherwise it is the maker's years from the
  // purchase date, and it follows the purchase date when that changes, unless the person had set their own.
  if (a.warranty_ends !== undefined) w.expiry = dayOr(a.warranty_ends, 'warranty end date');
  else {
    const wasMakers = !before.expiry || (oldTerm && oldTerm.years && warrantyEnd(before.purchased, oldTerm.years) === before.expiry);
    if (wasMakers) w.expiry = (term && term.years) ? warrantyEnd(w.purchased, term.years) : (before.expiry && !w.purchased ? '' : before.expiry);
  }
  if (a.no_warranty !== undefined) { if (a.no_warranty && !w.expiry && !w.purchased) w.noWarranty = true; else delete w.noWarranty; }
  if (w.noWarranty && (w.expiry || w.purchased)) delete w.noWarranty;
  return term;
}

function matches(w, a, b){
  if (a.kind === 'contents' ? !w.contents : a.kind === 'appliances' ? !!w.contents : false) return false;
  if (a.room && String(w.location || '').toLowerCase() !== a.room.trim().toLowerCase()) return false;
  if (a.category && String(w.category || '').toLowerCase() !== a.category.trim().toLowerCase()) return false;
  if (a.status && app.displayStatus(w).key !== a.status) return false;
  if (a.query) { const q = a.query.trim().toLowerCase(); if (![w.name, w.manufacturer, w.model, w.serial, w.location, w.category, w.store, w.notes].some(x => String(x || '').toLowerCase().includes(q))) return false; }
  return true;
}

/* Every dated thing in the binder, as the app's "what's due" builds it. */
export function dueNow(b, recallRows){
  return app.dueItems({ todayIso: today(), warranties: b.warranties, maintenance: b.maintenance, recalls: recallRows || [], recallOptInKnown: true,
    region: b.binder.country, regRule: w => regRule(b, w), homeState: homeState(b) });
}

export function calendarEvents(b){
  const ws = b.warranties, region = b.binder.country, st = homeState(b);
  return [...ws.map(app.warrantyEvent), ...ws.map(app.planEvent), ...ws.map(w => (app.returnWindow(w) ? app.returnEvent(w) : null)),
    ...ws.map(w => app.regEvent(w, regRule(b, w), undefined, st)), ...b.maintenance.map(app.maintEvent),
    ...(app.seasonalState(b.seasonal).off ? [] : app.seasonEvents(region))].filter(Boolean);
}

export const itemTools = [
  {
    name: 'add_item', title: 'Add an appliance or device',
    description: 'Saves one appliance or device in the binder and works out when the maker\'s warranty ends. Pass the purchase date as yyyy-mm-dd and, when FrogCog lookups gave an answer for the brand, that answer\'s proof as lookup. The end date is worked out here. Answers with exactly what was saved.',
    input: obj(FIELDS, ['name']),
    async run(a){
      return change(b => {
        const w = { id: app.uid(), type: 'warranty', name: '', category: 'Appliances', location: '', manufacturer: '', store: '', model: '', serial: '', purchased: '', expiry: '', price: null, notes: '', source: 'manual', registered: false, createdAt: Date.now() };
        applyFields(b, w, a, true);
        if (w.price === null) delete w.price;
        b.warranties.push(w);
        return { text: 'Saved.\n' + itemText(b, w), data: { saved: itemView(b, w), items: b.warranties.length } };
      });
    },
  },
  {
    name: 'change_item', title: 'Change an item',
    description: 'Changes fields of one item. Pass only what changes. When the purchase date changes, the maker\'s warranty end date is worked out again here. Answers with the item as it now stands.',
    input: obj({ item: text(120, 'The item\'s id, or its exact name.'), ...FIELDS }, ['item']),
    async run(a){
      return change(b => {
        const w = one(b.warranties, a.item, 'item');
        applyFields(b, w, a, false);
        return { text: 'Changed.\n' + itemText(b, w), data: { saved: itemView(b, w) } };
      });
    },
  },
  {
    name: 'find_items', title: 'Find and list items', readOnly: true,
    description: 'Lists the items in the binder, all of them or those that match: words in the name, brand, model or notes; a room; a category; a warranty status. Gives each item\'s id, warranty end date and status, the counts, and the value still under warranty.',
    input: obj({ query: text(80), room: text(60), category: text(60),
      status: pick(['active', 'soon', 'expired', 'none', 'unprotected'], 'active, soon (60 days or fewer left), expired, none (no end date), unprotected.'),
      kind: pick(['all', 'appliances', 'contents'], 'appliances and devices, the contents list, or all. Default: all.') }),
    async run(a){
      const { b } = read();
      const hits = b.warranties.filter(w => matches(w, a, b));
      const counts = { active: 0, soon: 0, expired: 0, none: 0, unprotected: 0 };
      for (const w of b.warranties) { const k = app.displayStatus(w).key; if (k in counts) counts[k]++; }
      const cv = app.coveredValue(b.warranties, b.binder.country);
      const value = Object.entries(cv.by).map(([c, n]) => money(n, c)).join(' + ') || 'none recorded';
      const lines = hits.map(w => { const v = itemView(b, w); return '- ' + v.name + (v.brand ? ' (' + v.brand + ')' : '') + (v.room ? ', ' + v.room : '') + ': ' + (v.warranty_ends ? 'warranty ends ' + v.warranty_ends + ', ' + v.status : v.status || 'warranty end unknown') + '. Id ' + v.id; });
      return { text: (hits.length ? plural(hits.length, 'item') + ':\n' + lines.join('\n') : 'No item matches.') + '\nIn the whole binder: ' + plural(b.warranties.length, 'item') + '; ' + counts.active + ' under warranty, ' + counts.soon + ' ending within 60 days, ' + counts.expired + ' expired, ' + counts.none + ' with the warranty end unknown. Value still under warranty: ' + value + '.',
        data: { items: hits.map(w => itemView(b, w)), counts, value_under_warranty: cv.by } };
    },
  },
  {
    name: 'show_item', title: 'Show one item', readOnly: true,
    description: 'Shows everything the binder holds about one item: its details, dates, where the end date comes from, files kept with it and what is due for it.',
    input: obj({ item: text(120, 'The item\'s id, or its exact name.') }, ['item']),
    async run(a){
      const { b } = read();
      const w = one(b.warranties, a.item, 'item');
      const due = dueNow(b).rows.filter(r => r.id === w.id);
      const files = (w.docs || []).map(d => ({ label: d.label, file: (b.binder.files[d.k] || {}).path || null }));
      return { text: itemText(b, w) + (w.notes ? '\nNotes: ' + w.notes : '') + (files.length ? '\nFiles: ' + files.map(f => f.label + (f.file ? ' (' + f.file + ')' : '')).join('; ') : '')
          + (w.manual ? '\nManual: ' + w.manual.name : '') + (due.length ? '\nDue: ' + due.map(r => r.sub).join('; ') : ''),
        data: { item: itemView(b, w), files, due } };
    },
  },
  {
    name: 'remove_item', title: 'Remove an item', destructive: true,
    description: 'Takes one item out of the binder and keeps it on the folder\'s "removed" list, from where restore_item brings it back. Its upkeep jobs go with it. Ask the person to confirm first.',
    input: obj({ item: text(120, 'The item\'s id, or its exact name.') }, ['item']),
    async run(a){
      return change(b => {
        const w = one(b.warranties, a.item, 'item');
        const jobs = b.maintenance.filter(m => m.itemId === w.id);
        b.warranties = b.warranties.filter(x => x !== w);
        b.maintenance = b.maintenance.filter(m => m.itemId !== w.id);
        b.binder.removed.push({ at: today(), item: w, upkeep: jobs });
        return { text: 'Removed "' + w.name + '"' + (jobs.length ? ' and ' + plural(jobs.length, 'upkeep job') : '') + '. It is on the removed list (id ' + w.id + ') and can be brought back.', data: { removed: w.id, items: b.warranties.length } };
      });
    },
  },
  {
    name: 'restore_item', title: 'Bring back a removed item',
    description: 'Lists the removed items when called with nothing, or brings one back into the binder with its upkeep jobs.',
    input: obj({ item: text(120, 'The removed item\'s id, or its exact name. Leave out to list them.') }),
    async run(a){
      if (!a.item) { const { b } = read(); const l = b.binder.removed; return { text: l.length ? 'Removed items:\n' + l.map(r => '- ' + r.item.name + ', removed ' + r.at + '. Id ' + r.item.id).join('\n') : 'Nothing has been removed.', data: { removed: l.map(r => ({ id: r.item.id, name: r.item.name, at: r.at })) } }; }
      return change(b => {
        const r = one(b.binder.removed.map(x => ({ id: x.item.id, name: x.item.name, x })), a.item, 'removed item').x;
        b.binder.removed = b.binder.removed.filter(x => x !== r);
        b.warranties.push(r.item); b.maintenance.push(...(r.upkeep || []));
        return { text: 'Brought back.\n' + itemText(b, r.item), data: { saved: itemView(b, r.item) } };
      });
    },
  },
  {
    name: 'whats_due', title: 'What is due', readOnly: true,
    description: 'Lists what needs the person now and what is coming up: warranties ending, return windows closing, registration deadlines, upkeep jobs, and possible recalls already found. Every date and count of days is worked out here.',
    input: obj({}),
    async run(){
      const { b } = read();
      const rec = (b.binder.recalls.state ? app.activeRecallMatches(b.binder.recalls.state, b.warranties) : []).map(m => m.kind === 'warning'
        ? { key: m.key, title: 'Safety warning: ' + (m.name || ''), sub: 'The CPSC says to stop using it' } : { key: m.key, title: 'Possible recall: ' + (m.name || ''), sub: m.title || '' });
      const d = dueNow(b, rec), label = ['Needs you now', 'Coming up', 'Upcoming', 'One-time setup'];
      const rows = d.rows.filter(r => r.kind !== 'setup');
      const out = [0, 1, 2].map(u => { const rs = rows.filter(r => r.urgency === u); return rs.length ? label[u] + ':\n' + rs.map(r => '- ' + r.title + ': ' + r.sub).join('\n') : ''; }).filter(Boolean);
      return { text: 'Today is ' + today() + '.\n' + (out.length ? out.join('\n') : 'Nothing is due.'), data: { today: today(), rows: rows.map(r => ({ kind: r.kind, urgency: label[r.urgency], days: r.days, id: r.id || null, title: r.title, detail: r.sub })) } };
    },
  },
  {
    name: 'renewal_decision', title: 'Decide about an ended warranty',
    description: 'Records what the person decided about an item whose warranty has ended or is ending: "dismiss" (they will live without one; it stops being raised), "later" (ask again), or "clear" to undo.',
    input: obj({ item: text(120, 'The item\'s id, or its exact name.'), decision: pick(['dismiss', 'later', 'clear']) }, ['item', 'decision']),
    async run(a){
      return change(b => {
        const w = one(b.warranties, a.item, 'item');
        if (a.decision === 'clear') delete w.decision; else w.decision = { type: a.decision, expiry: w.expiry || '' };
        return { text: (a.decision === 'dismiss' ? 'Noted: no warranty wanted for "' + w.name + '". It will not be raised again.' : a.decision === 'later' ? 'Noted: "' + w.name + '" will come up again.' : 'Cleared.') + '\n' + itemText(b, w), data: { saved: itemView(b, w) } };
      });
    },
  },
  {
    name: 'calendar_file', title: 'Make the calendar file',
    description: 'Writes one calendar file (.ics) into the binder folder holding every date: warranties ending, protection plans ending, return windows, registration deadlines, upkeep jobs and the four seasons. The person opens the file to add the dates to their own calendar; that is the reminder that arrives with everything closed.',
    input: obj({}),
    async run(){
      const { b, dir } = read();
      const events = calendarEvents(b);
      if (!events.length) return { text: 'There is no date in the binder to put in a calendar yet. No file was written.', data: { events: 0 } };
      const file = path.join(dir, app.exportFilename('reminders'));
      fs.writeFileSync(file, app.buildICS(events));
      return { text: 'Calendar file written: ' + file + '\n' + plural(events.length, 'entry', 'entries') + '. Open the file to add them to your calendar. Opening it again later replaces the entries; it does not double them.', data: { file, events: events.length } };
    },
  },
];
