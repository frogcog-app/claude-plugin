/* FrogCog binder: small things every tool uses. The sums are the app's own (app-core.mjs); nothing here guesses. */
import * as app from './app-core.mjs';
import { told } from './folder.mjs';
export { app };

export const today = () => app.iso(app.today0());

/* A real calendar day written yyyy-mm-dd, or null. 30 February is not a day: it is refused, never rolled on. */
export function realDay(s){
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = app.parse(s);
  return (d && !isNaN(d) && app.iso(d) === s) ? s : null;
}
export function dayOr(s, what){
  if (s === undefined || s === null || s === '') return '';
  const d = realDay(s);
  if (!d) throw told('The ' + what + ' "' + String(s).slice(0, 40) + '" is not a real day written yyyy-mm-dd. Nothing was saved.');
  return d;
}

/* The end of the maker's warranty: the purchase day plus the maker's years, the app's own way (29 Feb + 1 year is
   28 Feb). Empty when either is missing, so an end date that can't be worked out is shown as unknown. */
export function warrantyEnd(purchased, years){
  if (!realDay(purchased) || typeof years !== 'number' || !(years > 0)) return '';
  return app.iso(app.addMonths(app.parse(purchased), years * 12));
}

/* Is a maker's answer for this item's maker? The same name, or one names the other as a word of its own, by the
   app's rule (brandNamed: LG and GE only in capitals). "Samsung Electronics Co., Ltd" (how a hub may give it) is
   Samsung, and is not GE: plain "contains" let GE's answer through for it until 2026-11-21. */
const squash = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const sameMaker = (a, b) => { const x = squash(a), y = squash(b); return !!x && !!y && (x === y || app.brandNamed(b, a) || app.brandNamed(a, b)); };

/* The maker's answer kept for an item's brand (and category, where the maker gives one its own length). */
const termKey = (brand, category) => String(brand || '').trim().toLowerCase() + '|' + (category || '');
export function termFor(b, w){
  if (!w || !w.manufacturer) return null;
  const T = b.binder.lookups.terms;
  return T[termKey(w.manufacturer, w.category)] || T[termKey(w.manufacturer, '')] || null;
}
export function keepTerm(b, w, term){ b.binder.lookups.terms[termKey(w.manufacturer, term.category)] = term; }
/* An upkeep answer from lookups, as the app's own upkeep code wants it. `detail` is the person's own words, when
   they gave some (a filter size). The proof stays with it, so the answer can be checked again in another binder. */
export const upkeepPreset = (u, detail) => ({ key: u.appliance, label: u.label, title: u.job, interval: u.every_months, buy: u.buy || undefined,
  byModel: u.byModel || undefined, spec: detail || u.detail, src: u.source, trust: u.trust, proof: u.proof });
export const regRule = (b, w) => { const t = termFor(b, w); return (t && t.reg && t.reg.days) ? { days: t.reg.days, from: t.reg.from, gives: t.reg.gives, notIn: t.reg.notIn } : null; };
export const homeState = b => (b.binder.country === 'US' ? ((b.profile && b.profile.state) || '') : '');

/* Find one record by its id, or by its exact name when only one has it. */
export function one(list, ref, what, nameOf = x => x.name){
  const r = String(ref || '').trim();
  let hit = list.find(x => x.id === r);
  if (!hit) { const same = list.filter(x => String(nameOf(x) || '').trim().toLowerCase() === r.toLowerCase()); if (same.length === 1) hit = same[0]; else if (same.length > 1) throw told('More than one ' + what + ' is called "' + r + '". Use the id instead: ' + same.map(x => x.id).join(', ') + '. Nothing was changed.'); }
  if (!hit) throw told('No ' + what + ' with the id or name "' + r.slice(0, 80) + '" is in the binder. Nothing was changed.');
  return hit;
}

/* An item's status, in words a person cannot misread. The app's label for an item with no end date is "No expiry",
   which reads as "never expires"; here it is said as what it is. Every other label is the app's own. */
export const statusWord = w => { const st = app.displayStatus(w); return (st.key === 'none' && st.label === 'No expiry') ? 'Warranty end unknown' : st.label; };

export const money = (n, cur) => (n === null || n === undefined) ? '' : (cur || '') + Number(n).toFixed(2);
export const clip = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const plural = (n, word, words) => n + ' ' + (n === 1 ? word : (words || word + 's'));
