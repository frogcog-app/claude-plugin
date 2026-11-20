/* FrogCog binder, stage 4: rooms and the contents list.
 *
 * A room is the room written on an item. The contents list is everything in the home that is worth listing for
 * insurance, appliance or not (a sofa, a bike), with what was paid and the person's own estimate of what it would
 * cost to buy again. The printed list is make_pack with kind "insurance".
 */
import { obj, text, DAY } from './schema.mjs';
import { change, read, told } from './folder.mjs';
import { app, dayOr, clip, money, plural } from './common.mjs';
import { itemText, itemView } from './tools-items.mjs';

const sums = by => Object.entries(by).map(([c, n]) => money(n, c)).join(' + ');

export const roomTools = [
  {
    name: 'list_rooms', title: 'Rooms and what is in them', readOnly: true,
    description: 'Lists each room with how many items are in it, the value still under warranty there, and how many photos of the room are kept; then the contents list\'s totals: what was paid and the person\'s own estimates to buy again. All sums are worked out here.',
    input: obj({}),
    async run(){
      const { b } = read();
      const rooms = {};
      for (const w of b.warranties) (rooms[w.location || 'Unassigned'] = rooms[w.location || 'Unassigned'] || []).push(w);
      for (const r of Object.keys(b.roomPhotos || {})) rooms[r] = rooms[r] || [];
      const names = Object.keys(rooms).sort((x, y) => (x === 'Unassigned') - (y === 'Unassigned') || x.localeCompare(y));
      const cur = app.defaultCurrency(b.binder.country), fix = by => Object.fromEntries(Object.entries(by).map(([c, n]) => [c || cur, n]));
      const out = names.map(n => ({ room: n, items: rooms[n].length, under_warranty: fix(app.coveredValue(rooms[n], b.binder.country).by), photos: ((b.roomPhotos || {})[n] || []).length, names: rooms[n].map(w => w.name) }));
      const t = app.contentsTotals(b.warranties);
      return { text: (out.length ? out.map(r => '- ' + r.room + ': ' + plural(r.items, 'item') + (sums(r.under_warranty) ? ', ' + sums(r.under_warranty) + ' still under warranty' : '') + (r.photos ? ', ' + plural(r.photos, 'photo') : '') + (r.names.length ? ' (' + r.names.join(', ') + ')' : '')).join('\n') : 'No rooms yet: give an item a room.')
          + '\nContents list: ' + plural(t.items, 'line') + ', ' + t.count + ' things. Paid: ' + (sums(fix(t.paid)) || 'nothing recorded') + '. Your estimates to buy again: ' + (sums(fix(t.estimate)) || 'none given') + '.',
        data: { rooms: out, contents: { lines: t.items, things: t.count, paid: fix(t.paid), estimate_to_buy_again: fix(t.estimate) } } };
    },
  },
  {
    name: 'rename_room', title: 'Rename a room',
    description: 'Renames a room on every item in it and on its photos.',
    input: obj({ from: text(60), to: text(60) }, ['from', 'to']),
    async run(a){
      return change(b => {
        const from = a.from.trim(), to = clip(a.to, 60);
        if (!to) throw told('The room needs a new name. Nothing was changed.');
        const hits = b.warranties.filter(w => String(w.location || '').toLowerCase() === from.toLowerCase());
        const key = Object.keys(b.roomPhotos || {}).find(k => k.toLowerCase() === from.toLowerCase());
        if (!hits.length && !key) throw told('No item or photo is in a room called "' + from + '". Nothing was changed.');
        hits.forEach(w => { w.location = to; });
        if (key && key !== to) { b.roomPhotos[to] = (b.roomPhotos[to] || []).concat(b.roomPhotos[key]); delete b.roomPhotos[key]; }
        return { text: 'Renamed "' + from + '" to "' + to + '": ' + plural(hits.length, 'item') + '.', data: { room: to, items: hits.length } };
      });
    },
  },
  {
    name: 'add_contents_item', title: 'Add something to the contents list',
    description: 'Adds one thing in the home that is not an appliance or device with a warranty (a sofa, a bike, jewellery) to the contents list, with what was paid and the person\'s own estimate of what it would cost to buy again. Never suggest a value: the estimate is the person\'s.',
    input: obj({
      name: text(200), category: text(60, 'For example "Furniture". Optional.'), room: text(120), brand: text(120),
      quantity: { type: 'integer', minimum: 1, maximum: 9999 }, price: { type: 'number', minimum: 0, description: 'What was paid for one.' },
      estimate_to_buy_again: { type: 'number', minimum: 0, description: 'The person\'s own estimate for one.' },
      purchased: { ...DAY, description: 'The purchase date, if known.' }, notes: text(2000),
    }, ['name']),
    async run(a){
      return change(b => {
        const res = app.contentsItem({ name: a.name, category: a.category, location: a.room, manufacturer: a.brand, qty: a.quantity, price: a.price, replaceEst: a.estimate_to_buy_again, purchased: dayOr(a.purchased, 'purchase date'), notes: a.notes }, b.binder.country, Date.now());
        if (res.error) throw told(res.error + ' Nothing was saved.');
        b.warranties.push(res.record);
        const w = res.record, cur = w.currency;
        return { text: 'Added to the contents list: ' + w.name + (w.location ? ', ' + w.location : '') + ', quantity ' + w.qty + (w.price != null ? ', paid ' + money(w.price, cur) + ' each' : '') + (w.replaceEst != null ? ', your estimate to buy again ' + money(w.replaceEst, cur) + ' each' : '') + '. Id ' + w.id + '.', data: { saved: itemView(b, w), quantity: w.qty, estimate_to_buy_again: w.replaceEst } };
      });
    },
  },
];
