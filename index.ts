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

// frontend

// admin page, login component
// login => fetch server with user/pass => server checks hashed password to unhashed password => server returns token
// token is stored in local storage
// token is used to fetch data from server

// admin page, orders component
// show all currently open orders
// can view one order, edit mode is for store component, can share order by qr-code to check
// can create new order
// can close order

// admin page, store component
// menu with dishes, can add dishes to order
// starts with empty order, specify name of customer

// check page
// show dishes of check and status = inprogress | payed | completed

// backend

// /login - POST: try to login
// /register - POST: update credentials to access /login POST
// /check/:id - GET: check if bill exist
// /checks?status=[#all, completed, inprogress, payed] - GET: return all checks with status or query by status
// /checks/:day - GET: return checks by id of day

// general

// do not show anywhere "buy" or "pay" texts or buttons, only "order" or "complete"

// todo: add storage component for admin, to specify dishes and their supply. Validate in store component if dish is available