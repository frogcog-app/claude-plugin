/* FrogCog binder: the app's own code.
 *
 * GENERATED. Do not edit. These are the same functions the FrogCog app runs (frogcog.app), taken as they are, so the
 * binder and the app work out the same dates, read the same backups and write the same calendar file.
 * Nothing in this file reads or writes a file, opens a web page or uses the network.
 */
/* eslint-disable */
const APP_NAME = 'FrogCog';
const APP_SLUG = 'frogcog';
function exportFilename(kind, isoDate){
  if(kind==='reminders') return APP_SLUG+'-reminders.ics';
  return APP_SLUG+'-'+(kind==='backup-encrypted'?'backup-encrypted':'backup')+'-'+isoDate+'.json';
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const esc = s => (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeHttpsUrl = u => /^https:\/\//i.test(u||'') ? u : '';
const isImageDataUrl = v => typeof v==='string' && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(v);
const safeCurrency = c => (typeof c==='string' && /^[\p{L}\p{Sc}.]{1,6}$/u.test(c)) ? c : '';
function safeFileName(name, fallback){
  const s = String(name==null ? '' : name).replace(/[\u0000-\u001f\u007f]/g, '').replace(/[\\/:*?"<>|]/g, '_').replace(/^[\s.]+/, '').replace(/[\s.]+$/, '').slice(0, 120);
  return s || fallback || 'File';
}
const telHref = phone => {
  let s = String(phone==null?'':phone).trim();
  const plus = s.startsWith('+') ? '+' : '';
  const m = s.match(/^([^0-9]*[0-9][^a-z#]*)/i);
  if(m) s = m[1];
  const digits = s.replace(/\D/g,'');
  return digits ? 'tel:'+plus+digits : '';
};
function upkeepReminder(item, preset, todayIso, id, firstDue){
  return { id, title:preset.title, product:[item.name, item.location].filter(Boolean).join(' · '), spec:preset.spec || '', type:preset.key,
    interval:preset.interval, lastDone:'', nextDue:firstDue || iso(addMonths(parse(todayIso || iso(today0())), preset.interval)), itemId:item.id };
}
const US_STATES = {AL:'alabama',AK:'alaska',AZ:'arizona',AR:'arkansas',CA:'california',CO:'colorado',CT:'connecticut',DE:'delaware',
  DC:'district of columbia',FL:'florida',GA:'georgia',HI:'hawaii',ID:'idaho',IL:'illinois',IN:'indiana',IA:'iowa',KS:'kansas',
  KY:'kentucky',LA:'louisiana',ME:'maine',MD:'maryland',MA:'massachusetts',MI:'michigan',MN:'minnesota',MS:'mississippi',
  MO:'missouri',MT:'montana',NE:'nebraska',NV:'nevada',NH:'new hampshire',NJ:'new jersey',NM:'new mexico',NY:'new york',
  NC:'north carolina',ND:'north dakota',OH:'ohio',OK:'oklahoma',OR:'oregon',PA:'pennsylvania',RI:'rhode island',SC:'south carolina',
  SD:'south dakota',TN:'tennessee',TX:'texas',UT:'utah',VT:'vermont',VA:'virginia',WA:'washington',WV:'west virginia',
  WI:'wisconsin',WY:'wyoming'};
function usStateCode(s){
  const t = String(s || '').trim().replace(/\./g, '');
  if(/^[A-Za-z]{2}$/.test(t) && US_STATES[t.toUpperCase()]) return t.toUpperCase();
  const name = t.toLowerCase().replace(/\s+/g, ' ');
  return Object.keys(US_STATES).find(k => US_STATES[k] === name) || '';
}
function registrationDeadline(w, rule, todayIso, state){
  if(!w || !rule || !(rule.days > 0)) return null;
  const st = usStateCode(state);
  if(st && (rule.notIn || []).includes(st)) return { notRequired: true, state: st, gives: rule.gives || '' };
  const fromInstall = rule.from === 'install' && !!parse(w.installed);
  const start = parse(fromInstall ? w.installed : w.purchased);
  const t0 = parse(todayIso || iso(today0()));
  if(!start || !t0) return null;
  const date = iso(addDays(start, rule.days));
  return { date, daysLeft: Math.round((parse(date) - t0) / 86400000), gives: rule.gives || '', from: rule.from || 'purchase',
    counted: fromInstall ? 'install' : 'purchase' };
}
function consumableQuery(m, presets, item){
  const p=(presets||[]).find(x=>x.key===(m&&m.type));
  let q=(p&&p.buy)||'';
  if(!q) return '';
  const size=(m.spec||'').match(/\b\d{1,2}\s*[x×]\s*\d{1,2}(\s*[x×]\s*\d{1,2})?\b/);
  if(size && /filter/i.test(q)) q+=' '+size[0].replace(/×/g,'x').replace(/\s+/g,'');
  else if(p.byModel && item){
    const man=String(item.manufacturer||'').replace(/[\s,]+(GmbH|AG|Ltd\.?|Limited|Inc\.?|LLC|Corp\.?|Corporation|plc|S\.?p\.?A\.?|B\.?V\.?)$/i,'').trim();
    const mod=String(item.model||'').trim().replace(/\s*\/\s*\d{1,3}$/,'');
    const modOk=mod.replace(/[^a-z0-9]/gi,'').length>=3;
    const fit=[man && !(modOk && mod.toLowerCase().startsWith(man.toLowerCase())) ? man : '', modOk ? mod : ''].filter(Boolean).join(' ');
    if(fit) q+=' '+fit;
  }
  return q;
}
function amazonSearchUrl(query, region, tag){
  if(!query) return '';
  const host = region==='GB' ? 'www.amazon.co.uk' : 'www.amazon.com';
  return 'https://'+host+'/s?k='+encodeURIComponent(query)+(tag ? '&tag='+encodeURIComponent(tag) : '');
}
const PARTS_SHOPS = {
  US:{ name:'Sears PartsDirect', search:'https://www.searspartsdirect.com/search?q=', namesPart:false },
  GB:{ name:'eSpares', search:'https://www.espares.co.uk/search.pl?query=', namesPart:true },
};
function partsSearch(item, region, part){
  if(!item || isContentsItem(item)) return null;
  const model=String(item.model||'').trim().replace(/\s+/g,' ');
  if(model.replace(/[^a-z0-9]/gi,'').length<3) return null;
  const shop=PARTS_SHOPS[region==='GB'?'GB':'US'];
  const q = part && shop.namesPart ? model+' '+part : model;
  return { shop:shop.name, model, url:shop.search+encodeURIComponent(q), pickModel:!!part && !shop.namesPart };
}
function buyTarget(m, presets, item, region){
  const p=(presets||[]).find(x=>x.key===(m&&m.type));
  const label=consumableLabel(m, presets);
  if(p && p.byModel){ const s=partsSearch(item, region, label); if(s) return Object.assign({kind:'parts', label}, s); }
  const query=consumableQuery(m, presets, item);
  return query ? {kind:'amazon', label, query} : null;
}
const REPAIR_KINDS = ['washer dryer','washing machine','tumble dryer','fridge freezer','range hood','cooker hood',
  'extractor hood','water heater','garbage disposal','air conditioner','heat pump','ice maker','dishwasher','dryer',
  'washer','refrigerator','fridge','freezer','oven','range','cooker','stove','hob','cooktop','microwave','boiler',
  'furnace','dehumidifier','humidifier','vacuum'];
function repairGuideQuery(item, problem){
  if(!item) return '';
  const brand=String(item.manufacturer||'').trim().replace(/[\s,]+(GmbH|AG|Ltd\.?|Limited|Inc\.?|LLC|Corp\.?|Corporation|plc)$/i,'');
  const name=String(item.name||'').trim();
  const kind=REPAIR_KINDS.find(k=>hasWordOrPlural(name, k));
  const rest=brand ? name.replace(new RegExp('^'+brand.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b\\s*','i'),'') : name;
  return [brand, kind||rest, String(problem||'').trim()].filter(Boolean).join(' ').replace(/\s+/g,' ').slice(0,120).trim();
}
function ifixitSearchUrl(query){ return query ? 'https://www.ifixit.com/Search?query='+encodeURIComponent(query) : ''; }
function consumableLabel(m, presets){ const q=consumableQuery(m, presets).toLowerCase(); return /filter/.test(q)?'filter':/descal/.test(q)?'descaler':/cleaner/.test(q)?'cleaner':(/batter|aa|9v|cr\d/.test(q)?'battery':'replacement'); }
function addressLabels(region){
  return region === 'GB' ? {region:'County', zip:'Postcode'} : {region:'State', zip:'ZIP code'};
}
const today0 = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
const iso = d => { const x=new Date(d); const m=String(x.getMonth()+1).padStart(2,'0'); const dd=String(x.getDate()).padStart(2,'0'); return x.getFullYear()+'-'+m+'-'+dd; };
const parse = s => s ? new Date(s+'T00:00:00') : null;
const addMonths = (d,n) => { const x=new Date(d), day=x.getDate(); x.setDate(1); x.setMonth(x.getMonth()+n); x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth()+1, 0).getDate())); return x; };
const addYears = (d,n) => addMonths(d, 12*n);
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const daysFromToday = s => { const d=parse(s); return d? Math.round((d-today0())/86400000) : null; };
function warrantyStatus(expiry){
  const days = daysFromToday(expiry);
  if(days===null) return {key:'none', label:'No expiry'};
  if(days<0)  return {key:'expired', label:'Expired', days};
  if(days<=60) return {key:'soon', label:'Expiring soon', days};
  return {key:'active', label:'Active', days};
}
function daysWord(days){
  if(days===null||days===undefined) return '';
  const n = (k, word) => k+' '+word+(k===1?'':'s');
  if(days<0) return n(Math.abs(days),'day')+' ago';
  if(days===0) return 'today';
  if(days<31) return n(days,'day')+' left';
  if(days<365) return n(Math.round(days/30),'month')+' left';
  return (days/365).toFixed(days<730?1:0)+' yr left';
}
function commissionNote(hasDeals){
  return (hasDeals
    ? 'We may earn a commission if you buy through these links — it never changes your price.'
    : 'No affiliate deals are signed yet, so these links don’t earn us a commission — you’re going straight to the provider’s own site.')
    + ' We supply the data and you choose: a listing isn’t a recommendation, and this isn’t every provider. Ratings are the providers’ own public scores; check them before buying.';
}
function planStatus(w){
  const c = w.plan;
  if(c && c.state==='purchased' && !planInForce(w)) return {key:'ended', label:'Protection plan ended'+(c.provider?(' · '+c.provider):''), cls:'creg need'};
  if(c && c.state==='purchased') return {key:'purchased', label:'🛡️ Protected'+(c.provider?(' · '+c.provider):''), cls:'creg done'};
  if(c && c.state==='referred')  return {key:'referred',  label:'Protection plan started — confirm if bought', cls:'creg need'};
  return {key:'need', label:'Compare protection plans →', cls:'creg'};
}
function homePlanStatus(homePlan){
  const c = homePlan;
  if(c && c.state==='purchased' && !planInForce({plan:c})) return {key:'ended', label:'Whole-home plan ended'+(c.provider?(' · '+c.provider):''), cls:'creg need'};
  if(c && c.state==='purchased') return {key:'purchased', label:'🛡️ Whole-home protection active'+(c.provider?(' · '+c.provider):''), cls:'creg done'};
  if(c && c.state==='referred')  return {key:'referred', label:'Protection plan started — confirm if bought', cls:'creg need'};
  return {key:'need', label:'', cls:'creg'};
}
const _daysBetween = (dateIso, todayIso) => {
  const d = parse(dateIso); if(!d || isNaN(d)) return null;
  return Math.round((d - (todayIso ? parse(todayIso) : today0())) / 86400000);
};
function planDaysLeft(w, todayIso){
  const c = w && w.plan;
  return (c && c.state==='purchased') ? _daysBetween(c.ends, todayIso) : null;
}
function planInForce(w, todayIso){
  const c = w && w.plan;
  if(!c || c.state!=='purchased') return false;
  const d = planDaysLeft(w, todayIso);
  return d===null || d>=0;
}
function planCovers(w, todayIso){
  if(!planInForce(w, todayIso)) return false;
  const d = planDaysLeft(w, todayIso), maker = _daysBetween(w.expiry, todayIso);
  if(maker===null) return true;
  return d===null ? maker<=60 : d>=maker;
}
function planEndingSoon(w, todayIso){
  const d = planDaysLeft(w, todayIso);
  return d!==null && d<=60 && planCovers(w, todayIso);
}
function planFromForm(existing, f, todayIso){
  const v = k => String((f && f[k]) == null ? '' : f[k]).trim();
  const provider = v('provider').slice(0,80), ends = v('ends'), ref = v('ref').slice(0,60), phone = v('phone').slice(0,40);
  const held = !!existing && existing.state==='purchased';
  if(!provider){
    if(ends || ref || phone) return {error:'Add who the plan is with, or clear the other plan fields.'};
    return {plan: held ? null : (existing || null)};
  }
  if(ends && (!/^\d{4}-\d{2}-\d{2}$/.test(ends) || _daysBetween(ends, todayIso)===null)) return {error:'That plan end date could not be read.'};
  const same = !!existing && String(existing.provider||'').trim().toLowerCase()===provider.toLowerCase();
  const plan = same ? Object.assign({}, existing) : {own:true, at:todayIso};
  plan.state = 'purchased'; plan.provider = provider;
  if(!plan.confirmedAt) plan.confirmedAt = todayIso;
  [['ends',ends],['ref',ref],['phone',phone]].forEach(([k,val])=>{ if(val) plan[k]=val; else delete plan[k]; });
  return {plan};
}
const NO_PROVIDER_CATEGORIES = ['Auto'];
function planDismissed(w){
  const d=w.decision;
  return !!d && d.type==='dismiss' && d.expiry===(w.expiry||'');
}
function planEligible(w){
  if(NO_PROVIDER_CATEGORIES.includes(w.category)) return false;
  const k=warrantyStatus(w.expiry).key; return k==='expired'||k==='soon'||k==='none'||!!w.plan;
}
function planUrgency(w){
  if(planCovers(w)) return planEndingSoon(w) ? 1 : 4;
  const s=warrantyStatus(w.expiry).key; return s==='expired'?0:s==='soon'?1:s==='none'?2:3;
}
function displayStatus(w){
  const st = warrantyStatus(w.expiry);
  if(planCovers(w)){
    const d = planDaysLeft(w);
    if(d===null) return {key:'active', label:'Protected', via:'plan'};
    return {key: d<=60?'soon':'active', label: d<=60?'Plan ending soon':'Protected', days:d, via:'plan'};
  }
  if(w.noWarranty && st.key==='none') return {key:'unprotected', label:'No warranty'};
  if(isContentsItem(w) && st.key==='none') return {key:'none', label:'In your inventory'};
  if(st.key==='expired' && planDismissed(w)) return {key:'unprotected', label:'Not protected', days:st.days};
  return st;
}
function coveredValue(items, region){
  const by = {}; let plan = false;
  (items||[]).forEach(w => {
    const st = displayStatus(w);
    if((st.key==='active' || st.key==='soon') && w.price!=null){
      const c = safeCurrency(w.currency) || defaultCurrency(region);
      by[c] = (by[c]||0) + w.price;
      if(st.via==='plan') plan = true;
    }
  });
  return {by, plan};
}
function regionName(region){ return region === 'GB' ? 'UK' : 'US'; }
function defaultCurrency(region){ return region === 'GB' ? '£' : '$'; }
function manualSearchUrl(manufacturer, model, name, topic){
  const man = (manufacturer||'').trim(), mod = (model||'').trim(), t = (topic||'').trim();
  let type = (name||'').trim();
  if(man && type){
    const re = new RegExp('^'+man.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+','i');
    type = type.replace(re,'').trim();
  }
  const parts = [man, mod, type].filter(Boolean);
  if(!parts.length) return '';
  return 'https://www.google.com/search?q='+encodeURIComponent(parts.join(' ')+' manual '+(t||'pdf'));
}
function isPdfBytes(buf){
  if(!buf) return false;
  const u = buf instanceof Uint8Array ? buf : (buf instanceof ArrayBuffer ? new Uint8Array(buf) : null);
  if(!u) return false;
  const n = Math.min(u.length, 1024) - 4;
  for(let i=0; i<n; i++){ if(u[i]===0x25 && u[i+1]===0x50 && u[i+2]===0x44 && u[i+3]===0x46 && u[i+4]===0x2D) return true; }
  return false;
}
function brandNamed(text, brand){
  const plain=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'');
  const b=plain(brand).trim();
  if(!b) return false;
  const pat=b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('(?:^|[^A-Za-z])'+pat+'(?![A-Za-z])', b.length<=3?'':'i').test(plain(text));
}
const RECALL_KEYWORDS={
  'Appliances':['appliance','washer','washing','dryer','dishwasher','refrigerator','fridge','freezer','oven','cooker','range','stove','microwave','hob','cooktop','hood'],
  'Consumer Electronics':['tv','television','monitor','speaker','soundbar','headphone','earbud','console','projector'],
  'Computers':['laptop','computer','tablet','monitor','charger','adapter','battery','power bank'],
  'Phones':['phone','smartphone','charger','adapter','battery','power bank'],
  'Power Tools':['drill','saw','tool','grinder','sander','nailer','battery','charger'],
  'Home / HVAC':['heater','furnace','boiler','hvac','air conditioner','conditioner','humidifier','dehumidifier','fan','thermostat'],
  'Auto':['vehicle','car','tire','tyre','brake','jack','seat'],
  'Furniture':['furniture','chair','sofa','dresser','table','crib','bed','desk'],
  'Other':[]
};
const hasWord = (text, word) => new RegExp('\\b'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(text);
const hasWordOrPlural = (text, word) => {
  const w = word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('\\b(?:' + w + '(?:e?s)?' + (/y$/i.test(word) ? '|' + w.slice(0,-1) + 'ies' : '') + ')\\b', 'i').test(text);
};
const namesBrand = (text, brand) => {
  const b = String(brand||'').trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!b) return false;
  const re = new RegExp('(?:^|[^a-z0-9])' + b + '(?![a-z0-9])', 'i'), t = String(text||'');
  return re.test(t) || re.test(t.replace(/([a-z])([A-Z])/g,'$1 $2'));
};
const PRODUCT_TYPE_WORDS = [...new Set(Object.values(RECALL_KEYWORDS).flat().concat([
  'mixer','blender','kettle','toaster','fryer','air fryer','grill','vacuum','purifier','food processor','juicer',
  'steam iron','lamp','coffee','espresso','water heater','heat pump','smoke alarm','alarm','detector','garage door',
  'mower','trimmer','pressure washer','generator','scooter','bike','treadmill','camera','doorbell','router','printer']))];
function recallRelevant(rec, w){
  if(!rec.RecallID || !rec.URL) return false;
  const raw=(rec.Title||'')+' '+(rec.Products||[]).map(p=>(p.Name||'')+' '+(p.Description||'')).join(' ');
  const hay=raw.toLowerCase();
  const brand=(w.manufacturer||'').toLowerCase().trim();
  if(brand && !namesBrand(raw, brand)) return false;
  const name=(w.name||'').toLowerCase();
  const kws=RECALL_KEYWORDS[w.category]||[];
  const specific=kws.filter(k=>hasWordOrPlural(name,k));
  if(specific.length) return specific.some(k=>hasWordOrPlural(hay,k));
  const nameWords=name.split(/\s+/).filter(x=>x.length>3 && x!==brand);
  if(nameWords.length && nameWords.some(x=>hasWordOrPlural(hay,x))) return true;
  if(PRODUCT_TYPE_WORDS.some(k=>hasWordOrPlural(name,k))) return false;
  return kws.some(k=>hasWordOrPlural(hay,k));
}
function recallSource(region){
  return region === 'GB'
    ? { key:'opss', short:'GOV.UK', name:'GOV.UK', list:'the UK government’s product recall list on GOV.UK',
        db:'the official UK product recall list (GOV.UK)', sends:'the UK government’s recall list on GOV.UK' }
    : { key:'cpsc', short:'CPSC', name:'US CPSC', list:'the official US CPSC recall list',
        db:'the official U.S. recall database', sends:'the US CPSC database' };
}
function recallLookupUrl(region, brand){
  const q = encodeURIComponent(String(brand||'').trim());
  return region === 'GB'
    ? 'https://www.gov.uk/api/search.json?filter_format=product_safety_alert_report_recall&count=50&order=-public_timestamp'
      + '&fields=title,link,public_timestamp,description,product_measure_type&q=' + q
    : 'https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=' + q;
}
const UK_NOTICE_ONLY_MEASURES = ['import-rejected-at-border','destruction-of-the-product','removal-of-listing-by-online-marketplace'];
function recallsFromResponse(region, json, brand){
  if(region !== 'GB') return Array.isArray(json) ? json : [];
  const b = String(brand||'').trim();
  if(!b) return [];
  const bre = b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const forBrand = new RegExp('\\b(?:for|fits?|compatible with)\\s+(?:[\\w’\'-]+\\s+){0,3}?' + bre + '(?![A-Za-z])', 'i');
  return ((json && json.results) || []).filter(r => {
    const title = String((r && r.title) || '');
    if(!r || !r.link || !hasWord(title, b)) return false;
    if(/\b(counterfeit|fake|unbranded)\b/i.test(title) || forBrand.test(title)) return false;
    const measures = [].concat(r.product_measure_type || []);
    if(measures.length && measures.every(m => UK_NOTICE_ONLY_MEASURES.includes(m))) return false;
    return true;
  }).map(r => {
    const desc = String(r.description || '');
    const risk = /\b(risks?\s+of\s+[^.]+)/i.exec(desc);
    const hazard = risk ? risk[1].replace(/\s+/g,' ').trim() : '';
    return { RecallID: r.link, URL: 'https://www.gov.uk' + r.link, Title: r.title,
      Products: [{ Name:'', Description: desc }], RecallDate: String(r.public_timestamp || '').slice(0,10),
      Hazards: hazard ? [{ Name: hazard.charAt(0).toUpperCase() + hazard.slice(1) }] : [] };
  });
}
const CPSC_WARNINGS_PAGE = 'https://www.cpsc.gov/Recalls';
function warningsForBrand(feed, brand){
  const b = String(brand || '').trim();
  if(!b || !feed || !Array.isArray(feed.warnings)) return [];
  return feed.warnings.filter(w => w && w.t && namesBrand([w.t, w.p, w.co].join(' '), b)).map(w => {
    const due = /\bDue to (.+)$/i.exec(w.t);
    return { RecallID: 'psw-' + (w.n || w.d + '-' + w.t.slice(0, 40)), kind: 'warning', num: w.n || '', URL: CPSC_WARNINGS_PAGE,
      Title: w.t, Products: [{ Name: w.p || '', Description: '' }], RecallDate: w.d || '',
      Hazards: due ? [{ Name: due[1].charAt(0).toUpperCase() + due[1].slice(1) }] : [], action: w.act || '' };
  });
}
function recallStateFor(prev, region){
  const p = prev || {};
  return (p.region || 'US') === region ? p : {};
}
function recallCheckState(warranties, byBrand, prev, todayIso, region){
  prev = prev || {};
  const brandOf = w => (w.manufacturer||'').toLowerCase().trim();
  const failed = new Set(warranties.map(brandOf).filter(b => b && !(b in byBrand)));
  const failedIds = new Set(warranties.filter(w => failed.has(brandOf(w))).map(w => w.id));
  const seen = new Set(), matches = [];
  (prev.matches||[]).filter(m => failedIds.has(m.id)).forEach(m => { seen.add(m.key); matches.push(m); });
  warranties.forEach(w => {
    if(failed.has(brandOf(w))) return;
    const list = (byBrand[brandOf(w)]||[]).filter(rec => recallRelevant(rec, w))
      .sort((a,b) => String(b.RecallDate||'').localeCompare(String(a.RecallDate||''))).slice(0,3);
    list.forEach(rec => { const key=w.id+'|'+(rec.kind==='warning' ? rec.RecallID : (rec.URL||rec.RecallID||rec.Title)); if(seen.has(key)) return; seen.add(key);
      const m={id:w.id, name:w.name, key, title:rec.Title||'Recall', url:rec.URL||'', date:(rec.RecallDate||'').slice(0,10), hazard:((rec.Hazards||[])[0]||{}).Name||''};
      if(rec.kind==='warning') Object.assign(m, {kind:'warning', num:rec.num||'', action:rec.action||''});
      matches.push(m); });
  });
  const state = {checkedAt: failed.size ? (prev.checkedAt||null) : todayIso, matches, dismissed: prev.dismissed||[], incomplete: failed.size>0};
  if(region) state.region = region;
  return { state, failedBrands: failed.size };
}
function activeRecallMatches(state, items){
  const dis = new Set((state && state.dismissed) || []), ids = new Set((items || []).map(w => w.id));
  return ((state && state.matches) || []).filter(m => !dis.has(m.key) && ids.has(m.id));
}
function icsEsc(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/[,;]/g,m=>'\\'+m).replace(/\r\n|\r|\n/g,'\\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,''); }
function icsStamp(){ const p=n=>String(n).padStart(2,'0'); const d=new Date(); return d.getUTCFullYear()+p(d.getUTCMonth()+1)+p(d.getUTCDate())+'T'+p(d.getUTCHours())+p(d.getUTCMinutes())+p(d.getUTCSeconds())+'Z'; }
function icsEvent(ev){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(ev.date||''))) return '';
  const dt=ev.date.replace(/-/g,'');
  const end=iso(addDays(parse(ev.date),1)).replace(/-/g,'');
  const L=['BEGIN:VEVENT','UID:'+String(ev.uid||'').replace(/[^\w.@-]/g,''),'DTSTAMP:'+icsStamp(),'DTSTART;VALUE=DATE:'+dt,'DTEND;VALUE=DATE:'+end,'SUMMARY:'+icsEsc(ev.summary)];
  if(ev.desc) L.push('DESCRIPTION:'+icsEsc(ev.desc));
  if(ev.rrule) L.push('RRULE:'+ev.rrule);
  const p=n=>String(n).padStart(2,'0');
  (ev.alarms||[]).forEach(days=>{
    const t=addDays(parse(ev.date),-days);
    const stamp=t.getFullYear()+p(t.getMonth()+1)+p(t.getDate())+'T090000';
    L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(ev.summary),'TRIGGER;VALUE=DATE-TIME:'+stamp,'END:VALARM');
  });
  L.push('END:VEVENT');
  return L.join('\r\n');
}
function buildICS(events){
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//'+APP_NAME+'//Reminders//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    ...events.filter(Boolean).map(icsEvent).filter(Boolean),'END:VCALENDAR'].join('\r\n');
}
function warrantyEvent(w){
  if(!w || !w.expiry) return null;
  return { uid:'w-'+w.id+'@frogcog', date:w.expiry,
    summary:'⚠️ Warranty ends: '+(w.name||'item'),
    desc:[[w.manufacturer,w.model].filter(Boolean).join(' '), w.store?('Bought at '+w.store):'', 'Tracked in '+APP_NAME+' — open it to register for warranty or decide about a protection plan before it ends.'].filter(Boolean).join('\n'),
    alarms:[30,7] };
}
function planEvent(w){
  const c = w && w.plan;
  if(!c || planDaysLeft(w)===null) return null;
  return { uid:'p-'+w.id+'@frogcog', date:c.ends,
    summary:'🛡️ Protection plan ends: '+(w.name||'item'),
    desc:[c.provider?('Plan with '+c.provider):'', c.ref?('Plan number '+c.ref):'', 'Tracked in '+APP_NAME+' — open it to renew the plan or compare others before it ends.'].filter(Boolean).join('\n'),
    alarms:[30,7] };
}
function returnWindow(w, todayIso){
  const d = parse(w && w.returnBy), t0 = parse(todayIso || iso(today0()));
  if(!d || !t0) return null;
  const daysLeft = Math.round((d - t0) / 86400000);
  return daysLeft < 0 ? null : { date: w.returnBy, daysLeft };
}
function regEvent(w, rule, todayIso, state){
  if(!w || w.regConfirmed) return null;
  const dl = registrationDeadline(w, rule, todayIso, state);
  if(!dl || dl.notRequired || dl.daysLeft < 0) return null;
  return { uid:'g-'+w.id+'@frogcog', date:dl.date,
    summary:'📝 Last day to register: '+(w.name||'item'),
    desc:[[w.manufacturer,w.model].filter(Boolean).join(' '), dl.gives?('Registering keeps '+dl.gives+'.'):'', 'Tracked in '+APP_NAME+' — open it to register with the maker.'].filter(Boolean).join('\n'),
    alarms:[14,3] };
}
function returnEvent(w){
  if(!w || !w.returnBy) return null;
  return { uid:'r-'+w.id+'@frogcog', date:w.returnBy,
    summary:'↩️ Last day to return: '+(w.name||'item'),
    desc:[w.store?('Bought at '+w.store):'', 'Tracked in '+APP_NAME+' — unbox it and check it works while it can still go back.'].filter(Boolean).join('\n'),
    alarms:[3,1] };
}
function maintEvent(m){
  if(!m || !m.nextDue) return null;
  const ev={ uid:'m-'+m.id+'@frogcog', date:m.nextDue,
    summary:'🔧 '+(m.title||'Maintenance'),
    desc:[m.spec?('🔋 '+m.spec):'', m.product?('Where: '+m.product):''].filter(Boolean).join('\n'),
    alarms:[3] };
  if(m.interval>0) ev.rrule='FREQ=MONTHLY;INTERVAL='+m.interval;
  return ev;
}
const SEASONS = ['spring','summer','autumn','winter'];
const SEASON_START_MONTH = {spring:2, summer:5, autumn:8, winter:11};
function seasonOf(todayIso){
  const t = parse(todayIso || iso(today0()));
  const m = t.getMonth();
  const name = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
  const year = (name === 'winter' && m < 2) ? t.getFullYear() - 1 : t.getFullYear();
  const start = new Date(year, SEASON_START_MONTH[name], 1);
  const end = addDays(addMonths(start, 3), -1);
  return { name, id: year + '-' + name, start: iso(start), end: iso(end), daysLeft: Math.round((end - t) / 86400000) };
}
function seasonLabel(name, region){
  if(name === 'autumn') return region === 'GB' ? 'Autumn' : 'Fall';
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
}
function seasonRank(id){
  const m = /^(\d{4})-(spring|summer|autumn|winter)$/.exec(String(id || ''));
  return m ? parseInt(m[1], 10) * 4 + SEASONS.indexOf(m[2]) : -1;
}
function seasonalState(raw){
  const r = (raw && typeof raw === 'object') ? raw : {};
  const done = {};
  Object.keys(r.done && typeof r.done === 'object' ? r.done : {}).forEach(id => {
    if(seasonRank(id) >= 0 && r.done[id] && typeof r.done[id] === 'object') done[id] = Object.assign({}, r.done[id]);
  });
  return { v:1, done, hide: Array.isArray(r.hide) ? r.hide.filter(k => typeof k === 'string') : [], off: r.off === true };
}
const SEASONS_KEPT = 4;
function pruneSeasonal(st){
  const ids = Object.keys(st.done).sort((a, b) => seasonRank(b) - seasonRank(a)).slice(0, SEASONS_KEPT);
  const done = {}; ids.forEach(id => { if(Object.keys(st.done[id]).length) done[id] = st.done[id]; });
  return Object.assign({}, st, {done});
}
function tickSeasonal(state, seasonId, key, dateIso){
  const st = seasonalState(state);
  st.done[seasonId] = Object.assign({}, st.done[seasonId] || {}, {[key]: dateIso || iso(today0())});
  return pruneSeasonal(st);
}
function untickSeasonal(state, seasonId, key){
  const st = seasonalState(state);
  if(st.done[seasonId]){ const d = Object.assign({}, st.done[seasonId]); delete d[key]; st.done[seasonId] = d; }
  return pruneSeasonal(st);
}
function hideSeasonal(state, key){ const st = seasonalState(state); if(!st.hide.includes(key)) st.hide = st.hide.concat(key); return st; }
function unhideSeasonal(state, key){ const st = seasonalState(state); st.hide = st.hide.filter(k => k !== key); return st; }
function mergeSeasonal(mine, theirs){
  const a = seasonalState(mine), b = seasonalState(theirs);
  Object.keys(b.done).forEach(id => { a.done[id] = Object.assign({}, b.done[id], a.done[id] || {}); });
  a.hide = a.hide.concat(b.hide.filter(k => !a.hide.includes(k)));
  return pruneSeasonal(a);
}
function seasonalDueRow(res){
  if(!res || !res.counts || !res.counts.todo) return null;
  const left = res.counts.todo;
  return { kind:'season', urgency:2, days:res.season.daysLeft, id:res.season.id, title:res.label + ' home checklist',
    sub:left + ' job' + (left === 1 ? '' : 's') + ' left this season', action:'season', todo:left };
}
const SEASON_EMOJI = {spring:'🌱', summer:'☀️', autumn:'🍂', winter:'❄️'};
function nextSeasonStart(name, todayIso){
  const t = parse(todayIso || iso(today0()));
  let d = new Date(t.getFullYear(), SEASON_START_MONTH[name], 1);
  if(d < t) d = new Date(t.getFullYear() + 1, SEASON_START_MONTH[name], 1);
  return iso(d);
}
function seasonEvents(region, todayIso){
  return SEASONS.map(name => {
    const label = seasonLabel(name, region);
    return { uid:'season-' + name + '@frogcog', date:nextSeasonStart(name, todayIso), summary:SEASON_EMOJI[name] + ' ' + label + ' home checklist',
      desc:'Your ' + label.toLowerCase() + ' home checklist is ready in ' + APP_NAME + ': a few short jobs for the season, each with its source.',
      rrule:'FREQ=MONTHLY;INTERVAL=12', alarms:[0] };
  });
}
const SCHEMA_VERSION = 1;
function validateImport(d){
  if(!d || typeof d!=='object' || Array.isArray(d)) return {ok:false, error:'That file is not a '+APP_NAME+' backup.'};
  if(d.schemaVersion!==undefined && typeof d.schemaVersion==='number' && d.schemaVersion>SCHEMA_VERSION){
    return {ok:false, error:'This backup was made with a newer version of the app — update the app, then try again.'};
  }
  if(d.warranties!==undefined && !Array.isArray(d.warranties)) return {ok:false, error:'This file is not a '+APP_NAME+' backup (products list is the wrong shape).'};
  if(d.maintenance!==undefined && !Array.isArray(d.maintenance)) return {ok:false, error:'This file is not a '+APP_NAME+' backup (reminders list is the wrong shape).'};
  if(d.contacts!==undefined && !Array.isArray(d.contacts)) return {ok:false, error:'This file is not a '+APP_NAME+' backup (contacts list is the wrong shape).'};
  const warranties = (d.warranties||[]).filter(w=>w && typeof w==='object' && !Array.isArray(w)).slice(0, IMPORT_MAX_RECORDS);
  const maintenance = (d.maintenance||[]).filter(m=>m && typeof m==='object' && !Array.isArray(m)).slice(0, IMPORT_MAX_RECORDS);
  const contacts = (d.contacts||[]).filter(c=>c && typeof c==='object' && !Array.isArray(c)).slice(0, IMPORT_MAX_RECORDS);
  const profile = (d.profile && typeof d.profile==='object' && !Array.isArray(d.profile)) ? cleanImportedValue(d.profile, 0) : null;
  const photos = (d.photos && typeof d.photos==='object' && !Array.isArray(d.photos)) ? d.photos : {};
  const manuals = (d.manuals && typeof d.manuals==='object' && !Array.isArray(d.manuals)) ? d.manuals : {};
  const nManuals = warranties.filter(w=>w.manual && typeof w.manual==='object' && typeof w.manual.k==='string'
    && Object.prototype.hasOwnProperty.call(manuals, w.manual.k) && typeof manuals[w.manual.k]==='string').length;
  return {
    ok:true, warranties, maintenance, contacts, profile, photos, manuals,
    homePlan: d.homePlan!==undefined ? d.homePlan : undefined,
    exported: typeof d.exported==='string' ? d.exported : null,
    counts: {warranties:warranties.length, maintenance:maintenance.length, contacts:contacts.length, hasProfile:!!profile, manuals:nManuals}
  };
}
const MANUAL_MAX_BYTES = 100*1024*1024;
const BACKUP_MANUALS_MAX_BYTES = 30*1024*1024;
function bytesToBase64(bytes){
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || 0);
  let bin = '';
  for(let i=0; i<u.length; i+=0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i+0x8000));
  return btoa(bin);
}
function base64ToBytes(s){
  if(typeof s!=='string') return null;
  let bin; try{ bin = atob(s); }catch(e){ return null; }
  const u = new Uint8Array(bin.length);
  for(let i=0; i<bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function backupManualPlan(items, limit){
  const max = limit>0 ? limit : BACKUP_MANUALS_MAX_BYTES;
  const all = (items||[]).filter(w=>w && w.manual && typeof w.manual==='object' && w.manual.k)
    .map(w=>({id:w.id, k:w.manual.k, item:w.name||'', name:w.manual.name||'Manual', size:Number(w.manual.size)>0 ? Number(w.manual.size) : 0}));
  const include = [], leftOut = []; let bytes = 0;
  all.slice().sort((a,b)=>a.size-b.size).forEach(m=>{ if(bytes+m.size<=max){ include.push(m); bytes += m.size; } else leftOut.push(m); });
  return {include, leftOut, bytes, limit:max};
}
const IMPORT_DAY_FIELDS = ['purchased', 'expiry', 'installed', 'returnBy', 'lastDone', 'nextDue'];
const IMPORT_NUM_FIELDS = ['price', 'replaceEst', 'createdAt'];
const IMPORT_COUNT_FIELDS = {interval:1200, qty:9999};
const IMPORT_MAX_TEXT = 100000, IMPORT_MAX_LIST = 1000, IMPORT_MAX_FIELDS = 200, IMPORT_MAX_DEPTH = 6, IMPORT_MAX_RECORDS = 5000;
function cleanImportedValue(v, depth){
  if(typeof v==='string') return v.length>IMPORT_MAX_TEXT ? v.slice(0, IMPORT_MAX_TEXT) : v;
  if(typeof v==='number') return isFinite(v) ? v : undefined;
  if(typeof v==='boolean' || v===null) return v;
  if(!v || typeof v!=='object' || depth>=IMPORT_MAX_DEPTH) return undefined;
  if(Array.isArray(v)) return v.slice(0, IMPORT_MAX_LIST).map(x=>cleanImportedValue(x, depth+1)).filter(x=>x!==undefined);
  const out = {};
  Object.keys(v).slice(0, IMPORT_MAX_FIELDS).forEach(k=>{
    if(!/^[A-Za-z0-9_-]{1,60}$/.test(k) || k==='__proto__' || k==='constructor' || k==='prototype') return;
    const c = cleanImportedValue(v[k], depth+1);
    if(k==='currency' && !safeCurrency(c)) return;
    if(c!==undefined) out[k] = c;
  });
  return out;
}
function cleanImportedRecord(rec){
  const r = cleanImportedValue(rec, 0);
  if(!r || typeof r!=='object' || Array.isArray(r)) return {};
  IMPORT_DAY_FIELDS.forEach(k=>{ if(k in r && r[k]!=='' && !(typeof r[k]==='string' && /^\d{4}-\d{2}-\d{2}$/.test(r[k]))) delete r[k]; });
  IMPORT_NUM_FIELDS.forEach(k=>{
    if(!(k in r) || r[k]===null) return;
    if(typeof r[k]==='string' && /^\d{1,12}(\.\d{1,6})?$/.test(r[k].trim())) r[k] = Number(r[k].trim());
    if(typeof r[k]!=='number' || r[k]<0) delete r[k];
  });
  Object.keys(IMPORT_COUNT_FIELDS).forEach(k=>{
    if(!(k in r)) return;
    const n = typeof r[k]==='string' && /^\d{1,6}$/.test(r[k].trim()) ? Number(r[k].trim()) : r[k];
    if(typeof n==='number' && n>=1 && n<=IMPORT_COUNT_FIELDS[k] && Math.floor(n)===n) r[k] = n; else delete r[k];
  });
  if('regLink' in r && !(typeof r.regLink==='string' && safeHttpsUrl(r.regLink) && !/[\s"'<>]/.test(r.regLink))) delete r.regLink;
  return r;
}
function sanitizeImportedRecords(warranties, maintenance, photos, contacts, manuals){
  photos = photos || {};
  manuals = (manuals && typeof manuals==='object') ? manuals : {};
  const newPhotos = {}, newManuals = {}, manualsMissing = [];
  const remap = (rec, isItem) => {
    const r = cleanImportedRecord(rec);
    const oldId = r.id;
    r.id = uid();
    const man = r.manual; delete r.manual;
    if(isItem && man && typeof man==='object' && typeof man.k==='string'){
      const name = safeFileName(man.name, 'Manual.pdf');
      const bytes = Object.prototype.hasOwnProperty.call(manuals, man.k) ? base64ToBytes(manuals[man.k]) : null;
      if(bytes && bytes.length<=MANUAL_MAX_BYTES && isPdfBytes(bytes)){
        const k = uid();
        newManuals[k] = bytes;
        r.manual = {k, name, size:bytes.length};
        if(typeof man.savedAt==='string' && /^\d{4}-\d{2}-\d{2}$/.test(man.savedAt)) r.manual.savedAt = man.savedAt;
      } else manualsMissing.push({id:r.id, item:typeof r.name==='string' ? r.name : '', name});
    }
    if(r.photo && isImageDataUrl(photos[oldId])) newPhotos[r.id] = photos[oldId];
    if(Array.isArray(r.docs)){
      r.docs = r.docs.map(d=>{
        if(!d || typeof d!=='object' || !isImageDataUrl(photos[d.k])) return null;
        const k = uid();
        newPhotos[k] = photos[d.k];
        return {k, label: typeof d.label==='string' ? d.label.slice(0,200) : 'Photo'};
      }).filter(Boolean);
    }
    return r;
  };
  const idMap = {};
  const remapAll = (list, isItem) => list.map(rec => { const r = remap(rec, isItem); if(rec && rec.id) idMap[rec.id] = r.id; return r; });
  const ws = remapAll(warranties, true), ms = remapAll(maintenance), cs = remapAll(contacts||[]);
  const wIds = new Set(ws.map(w=>w.id));
  ms.forEach(m=>{ if(m.itemId!==undefined){ const to = idMap[m.itemId]; if(to && wIds.has(to)) m.itemId = to; else delete m.itemId; } });
  return { warranties: ws, maintenance: ms, contacts: cs, photos: newPhotos, idMap, manuals: newManuals, manualsMissing };
}
const RECEIPT_TYPES = [['purchase','Purchase'],['repair','Repair'],['upkeep','Upkeep'],['improvement','Improvement'],['plan','Protection plan'],['other','Other cost']];
const receiptTypeLabel = t => (RECEIPT_TYPES.find(x=>x[0]===t)||[0,'Receipt'])[1];
function receiptRecord(f, existing, nowMs){
  const g = k => String((f||{})[k]==null ? '' : f[k]).trim();
  const type = RECEIPT_TYPES.some(t=>t[0]===g('type')) ? g('type') : 'purchase';
  const title = g('title').slice(0,200);
  if(!title) return {error:'Say what this receipt is for, for example "Boiler service" or "New roof".'};
  const date = /^\d{4}-\d{2}-\d{2}$/.test(g('date')) ? g('date') : '';
  const n = parseFloat(g('amount').replace(/[^0-9.]/g,''));
  const amount = isNaN(n) ? null : Math.round(n*100)/100;
  const old = existing || {};
  return {record:{ id:old.id||uid(), type, title, date, amount, currency:safeCurrency(g('currency'))||safeCurrency(old.currency), store:g('store').slice(0,120),
    who:g('who').slice(0,120), label:cleanCostLabel(g('label')), itemId:g('itemId')||null, maintId:g('maintId')||null, text:g('text').slice(0,20000),
    notes:g('notes').slice(0,2000), docs:Array.isArray(old.docs)?old.docs:[], createdAt:old.createdAt||nowMs||Date.now() }};
}
function receiptRows(o){
  const ws = o.warranties||[], ms = o.maintenance||[], rs = o.receipts||[];
  const byW = Object.fromEntries(ws.map(w=>[w.id,w])), byM = Object.fromEntries(ms.map(m=>[m.id,m]));
  const ctx = o.homes ? homeIndex(ws, ms, o.homes) : null;
  const shares = (rec, amount) => {
    if(!ctx) return [];
    if(Array.isArray(rec.split) && rec.split.length) return rec.split.filter(s=>s && ctx.homeIds.has(s.homeId)).map(s=>({homeId:s.homeId, amount:s.amount}));
    return [{homeId:homeIdOf(rec, ctx), amount}];
  };
  const rows = [];
  ws.forEach(w=>{
    const photos = (w.docs||[]).filter(d=>/receipt/i.test(d.label||''));
    if(!photos.length && !w.receiptText) return;
    const amount = w.price!=null?w.price:null;
    rows.push({key:'w:'+w.id, from:'item', id:w.id, type:'purchase', title:w.name||'Item', date:w.purchased||'', amount,
      currency:w.currency||'', store:w.store||'', room:w.location||'', itemId:w.id, itemName:w.name||'', files:photos.length, hasText:!!w.receiptText, text:w.receiptText||'',
      homeShares:shares(w, amount)});
  });
  rs.forEach(r=>{
    const w = r.itemId && byW[r.itemId], m = r.maintId && byM[r.maintId];
    const amount = r.amount!=null?r.amount:null;
    rows.push({key:'r:'+r.id, from:'record', id:r.id, type:r.type||'purchase', title:r.title||'Receipt', date:r.date||'', amount,
      currency:r.currency||'', store:r.store||'', who:r.who||'', room:(w&&w.location)||(m&&m.location)||'', itemId:w?w.id:null, maintId:m?m.id:null,
      itemName:w?(w.name||''):(m?(m.name||m.title||''):''), files:(r.docs||[]).length, hasText:!!r.text, text:r.text||'', label:r.label||'',
      homeShares:shares(r, amount), split:Array.isArray(r.split)&&r.split.length>1});
  });
  let out = rows;
  if(ctx && o.homeId) out = rows.filter(x=>x.homeShares.some(s=>s.homeId===o.homeId)).map(x=>{
    const s = x.homeShares.find(y=>y.homeId===o.homeId);
    return x.split ? Object.assign({}, x, {amount:s.amount, wholeAmount:x.amount}) : x;
  });
  return out.sort((a,b)=> (b.date||'').localeCompare(a.date||'') || a.title.localeCompare(b.title));
}
function filterReceiptRows(rows, f){
  const q = String((f||{}).q||'').toLowerCase().trim();
  return (rows||[]).filter(r=>{
    if(f && f.year){ if(f.year==='none' ? !!r.date : !String(r.date).startsWith(f.year)) return false; }
    if(f && f.type && r.type!==f.type) return false;
    if(f && f.room){ if(f.room==='-' ? !!r.room : r.room!==f.room) return false; }
    if(f && f.label){ if(f.label==='-' ? !!r.label : r.label!==f.label) return false; }
    if(q && ![r.title,r.store,r.itemName,r.who,r.text,r.label,receiptTypeLabel(r.type)].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}
function receiptYears(rows){ return [...new Set((rows||[]).map(r=>String(r.date||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse(); }
function receiptTotals(rows, fallbackCurrency){
  const out = {count:0, unpriced:0, byCurrency:{}};
  (rows||[]).forEach(r=>{
    out.count++;
    if(r.amount==null){ out.unpriced++; return; }
    const c = r.currency||fallbackCurrency||'', t = out.byCurrency[c] = out.byCurrency[c] || {total:0, byType:{}, byRoom:{}, byHome:{}, byLabel:{}};
    const add = (o,k,v)=>{ o[k] = Math.round(((o[k]||0)+(v===undefined?r.amount:v))*100)/100; };
    t.total = Math.round((t.total+r.amount)*100)/100; add(t.byType, r.type); add(t.byRoom, r.room||''); add(t.byLabel, r.label||'');
    (r.homeShares||[]).forEach(s=>{ if(s.amount!=null) add(t.byHome, s.homeId, s.amount); });
  });
  return out;
}
function repairCostsFor(receipts, itemId){
  const by = {};
  (receipts||[]).forEach(r=>{ if(r.itemId===itemId && r.type==='repair' && r.amount!=null){ const c=r.currency||''; by[c]=Math.round(((by[c]||0)+r.amount)*100)/100; } });
  return by;
}
function sanitizeImportedReceipts(list, photos, idMap){
  const isImg = v => typeof v==='string' && isImageDataUrl(v);
  const map = idMap||{}, newPhotos = {};
  const receipts = (Array.isArray(list)?list:[]).filter(r=>r && typeof r==='object' && typeof r.title==='string').map(r=>{
    const res = receiptRecord(Object.assign({}, r, {amount:r.amount==null?'':String(r.amount)}), null);
    if(!res.record) return null;
    const out = res.record; out.id = uid(); out.createdAt = typeof r.createdAt==='number' ? r.createdAt : out.createdAt;
    out.itemId = r.itemId && map[r.itemId] || null; out.maintId = r.maintId && map[r.maintId] || null;
    out.docs = (Array.isArray(r.docs)?r.docs:[]).map(d=>{ if(!d || !isImg((photos||{})[d.k])) return null; const k=uid(); newPhotos[k]=photos[d.k]; return {k, label:typeof d.label==='string'?d.label.slice(0,200):'Receipt'}; }).filter(Boolean);
    if(typeof r.homeId==='string') out.homeId = r.homeId.slice(0,40);
    if(Array.isArray(r.split)){ const sp = r.split.filter(s=>s && typeof s.homeId==='string' && typeof s.amount==='number' && isFinite(s.amount)).map(s=>({homeId:s.homeId.slice(0,40), amount:Math.round(s.amount*100)/100})); if(sp.length>1) out.split = sp; }
    return out;
  }).filter(Boolean);
  return {receipts, photos:newPhotos};
}
const PACK_NOTE = 'FrogCog keeps your records; it doesn’t give tax, legal or financial advice. Check with an adviser.';
const PACK_KINDS = [
  ['claim','Warranty claim','One item: the receipt, model, serial and purchase date, ready for the maker.'],
  ['insurance','Insurance contents list','Every item by room, with its value, photos and whether you hold a receipt. Keep a copy somewhere that isn’t your house.'],
  ['sale','Home sale','Every improvement to the house with its receipt, all time.'],
  ['year','A year for an accountant','One year’s receipts by kind.'],
  ['moving','Moving home','The items that stay with the house, with warranties, manuals and receipts.']];
function csvCell(v){
  let s = v==null ? '' : String(v);
  if(/^[=+\-@\t\r]/.test(s)) s = "'"+s;
  return /[",\n\r]/.test(s) || s!==s.trim() ? '"'+s.replace(/"/g,'""')+'"' : s;
}
function toCsv(columns, rows){ return [columns].concat(rows||[]).map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n'; }
const _yes = b => b ? 'Yes' : 'No';
const _money = (v, c) => v==null || v==='' ? '' : safeCurrency(c)+Number(v).toFixed(2);
const _ageYears = (purchased, todayIso) => { if(!purchased || !todayIso) return ''; const d=(parse(todayIso)-parse(purchased))/31557600000; return d>=0 ? String(Math.floor(d)) : ''; };
const _hasReceipt = w => !!(w.receiptText || (w.docs||[]).some(d=>/receipt/i.test(d.label||'')));
function packData(kind, o){
  const cur=o.region==='GB'?'£':'$', today=o.todayIso||'';
  const k=PACK_KINDS.find(x=>x[0]===kind); if(!k) return null;
  const multi = Array.isArray(o.homes) && o.homes.length>1;
  if(multi && !o.homeId && (kind==='sale' || kind==='moving')) return null;
  const hctx = multi ? homeIndex(o.warranties, o.maintenance, o.homes) : null;
  const homeName = id => { const h=(o.homes||[]).find(x=>x.id===id); return h ? h.name : ''; };
  const ws = multi && o.homeId && kind!=='claim' ? inHome(o.warranties, o.homeId, hctx) : (o.warranties||[]), rs=o.receipts||[];
  const base={kind, title:k[1], intro:k[2], columns:[], rows:[], totals:{}, docKeys:[], texts:[], pics:[]};
  const picBy={}, addPic=(key, caption, rowIndex)=>{ if(!key) return; let p=picBy[key]; if(!p){ p=picBy[key]={k:key, caption:caption||'', rows:[]}; base.pics.push(p); }
    if(rowIndex!=null && rowIndex>=0 && !p.rows.includes(rowIndex)) p.rows.push(rowIndex); };
  const capOf = parts => parts.filter(Boolean).join(' · ');
  if(multi && o.homeId && kind!=='claim') base.title += ': '+homeName(o.homeId);
  const homeCol = multi && !o.homeId && kind!=='claim';
  const rcptDocs = w => (w.docs||[]).filter(d=>/receipt/i.test(d.label||'')).map(d=>d.k);
  if(kind==='claim'){
    const w=ws.find(x=>x.id===o.itemId); if(!w) return null;
    base.title = 'Warranty claim: '+(w.name||'item');
    base.columns=['Detail','Value'];
    base.rows=[['Product',w.name],['Brand',w.manufacturer],['Model',w.model],['Serial',w.serial],['Bought from',w.store],['Purchase date',w.purchased],
      ['Price',_money(w.price, w.currency||cur)],['Warranty ends',w.expiry],['Registered with the maker',w.regConfirmed?'Yes, '+w.regConfirmed:''],['Receipt held',_yes(_hasReceipt(w))]]
      .filter(r=>r[1]!=null && r[1]!=='');
    if(o.claimAddress) base.rows.push(['Where it is installed', o.claimAddress]);
    base.docKeys=rcptDocs(w); if(w.receiptText) base.texts.push(w.receiptText);
    (w.docs||[]).filter(d=>/receipt/i.test(d.label||'')).forEach(d=>addPic(d.k, capOf([w.name, d.label||'Receipt'])));
    rs.filter(r=>r.itemId===w.id && r.type==='repair').forEach(r=>base.rows.push(['Repair '+(r.date||''), [r.title, _money(r.amount, r.currency||cur), r.who].filter(Boolean).join(' · ')]));
    return base;
  }
  if(kind==='insurance' || kind==='moving'){
    const hn = w => homeCol ? homeName(homeIdOf(w, hctx)) : '';
    const homeOrder = w => homeCol ? (o.homes.findIndex(h=>h.id===homeIdOf(w, hctx))) : 0;
    const renting = new Set(o.rentingHomes||[]);
    const leave = w => kind==='moving' ? w.goes==='me' : (w.goes==='home' && renting.has(homeIdOf(w, hctx)));
    const leftOut = ws.filter(leave).length;
    if(leftOut) base.intro += kind==='moving' ? ' Left out: '+leftOut+' marked “Comes with me”.' : ' Left out: '+leftOut+' marked as the landlord’s.';
    const items=ws.filter(w=>!leave(w)).sort((a,b)=>homeOrder(a)-homeOrder(b) || (a.location||'~').localeCompare(b.location||'~') || (a.name||'').localeCompare(b.name||''));
    const withHome = (cols) => homeCol ? ['Home'].concat(cols) : cols;
    const rowWithHome = (w, cells) => homeCol ? [hn(w)].concat(cells) : cells;
    if(kind==='insurance'){
      base.columns=withHome(['Room','Item','Brand','Model','Serial','Quantity','Age (years)','Purchase date','Purchase price','Your estimate to buy it again','Receipt held']);
      base.rows=items.map(w=>rowWithHome(w, [w.location||'',w.name||'',w.manufacturer||'',w.model||'',w.serial||'',String(w.qty||1),_ageYears(w.purchased, today),w.purchased||'',
        _money(w.price, w.currency||cur),_money(w.replaceEst, w.currency||cur),_yes(_hasReceipt(w))]));
      items.forEach(w=>{ if(w.price!=null){ const c=w.currency||cur; base.totals[c]=Math.round(((base.totals[c]||0)+w.price*(w.qty||1))*100)/100; } });
      base.docKeys=[].concat(...items.map(w=>(w.docs||[]).map(d=>d.k)));
      Object.keys(o.roomPhotos||{}).sort().forEach(room=>{ (o.roomPhotos[room]||[]).forEach(d=>base.docKeys.push(d.k)); });
      items.forEach((w, i)=>(w.docs||[]).forEach(d=>addPic(d.k, capOf([w.location, w.name, d.label||'Photo']), i)));
      Object.keys(o.roomPhotos||{}).sort().forEach(room=>{ (o.roomPhotos[room]||[]).forEach(d=>addPic(d.k, capOf([room, 'Room photo']))); });
    } else {
      base.columns=['Room','Item','Brand','Model','Serial','Warranty ends','Registered','Manual saved','Receipt held'];
      base.rows=items.map(w=>[w.location||'',w.name||'',w.manufacturer||'',w.model||'',w.serial||'',w.expiry||'',_yes(!!w.regConfirmed),_yes(!!w.manual),_yes(_hasReceipt(w))]);
      base.docKeys=[].concat(...items.map(rcptDocs));
      items.forEach((w, i)=>(w.docs||[]).filter(d=>/receipt/i.test(d.label||'')).forEach(d=>addPic(d.k, capOf([w.location, w.name, d.label||'Receipt']), i)));
    }
    return base;
  }
  let rows=receiptRows(multi ? {warranties:o.warranties||[], maintenance:o.maintenance||[], receipts:rs, homes:o.homes, homeId:o.homeId||''}
                             : {warranties:ws, maintenance:o.maintenance||[], receipts:rs});
  if(kind==='sale') rows=rows.filter(r=>r.type==='improvement');
  else { rows=filterReceiptRows(rows, {year:String(o.year||'')}); base.title='Receipts for '+(o.year||'a year')+(multi&&o.homeId?': '+homeName(o.homeId):''); }
  rows.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(homeCol) rows = [].concat(...rows.map(r=>(r.homeShares&&r.homeShares.length>1) ? r.homeShares.map(s=>Object.assign({}, r, {amount:s.amount, homeShares:[s]})) : [r]));
  const rHome = r => homeName(((r.homeShares||[])[0]||{}).homeId);
  base.columns = kind==='sale' ? ['Date','Improvement','Who did the work','Shop or company','Amount','Files'] : withHomeCols(['Date','Kind','What','Item','Room','Shop or who','Amount']);
  function withHomeCols(cols){ return homeCol ? ['Home'].concat(cols) : cols; }
  base.rows = rows.map(r=> kind==='sale'
    ? [r.date, r.title, r.who||'', r.store||'', _money(r.amount, r.currency||cur), String(r.files||0)]
    : (homeCol?[rHome(r)]:[]).concat([r.date, receiptTypeLabel(r.type), r.title, r.itemName||'', r.room||'', r.store||r.who||'', _money(r.amount, r.currency||cur)]));
  const t=receiptTotals(rows, cur); Object.keys(t.byCurrency).forEach(c=>{ base.totals[c]=t.byCurrency[c].total; });
  const byId=Object.fromEntries(rs.map(r=>[r.id,r])), byW=Object.fromEntries(ws.map(w=>[w.id,w]));
  rows.forEach((r, i)=>{ const src = r.from==='record' ? byId[r.id] : byW[r.id]; if(!src) return;
    const keys = r.from==='record' ? (src.docs||[]).map(d=>d.k) : rcptDocs(src);
    base.docKeys.push(...keys); if(r.text) base.texts.push(r.title+'\n'+r.text);
    keys.forEach(key=>addPic(key, capOf([r.date, r.title, r.store||r.who, _money(r.amount, r.currency||cur)]), i)); });
  base.docKeys=[...new Set(base.docKeys)]; base.texts=[...new Set(base.texts)];
  return base;
}
function packHtml(pack, images, appName, dateIso){
  const img = v => typeof v==='string' && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v);
  const pics = (pack.docKeys||[]).map(k=>(images||{})[k]).filter(img);
  const tot = moneyByCurrency(pack.totals);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>'+esc(pack.title)+'</title><style>body{font:14px/1.45 -apple-system,Segoe UI,Arial,sans-serif;color:#111;margin:24px;max-width:1000px}'
    + 'h1{font-size:20px;margin:0 0 4px}p{margin:4px 0}table{border-collapse:collapse;width:100%;margin:14px 0}th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;vertical-align:top}'
    + 'th{background:#f2f2f2}.pics img{max-width:300px;max-height:400px;margin:6px;border:1px solid #ccc}pre{white-space:pre-wrap;border:1px solid #ccc;padding:8px}'
    + '.note{color:#555;font-size:12px}@media print{body{margin:0}}</style></head><body>'
    + '<h1>'+esc(pack.title)+'</h1><p>'+esc(pack.intro)+'</p><p class="note">Made with '+esc(appName||'FrogCog')+(dateIso?' on '+esc(dateIso):'')+'. '+esc(pack.note!==undefined?pack.note:PACK_NOTE)+'</p>'
    + (pack.sections||[]).filter(s=>s.rows.length).map(s=>'<h2>'+esc(s.title)+'</h2><table><thead><tr>'+s.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'
        + s.rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>').join('')
    + (pack.sections ? '<h2>Every receipt</h2>' : '')
    + (pack.rows.length ? '<table><thead><tr>'+pack.columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'
        + pack.rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>' : '<p>Nothing to list yet.</p>')
    + (tot ? '<p><b>Total: '+esc(tot)+'</b></p>' : '')
    + (pics.length ? '<h2>Receipts and photos</h2><div class="pics">'+pics.map(p=>'<img src="'+p+'" alt="">').join('')+'</div>' : '')
    + (pack.texts||[]).map(t=>'<pre>'+esc(t)+'</pre>').join('')
    + '</body></html>';
}
const COST_LABEL_MAX = 40;
const cleanCostLabel = v => String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0, COST_LABEL_MAX);
function isContentsItem(w){ return !!(w && w.contents); }
function contentsItem(f, region, nowMs){
  const g = k => String((f||{})[k]==null ? '' : f[k]).trim();
  const name = g('name').slice(0,200);
  if(!name) return {error:'Give it a name, for example "Sofa" or "Road bike".'};
  const q = parseInt(g('qty'),10), num = k => { const n=parseFloat(g(k).replace(/[^0-9.]/g,'')); return isNaN(n) ? null : Math.round(n*100)/100; };
  return {record:{ id:uid(), type:'warranty', contents:true, name, category:g('category')||'Furniture', location:g('location').slice(0,120),
    manufacturer:g('manufacturer').slice(0,120), qty: q>0 ? Math.min(q, 9999) : 1, price:num('price'), replaceEst:num('replaceEst'),
    currency: region==='GB' ? '£' : '$', purchased:/^\d{4}-\d{2}-\d{2}$/.test(g('purchased'))?g('purchased'):'', notes:g('notes').slice(0,2000),
    docs:[], source:'inventory', createdAt:nowMs||Date.now() }};
}
function regStatusOf(w, isReady){
  if(w.regConfirmed) return {key:'confirmed', label:'✓ Registered', cls:'creg done'};
  if(w.regStarted||w.registeredDone) return {key:'started', label:'Registration started', cls:'creg need'};
  if(w.noWarranty || isContentsItem(w)) return {key:'none', label:'', cls:''};
  if(isReady && isReady()) return {key:'ready', label:'Register for warranty →', cls:'creg'};
  return {key:'need', label:'Add details to register →', cls:'creg need'};
}
function sanitizeImportedRoomPhotos(map, photos){
  const isImg = v => typeof v==='string' && isImageDataUrl(v);
  const rooms = {}, newPhotos = {};
  if(!map || typeof map!=='object' || Array.isArray(map)) return {rooms, photos:newPhotos};
  Object.keys(map).forEach(room=>{
    const name = String(room).trim().slice(0,120); if(!name || !Array.isArray(map[room])) return;
    map[room].forEach(d=>{ if(!d || !isImg((photos||{})[d.k])) return; const k=uid(); newPhotos[k]=photos[d.k]; (rooms[name]=rooms[name]||[]).push({k, label:'Room photo'}); });
  });
  return {rooms, photos:newPhotos};
}
function contentsTotals(items){
  const out={items:0, count:0, paid:{}, estimate:{}};
  (items||[]).forEach(w=>{ const q=w.qty||1, c=w.currency||''; out.items++; out.count+=q;
    if(w.price!=null) out.paid[c]=Math.round(((out.paid[c]||0)+w.price*q)*100)/100;
    if(w.replaceEst!=null) out.estimate[c]=Math.round(((out.estimate[c]||0)+w.replaceEst*q)*100)/100; });
  return out;
}
function moneyByCurrency(by){ return Object.keys(by||{}).filter(c=>by[c]).map(c=>safeCurrency(c)+Number(by[c]).toLocaleString('en-US',{minimumFractionDigits:by[c]%1?2:0, maximumFractionDigits:2})).join(' + '); }
function dueItems(opts){
  const o = opts || {};
  const todayIso = o.todayIso || iso(today0());
  const t0 = parse(todayIso);
  const dd = s => { const d = parse(s); return d ? Math.round((d - t0) / 86400000) : null; };
  const statusOf = w => { const d = dd(w.expiry); if(d===null) return 'none'; return d<0?'expired':d<=60?'soon':'active'; };
  const rows = [];
  (o.maintenance||[]).forEach(m => {
    const d = dd(m.nextDue); if(d===null) return;
    if(d<0)        rows.push({kind:'maint', urgency:0, days:d, id:m.id, title:m.title, sub:'Overdue · '+daysWord(d), action:'done'});
    else if(d<=14) rows.push({kind:'maint', urgency:1, days:d, id:m.id, title:m.title, sub:'Due '+(d===0?'today':'in '+daysWord(d).replace(' left','')), action:'done'});
    else if(d<=90) rows.push({kind:'maint', urgency:2, days:d, id:m.id, title:m.title, sub:'Upcoming · '+daysWord(d), action:'done'});
  });
  (o.warranties||[]).forEach(w => {
    const s = statusOf(w), d = dd(w.expiry);
    const reviewed = w.decision && w.decision.expiry===(w.expiry||'') && w.decision.type!=='later';
    if(planCovers(w, todayIso)){
      const pd = planDaysLeft(w, todayIso);
      if(planEndingSoon(w, todayIso)) rows.push({kind:'plan', urgency:1, days:pd, id:w.id, title:w.name, sub:'Protection plan ends '+(pd===0?'today':'in '+daysWord(pd).replace(' left','')), action:'plan-ending'});
    }
    else if(s==='expired' && !reviewed) rows.push({kind:'warranty', urgency:0, days:d, id:w.id, title:w.name, sub:'Warranty expired · '+daysWord(d), action:'review'});
    else if(s==='soon' && !reviewed) rows.push({kind:'warranty', urgency:1, days:d, id:w.id, title:w.name, sub:'Warranty ends in '+daysWord(d).replace(' left',''), action:'review'});
    const rw = returnWindow(w, todayIso);
    if(rw && rw.daysLeft<=30) rows.push({kind:'return', urgency:rw.daysLeft<=7?1:2, days:rw.daysLeft, id:w.id, title:w.name, sub:'Return window closes '+(rw.daysLeft===0?'today':'in '+daysWord(rw.daysLeft).replace(' left','')), action:'open'});
    const rp = w.repair||{};
    if(rp.started && !rp.booked) rows.push({kind:'repair', urgency:1, days:0, id:w.id, title:w.name, sub:'Repair request started — was it booked?', action:'confirm-repair'});
    const rr = w.repairReferral||{};
    if(rr.startedAt && !rr.contactedAt) rows.push({kind:'repair', urgency:1, days:0, id:w.id, title:w.name, sub:'Repairer search started — did you contact one?', action:'confirm-oow'});
    if(w.plan && w.plan.state==='referred') rows.push({kind:'plan', urgency:1, days:0, id:w.id, title:w.name, sub:'Protection plan started — did you buy it?', action:'confirm-plan'});
    if(w.regStarted && !w.regConfirmed) rows.push({kind:'register', urgency:1, days:0, id:w.id, title:w.name, sub:'Registration started — did it go through?', action:'confirm-reg'});
    else if(!w.regConfirmed && !w.regStarted){
      const dl = o.regRule ? registrationDeadline(w, o.regRule(w), todayIso, o.homeState) : null;
      if(dl && dl.notRequired){  }
      else if(dl){
        if(dl.daysLeft>=0 && s!=='expired') rows.push({kind:'register', urgency:dl.daysLeft<=14?1:2, days:dl.daysLeft, id:w.id, title:w.name,
          sub:'Register '+(dl.daysLeft===0?'today':'within '+daysWord(dl.daysLeft).replace(' left',''))+(dl.gives?' to keep '+dl.gives:''), action:'register'});
      } else if(s==='active'||s==='soon'){
        const since = dd(w.purchased);
        if(since!==null && since<=0 && since>=-120) rows.push({kind:'register', urgency:2, days:120+since, id:w.id, title:w.name, sub:'Register for warranty · bought '+daysWord(since), action:'register'});
      }
    }
  });
  (o.recalls||[]).forEach(r => rows.push({kind:'recall', urgency:0, days:-9999, id:r.key||r.id||'', title:r.title||'Possible safety recall', sub:r.sub||'Tap to check the official notice', action:'recall'}));
  const anyBrand = o.anyBrand!==undefined ? !!o.anyBrand : (o.warranties||[]).some(w=>w.manufacturer);
  if(o.recallOptInKnown===false && anyBrand) rows.push({kind:'setup', urgency:3, days:0, id:'recall-optin', title:'Turn on safety-recall checks', sub:'Sends only your appliance brands to '+recallSource(o.region).sends, action:'recall-optin'});
  if(o.seasonal){ const sr = seasonalDueRow(o.seasonal); if(sr) rows.push(sr); }
  (o.checklists||[]).forEach(r=>rows.push(Object.assign({}, r, {urgency:2})));
  if(o.backupNudge) rows.push({kind:'setup', urgency:3, days:1, id:'backup', title:'Back up your binder', sub:'Everything is on this device only', action:'backup'});
  rows.sort((a,b)=> a.urgency-b.urgency || a.days-b.days || String(a.title).localeCompare(String(b.title)));
  const counts = {overdue:0, soon:0, upcoming:0, setup:0};
  rows.forEach(r=>{ counts[['overdue','soon','upcoming','setup'][r.urgency]]++; });
  return {rows, counts};
}
const MAIN_HOME = 'main';
function homeIndex(warranties, maintenance, homes){
  return { items:Object.fromEntries((warranties||[]).filter(Boolean).map(w=>[w.id,w])),
    maint:Object.fromEntries((maintenance||[]).filter(Boolean).map(m=>[m.id,m])),
    homeIds:new Set((homes||[{id:MAIN_HOME}]).map(h=>h.id)) };
}
function homeIdOf(rec, ctx){
  if(!rec) return MAIN_HOME;
  const c = ctx || {}, ok = id => !!id && (!c.homeIds || c.homeIds.has(id));
  if(rec.itemId && c.items && c.items[rec.itemId] && c.items[rec.itemId]!==rec) return homeIdOf(c.items[rec.itemId], c);
  if(rec.maintId && c.maint && c.maint[rec.maintId] && c.maint[rec.maintId]!==rec) return homeIdOf(c.maint[rec.maintId], c);
  return ok(rec.homeId) ? rec.homeId : MAIN_HOME;
}
function inHome(list, homeId, ctx){ return homeId ? (list||[]).filter(r=>homeIdOf(r, ctx)===homeId) : (list||[]).slice(); }

export {
  APP_NAME,
  APP_SLUG,
  exportFilename,
  uid,
  esc,
  safeHttpsUrl,
  isImageDataUrl,
  safeCurrency,
  safeFileName,
  telHref,
  upkeepReminder,
  US_STATES,
  usStateCode,
  registrationDeadline,
  consumableQuery,
  amazonSearchUrl,
  PARTS_SHOPS,
  partsSearch,
  buyTarget,
  REPAIR_KINDS,
  repairGuideQuery,
  ifixitSearchUrl,
  consumableLabel,
  addressLabels,
  today0,
  iso,
  parse,
  addMonths,
  addYears,
  addDays,
  daysFromToday,
  warrantyStatus,
  daysWord,
  commissionNote,
  planStatus,
  homePlanStatus,
  _daysBetween,
  planDaysLeft,
  planInForce,
  planCovers,
  planEndingSoon,
  planFromForm,
  NO_PROVIDER_CATEGORIES,
  planDismissed,
  planEligible,
  planUrgency,
  displayStatus,
  coveredValue,
  regionName,
  defaultCurrency,
  manualSearchUrl,
  isPdfBytes,
  brandNamed,
  RECALL_KEYWORDS,
  hasWord,
  hasWordOrPlural,
  namesBrand,
  PRODUCT_TYPE_WORDS,
  recallRelevant,
  recallSource,
  recallLookupUrl,
  UK_NOTICE_ONLY_MEASURES,
  recallsFromResponse,
  CPSC_WARNINGS_PAGE,
  warningsForBrand,
  recallStateFor,
  recallCheckState,
  activeRecallMatches,
  icsEsc,
  icsStamp,
  icsEvent,
  buildICS,
  warrantyEvent,
  planEvent,
  returnWindow,
  regEvent,
  returnEvent,
  maintEvent,
  SEASONS,
  SEASON_START_MONTH,
  seasonOf,
  seasonLabel,
  seasonRank,
  seasonalState,
  SEASONS_KEPT,
  pruneSeasonal,
  tickSeasonal,
  untickSeasonal,
  hideSeasonal,
  unhideSeasonal,
  mergeSeasonal,
  seasonalDueRow,
  SEASON_EMOJI,
  nextSeasonStart,
  seasonEvents,
  SCHEMA_VERSION,
  validateImport,
  MANUAL_MAX_BYTES,
  BACKUP_MANUALS_MAX_BYTES,
  bytesToBase64,
  base64ToBytes,
  backupManualPlan,
  IMPORT_DAY_FIELDS,
  IMPORT_NUM_FIELDS,
  IMPORT_COUNT_FIELDS,
  IMPORT_MAX_TEXT,
  IMPORT_MAX_LIST,
  IMPORT_MAX_FIELDS,
  IMPORT_MAX_DEPTH,
  IMPORT_MAX_RECORDS,
  cleanImportedValue,
  cleanImportedRecord,
  sanitizeImportedRecords,
  RECEIPT_TYPES,
  receiptTypeLabel,
  receiptRecord,
  receiptRows,
  filterReceiptRows,
  receiptYears,
  receiptTotals,
  repairCostsFor,
  sanitizeImportedReceipts,
  PACK_NOTE,
  PACK_KINDS,
  csvCell,
  toCsv,
  _yes,
  _money,
  _ageYears,
  _hasReceipt,
  packData,
  packHtml,
  COST_LABEL_MAX,
  cleanCostLabel,
  isContentsItem,
  contentsItem,
  regStatusOf,
  sanitizeImportedRoomPhotos,
  contentsTotals,
  moneyByCurrency,
  dueItems,
  MAIN_HOME,
  homeIndex,
  homeIdOf,
  inHome,
};
