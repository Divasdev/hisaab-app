// Development only: prints every API call in the browser console, so you can see which screen
// uses REST and which uses GraphQL. Open DevTools → Console while clicking around.
const ON = import.meta.env.DEV;
const badge = (bg) => `background:${bg};color:#fff;padding:1px 6px;border-radius:4px;font-weight:600`;

export function logRest(route, ms, error) {
  if (!ON) return;
  console.info(`%cREST%c ${route} %c${Math.round(ms)} ms${error ? ` · ${error.status} ${error.detail}` : ''}`, badge('#3f4c8f'), '', 'color:#888');
}

export function logGraphQL({ name, query, variables, stats, errors, ms }) {
  if (!ON) return;
  console.groupCollapsed(`%cGraphQL%c query ${name} %c${Math.round(ms)} ms${errors ? ` · ${errors[0].extensions?.code}` : ''}`, badge('#e10098'), '', 'color:#888');
  console.log('POST /api/graphql');
  console.log('variables:', variables);
  console.log(query.trim());
  console.log(
    `Member/User lookups while answering: ${stats.lookups}. Without a DataLoader, each one is a separate SQL query ` +
      '(the N+1 problem). The backend batches them into one query per request.',
  );
  if (errors) console.warn('errors:', errors);
  console.groupEnd();
}
