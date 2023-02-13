import { serve } from "https://deno.land/std@0.155.0/http/server.ts";

// import { NewsPath } from './env'

const HTML_ROUTE = new URLPattern({ pathname: "/html" });
const ROOT_ROUTE = new URLPattern({ pathname: "/" });
const STORE_ROUTE = new URLPattern({ pathname: "/store" });

const handler = (req: Request): Response => {
  const rootMatch = ROOT_ROUTE.exec(req.url);
  const storeMatch = STORE_ROUTE.exec(req.url);
  const htmlMatch = HTML_ROUTE.exec(req.url);
  if (rootMatch) {
    // extract user id from url
    // const id = match.pathname.groups.id;
    return new Response('not implemented');
  }
  if (storeMatch) {
    // store entry based on user id
    return new Response("not implemented");
  }
  if (htmlMatch) {
    // extract user id from url and return html representation of user stats
    return new Response('not implemented');
    // return new Response(insertInHtml(mapStoryToHtml(buf).join('')), {headers: {
    //     "content-type": "text/html; charset=utf-8",
    //   }});
  }
  return new Response("Not found (try /)", {
    status: 404,
  });
}
serve(handler)
