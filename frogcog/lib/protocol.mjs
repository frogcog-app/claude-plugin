/* FrogCog binder: speaking to the AI tool (MCP over stdin and stdout).
 *
 * Written by hand and kept small on purpose. A plugin arrives as its folder and nothing else, so the binder
 * carries no outside packages; the official MCP kit is far larger than Anthropic's directory allows a file to be.
 * Our tests drive this with the official MCP client, which is not shipped.
 *
 * A tool is { name, title, description, input, readOnly, destructive, run(args) }. `run` returns
 * { text, data } or throws an Error whose message is for the person.
 */
import { check } from './schema.mjs';

export const SERVER = { name: 'FrogCog binder', version: '0.1.11' };

export function describe(tool){
  return {
    name: tool.name, title: tool.title, description: tool.description, inputSchema: tool.input,
    annotations: { title: tool.title, readOnlyHint: !!tool.readOnly, destructiveHint: !!tool.destructive, idempotentHint: !!tool.readOnly, openWorldHint: !!tool.online },
  };
}

export async function callTool(tools, name, args){
  const tool = tools.find(t => t.name === name);
  if (!tool) return { content: [{ type: 'text', text: 'There is no tool called "' + name + '".' }], isError: true };
  const bad = check(tool.input, args || {});
  if (bad) return { content: [{ type: 'text', text: 'Not done: ' + bad + '. Nothing was changed.' }], isError: true };
  try {
    const r = await tool.run(args || {});
    // The binder's own words go in the data too, as `message`. Some AI tools hand the model only the data and not
    // the sentence (seen in Claude's Code tab, 2026-11-20), and the words are where the binder says what it saved,
    // where a date comes from and what it could not do.
    return { content: [{ type: 'text', text: r.text }], ...(r.data ? { structuredContent: { message: r.text, ...r.data } } : {}) };
  } catch (e) {
    return { content: [{ type: 'text', text: String((e && e.message) || e) }], isError: true };
  }
}

/* One message in, one answer out (or none, for a notification). */
export async function handle(msg, tools, instructions){
  const { id, method, params } = msg || {};
  if (id === undefined || id === null) return null;
  const ok = result => ({ jsonrpc: '2.0', id, result });
  if (method === 'initialize') return ok({ protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: SERVER, instructions });
  if (method === 'ping') return ok({});
  if (method === 'tools/list') return ok({ tools: tools.map(describe) });
  if (method === 'tools/call') return ok(await callTool(tools, params && params.name, params && params.arguments));
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } };
}
