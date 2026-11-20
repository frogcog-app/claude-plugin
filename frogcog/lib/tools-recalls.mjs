/* FrogCog binder, stage 3: the check for possible safety recalls. Off until the person switches it on.
 *
 * It never says a product is recalled. A recall notice covers a range of models that a brand and a kind of
 * product cannot always pin down, so a match is a "possible recall": the official notice is shown and the person
 * checks their own model against it.
 */
import { obj, text } from './schema.mjs';
import { change, read, told } from './folder.mjs';
import { app, today, plural } from './common.mjs';
import { fetchRecalls } from './recall-fetch.mjs';

const WHAT_IS_SENT = region => 'The check sends each brand name in the binder, and nothing else, from this computer to ' + app.recallSource(region).sends + '. No model, serial number, date or name is sent.' + (region === 'US' ? ' It also downloads FrogCog\'s published copy of the CPSC\'s safety warnings, one file that is the same for everyone.' : '');
const view = m => ({ key: m.key, item: m.name, title: m.title, date: m.date || null, hazard: m.hazard || null, link: m.url || null, kind: m.kind === 'warning' ? 'safety warning' : 'possible recall', what_to_do: m.action || null });
const lineOf = m => '- ' + (m.kind === 'warning' ? 'Safety warning' : 'Possible recall') + ' for ' + m.name + ': ' + m.title + (m.date ? ' (' + m.date + ')' : '') + (m.hazard ? '. Hazard: ' + m.hazard : '') + (m.url ? '. Notice: ' + m.url : '') + ' (key ' + m.key + ')';

export const recallTools = [
  {
    name: 'recall_check', title: 'Check for possible safety recalls', online: true,
    description: 'Checks the brands in the binder against the official public recall list for the binder\'s country (the US CPSC, or GOV.UK) and lists possible matches for the person to check against their own model. This is the one tool that uses the internet: it sends brand names only. It is off until the person agrees: call it with nothing to get what it sends, show that to the person, and call it with agreed true once they say yes.',
    input: obj({ agreed: { type: 'boolean', description: 'True once the person has been told what is sent and agreed.' } }),
    async run(a){
      const { b } = read();
      const region = b.binder.country;
      if (!b.binder.recalls.on && !a.agreed) return { text: 'The recall check is off. ' + WHAT_IS_SENT(region) + ' Ask the person whether to switch it on; if they agree, call this again with agreed true.', data: { on: false, what_is_sent: WHAT_IS_SENT(region) } };
      const brands = [...new Set(b.warranties.map(w => (w.manufacturer || '').trim()).filter(Boolean))];
      if (!brands.length) return change(bb => { bb.binder.recalls.on = true; return { text: 'The recall check is on. No item in the binder has a brand yet, so there was nothing to check.', data: { on: true, checked: 0, matches: [] } }; });
      let got;
      try { got = await fetchRecalls(region, brands); } catch (e) { got = { byBrand: {}, asked: [] }; }
      return change(bb => {
        bb.binder.recalls.on = true;
        const res = app.recallCheckState(bb.warranties, got.byBrand, app.recallStateFor(bb.binder.recalls.state, region), today(), region);
        bb.binder.recalls.state = res.state;
        const live = app.activeRecallMatches(res.state, bb.warranties), src = app.recallSource(region);
        return { text: (res.failedBrands ? 'The recall list could not be reached for ' + plural(res.failedBrands, 'brand') + ', so this check is incomplete. Try again later.\n' : 'Checked ' + plural(brands.length, 'brand') + ' against ' + src.list + ' on ' + today() + '.\n')
            + (live.length ? 'Possible matches. Each is a notice for the same brand and kind of product; check your own model and serial number against the notice:\n' + live.map(lineOf).join('\n') : 'No possible recall was found for what is in the binder.'),
          data: { on: true, checked_on: res.state.checkedAt, incomplete: !!res.state.incomplete, brands_sent: brands, matches: live.map(view) } };
      });
    },
  },
  {
    name: 'recall_results', title: 'Possible recalls found so far', readOnly: true,
    description: 'Shows the possible recalls and safety warnings the last check found, without checking again and without using the internet.',
    input: obj({}),
    async run(){
      const { b } = read();
      const st = b.binder.recalls.state, live = st ? app.activeRecallMatches(st, b.warranties) : [];
      return { text: !b.binder.recalls.on ? 'The recall check is off.' : !st ? 'The recall check is on and has not been run yet.' : 'Last checked ' + (st.checkedAt || 'not completed') + (st.incomplete ? ' (incomplete)' : '') + '.\n' + (live.length ? live.map(lineOf).join('\n') : 'No possible recall on file.'),
        data: { on: !!b.binder.recalls.on, checked_on: st ? st.checkedAt : null, matches: live.map(view) } };
    },
  },
  {
    name: 'recall_setting', title: 'Switch the recall check off, or set a notice aside',
    description: 'Switches the recall check off (nothing more is sent until it is switched on again), or sets one notice aside once the person has checked it does not apply to their model (pass its key).',
    input: obj({ off: { type: 'boolean', description: 'True to switch the recall check off.' }, set_aside: text(300, 'The key of one notice to set aside.') }),
    async run(a){
      return change(b => {
        if (a.off) { b.binder.recalls.on = false; return { text: 'The recall check is off. Nothing more is sent. What was found is kept.', data: { on: false } }; }
        const st = b.binder.recalls.state;
        if (!a.set_aside || !st || !(st.matches || []).some(m => m.key === a.set_aside)) throw told('No notice with that key is on file. Nothing was changed.');
        st.dismissed = [...new Set([...(st.dismissed || []), a.set_aside])];
        return { text: 'That notice is set aside. It will not be raised again.', data: { set_aside: a.set_aside } };
      });
    },
  },
];
