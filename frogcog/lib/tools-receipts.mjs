/* FrogCog binder, stage 2: receipts, and the packs made from the records.
 *
 * FrogCog holds the home's receipts (purchases, repairs, upkeep, improvements) and sorts them so they can be
 * found at the right time. It gives no tax, legal or financial advice: the person picks each label, and every
 * pack says to check with an adviser. The receipt record and the packs are the app's own.
 */
import fs from 'node:fs';
import path from 'node:path';
import { obj, text, pick, DAY } from './schema.mjs';
import { change, read, told, APP_NAME } from './folder.mjs';
import { app, today, dayOr, one, money, plural } from './common.mjs';
import { filePath } from './tools-files.mjs';

const TYPES = app.RECEIPT_TYPES.map(t => t[0]);
const FIELDS = {
  title: text(200, 'What the receipt is for, for example "Boiler service" or "New roof".'),
  type: pick(TYPES, TYPES.join(', ') + '.'),
  date: { ...DAY, description: 'The date on the receipt, yyyy-mm-dd.' },
  amount: { type: 'number', minimum: 0 },
  store: text(120, 'The shop or company.'), who: text(120, 'Who did the work.'),
  label: text(40, 'The person\'s own label for it. They choose; never suggest one for tax.'),
  item: text(120, 'The id or exact name of the item it belongs to. Optional.'),
  text: text(20000, 'The receipt\'s words, when it came as text (an email, say).'),
  notes: text(2000),
};

function record(b, a, existing){
  const date = dayOr(a.date, 'receipt date');
  const itemId = a.item === undefined ? (existing && existing.itemId) : (a.item ? one(b.warranties, a.item, 'item').id : null);
  const f = { ...(existing || {}), ...Object.fromEntries(Object.entries({ title: a.title, type: a.type, store: a.store, who: a.who, label: a.label, text: a.text, notes: a.notes }).filter(([, v]) => v !== undefined)) };
  if (a.date !== undefined) f.date = date;
  f.amount = a.amount === undefined ? (existing && existing.amount != null ? String(existing.amount) : '') : String(a.amount);
  f.itemId = itemId || '';
  f.currency = (existing && existing.currency) || app.defaultCurrency(b.binder.country);
  const res = app.receiptRecord(f, existing || null, Date.now());
  if (res.error) throw told(res.error + ' Nothing was saved.');
  return res.record;
}
const line = (b, r) => [r.date || 'no date', app.receiptTypeLabel(r.type), r.title, r.amount == null ? '' : money(r.amount, r.currency || app.defaultCurrency(b.binder.country)), r.store || r.who || '', r.label ? 'label: ' + r.label : ''].filter(Boolean).join(', ');

