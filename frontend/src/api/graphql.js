// GraphQL client.
// A GraphQL request is one POST to /api/graphql with JSON { query, variables }.
// The answer is JSON { data, errors }. HTTP status is usually 200 even when there are errors,
// so errors are read from the "errors" list (extensions.code), not from the status code.
import { ApiError, me, wait } from './client';
import { logGraphQL } from './devlog';
import { db } from '../mock/db';
import sdl from './schema.graphql?raw';

const CODE_TO_STATUS = { UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, GONE: 410, BAD_USER_INPUT: 422 };
const STATUS_TO_CODE = Object.fromEntries(Object.entries(CODE_TO_STATUS).map(([code, status]) => [status, code]));

/**
 * Runs a query and returns its data. Throws ApiError (with .status and .detail) if there were errors,
 * so screens handle GraphQL errors exactly like REST errors.
 *   const data = await gql(GROUP_SCREEN, { id: 1 });
 */
export async function gql(query, variables = {}) {
  const name = /\b(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? 'anonymous';
  const started = performance.now();
  const { body, stats } = await mockTransport(query, variables);
  logGraphQL({ name, query, variables, stats, errors: body.errors, ms: performance.now() - started });
  if (body.errors?.length) {
    const first = body.errors[0];
    throw new ApiError(CODE_TO_STATUS[first.extensions?.code] ?? 400, first.message);
  }
  return body.data;
}

/*
  Step 5 (real backend): replace mockTransport with this, and delete src/mock/:

  async function transport(query, variables) {
    const res = await fetch(`${API_URL}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 401) { clearToken(); throw new ApiError(401, 'Please log in again.'); }
    return { body: await res.json(), stats: { lookups: 0 } };
  }
*/

// ── Mock transport: runs the query in the browser against the schema + mock resolvers ──

let ready;
function loadEngine() {
  // Loaded on first use, so the graphql package is not in the main bundle.
  ready ??= Promise.all([import('graphql'), import('../mock/resolvers')]).then(([{ buildSchema, graphql }, { resolvers }]) => {
    const schema = buildSchema(sdl);
    for (const [typeName, fields] of Object.entries(resolvers)) {
      const typeFields = schema.getType(typeName).getFields();
      for (const [fieldName, resolve] of Object.entries(fields)) typeFields[fieldName].resolve = resolve;
    }
    return { schema, graphql };
  });
  return ready;
}

function codeFor(error) {
  const original = error.originalError;
  if (!original) return 'GRAPHQL_VALIDATION_FAILED'; // the query itself is wrong (unknown field, bad variable)
  if (original instanceof ApiError) return STATUS_TO_CODE[original.status] ?? 'BAD_REQUEST';
  return 'INTERNAL_SERVER_ERROR';
}

async function mockTransport(query, variables) {
  await wait();
  const { schema, graphql } = await loadEngine();
  const state = db.state;
  const user = me(state); // no valid token → ApiError 401, like an HTTP 401 from the real server
  const contextValue = { state, user, stats: { lookups: 0 }, cache: new Map() };
  const result = await graphql({ schema, source: query, variableValues: variables, contextValue });
  if (result.errors) result.errors.filter((e) => codeFor(e) === 'INTERNAL_SERVER_ERROR').forEach((e) => console.error(e.originalError));
  // JSON round trip: the screen gets exactly what would come over the network.
  const body = JSON.parse(
    JSON.stringify({
      data: result.data ?? null,
      errors: result.errors?.map((e) => ({ message: e.message, path: e.path, extensions: { code: codeFor(e) } })),
    }),
  );
  return { body, stats: contextValue.stats };
}
