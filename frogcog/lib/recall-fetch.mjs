/* FrogCog binder: the ONLY file that reaches the internet.
 *
 * It runs only when the person has switched the recall check on. It asks the official public recall list for each
 * brand in the binder, the way the FrogCog app does from a phone:
 *   - United States: the CPSC's database, www.saferproducts.gov
 *   - United Kingdom: the government's list, www.gov.uk
 * What is sent is a brand name (for example "Whirlpool") and nothing else: no model, serial number, date or name.
 * Those bodies see the request come from this computer's internet address, as any website does.
 *
 * For the United States it also downloads one file from frogcog.app: FrogCog's published copy of the CPSC's "stop
 * using this product" warnings, which the CPSC's database leaves out. It is the same file for everyone and no
 * brand is sent to get it.
 *
 * The addresses and the reading of the answers are the app's own code (app-core.mjs). Our tests fail if any other
 * file in the binder can open a connection, or if this one names any other host.
 */
import { recallLookupUrl, recallsFromResponse, warningsForBrand } from './app-core.mjs';

export const HOSTS = ['www.saferproducts.gov', 'www.gov.uk', 'frogcog.app'];
const WARNINGS_FILE = 'https://frogcog.app/cpsc-warnings.json';

async function getJson(url, fetchImpl){
  if (!HOSTS.includes(new URL(url).host)) throw new Error('not a recall list address');
  const r = await fetchImpl(url, { signal: AbortSignal.timeout(20_000), headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('answered ' + r.status);
  return r.json();
}

/* One brand at a time is asked of the public list. Returns { byBrand: { 'whirlpool': [notices] }, asked: [...] }.
   A brand whose lookup failed is left out of byBrand, which keeps what was known about it and marks the check
   incomplete (the app's rule). */
export async function fetchRecalls(region, brands, fetchImpl = fetch){
  const byBrand = {}, asked = [];
  let feed = null;
  if (region === 'US') { try { const j = await getJson(WARNINGS_FILE, fetchImpl); if (j && Array.isArray(j.warnings)) feed = j; } catch (e) {} }
  await Promise.all(brands.map(async brand => {
    const url = recallLookupUrl(region, brand);
    asked.push({ brand, host: new URL(url).host });
    try { byBrand[brand.toLowerCase()] = recallsFromResponse(region, await getJson(url, fetchImpl), brand); } catch (e) {}
  }));
  if (region === 'US') {
    if (!feed) for (const k of Object.keys(byBrand)) delete byBrand[k];
    else for (const brand of brands) { const k = brand.toLowerCase(); if (k in byBrand) byBrand[k] = byBrand[k].concat(warningsForBrand(feed, brand)); }
  }
  return { byBrand, asked };
}