export const receiptTools = [
  {
    name: 'add_receipt', title: 'Record a receipt',
    description: 'Records one receipt: a purchase, a repair, upkeep, an improvement to the home, a protection plan or another cost. Pass what the person gave or what was read off the receipt and confirmed by them. To keep the receipt\'s picture or PDF too, attach it afterwards with attach_file.',
    input: obj(FIELDS, ['title']),
    async run(a){
      return change(b => {
        const r = record(b, a, null);
        b.receipts.push(r);
        return { text: 'Receipt saved: ' + line(b, r) + '. Id ' + r.id + '.', data: { saved: r, receipts: b.receipts.length } };
      });
    },
  },
  {
    name: 'change_receipt', title: 'Change a receipt',
    description: 'Changes fields of one receipt. Pass only what changes.',
    input: obj({ receipt: text(200, 'The receipt\'s id, or its exact title.'), ...FIELDS }, ['receipt']),
    async run(a){
      return change(b => {
        const old = one(b.receipts, a.receipt, 'receipt', x => x.title);
        const r = record(b, a, old);
        b.receipts[b.receipts.indexOf(old)] = r;
        return { text: 'Receipt changed: ' + line(b, r) + '.', data: { saved: r } };
      });
    },
  },
  {
    name: 'remove_receipt', title: 'Remove a receipt', destructive: true,
    description: 'Takes one receipt record out of the binder and keeps it on the folder\'s "removed" list. Its files stay in the folder. Ask the person to confirm first.',
    input: obj({ receipt: text(200, 'The receipt\'s id, or its exact title.') }, ['receipt']),
    async run(a){
      return change(b => {
        const r = one(b.receipts, a.receipt, 'receipt', x => x.title);
        b.receipts = b.receipts.filter(x => x !== r);
        b.binder.removed.push({ at: today(), receipt: r });
        return { text: 'Removed the receipt "' + r.title + '". It is kept on the removed list.', data: { removed: r.id, receipts: b.receipts.length } };
      });
    },
  },
  {
    name: 'list_receipts', title: 'List receipts and totals', readOnly: true,
    description: 'Lists the receipts the binder holds, all of them or those for a year, a kind, a label or matching some words, with totals worked out here. Items that hold a receipt picture count as purchase receipts.',
    input: obj({ year: text(4, 'A year, for example 2026.'), type: pick(TYPES), label: text(40), query: text(80) }),
    async run(a){
      const { b } = read();
      const rows = app.filterReceiptRows(app.receiptRows({ warranties: b.warranties, maintenance: b.maintenance, receipts: b.receipts }), { year: a.year, type: a.type, label: a.label, q: a.query })
        .sort((x, y) => (y.date || '').localeCompare(x.date || ''));
      const cur = app.defaultCurrency(b.binder.country), t = app.receiptTotals(rows, cur);
      const totals = Object.entries(t.byCurrency).map(([c, v]) => money(v.total, c)).join(' + ');
      return { text: (rows.length ? plural(rows.length, 'receipt') + ':\n' + rows.map(r => '- ' + line(b, r) + (r.files ? ', ' + plural(r.files, 'file') : '') + '. Id ' + r.id).join('\n') + '\nTotal: ' + (totals || 'no amounts recorded') + (t.unpriced ? ' (' + t.unpriced + ' with no amount)' : '') + '.' : 'No receipt matches.') + '\n' + app.PACK_NOTE,
        data: { receipts: rows.map(r => ({ id: r.id, from: r.from, type: r.type, title: r.title, date: r.date, amount: r.amount, currency: r.currency || cur, store: r.store, label: r.label || '', item: r.itemName, files: r.files })), totals: t.byCurrency, years: app.receiptYears(rows) } };
    },
  },
  {
    name: 'make_pack', title: 'Make a pack of records for a purpose',
    description: 'Writes a pack into the binder folder\'s "exports" folder, as a page to print (HTML) and a spreadsheet file (CSV): "claim" (one item, ready for a warranty claim), "insurance" (the contents list: every item by room with its value), "sale" (every improvement to the home), or "year" (one year\'s receipts by kind). FrogCog gives no tax, legal or financial advice; each pack says to check with an adviser.',
    input: obj({ kind: pick(['claim', 'insurance', 'sale', 'year']), item: text(120, 'For a claim: the item\'s id or exact name.'), year: text(4, 'For a year: the year, for example 2026.') }, ['kind']),
    async run(a){
      const { b, dir } = read();
      const o = { region: b.binder.country, todayIso: today(), warranties: b.warranties, maintenance: b.maintenance, receipts: b.receipts, roomPhotos: b.roomPhotos };
      if (a.kind === 'claim') { if (!a.item) throw told('Which item is the claim for? Nothing was written.'); o.itemId = one(b.warranties, a.item, 'item').id; }
      if (a.kind === 'year') { if (!/^\d{4}$/.test(a.year || '')) throw told('Which year? Give it as four digits. Nothing was written.'); o.year = a.year; }
      const pack = app.packData(a.kind, o);
      if (!pack) throw told('That pack could not be made. Nothing was written.');
      const images = {};
      for (const k of pack.docKeys || []) { const f = b.binder.files[k], ext = f && path.extname(f.path).toLowerCase().slice(1), p = f && filePath(b, dir, k);
        if (f && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) && fs.existsSync(p)) images[k] = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + fs.readFileSync(p).toString('base64'); }
      fs.mkdirSync(path.join(dir, 'exports'), { recursive: true });
      // Named after the pack's own title: "frogcog-insurance-contents-list-2026-11-20". (The app's own name puts the
      // kind in front of the title as well, which doubles the word: "insurance-insurance-contents-list".)
      const stem = 'frogcog-' + String(pack.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + '-' + today();
      const html = path.join(dir, 'exports', stem + '.html'), csv = path.join(dir, 'exports', stem + '.csv');
      fs.writeFileSync(html, app.packHtml(pack, images, APP_NAME, today()));
      fs.writeFileSync(csv, '﻿' + app.toCsv(pack.columns, pack.rows));
      const totals = Object.entries(pack.totals || {}).map(([c, n]) => money(n, c)).join(' + ');
      return { text: pack.title + ': ' + plural(pack.rows.length, 'line') + (totals ? ', total ' + totals : '') + '.\nTo print: ' + html + '\nSpreadsheet: ' + csv + '\n' + app.PACK_NOTE,
        data: { title: pack.title, lines: pack.rows.length, totals: pack.totals || {}, page: html, spreadsheet: csv, pictures: Object.keys(images).length } };
    },
  },
];
