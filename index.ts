import { config } from 'https://deno.land/x/dotenv/mod.ts'
import { serve } from 'https://deno.land/std@0.155.0/http/server.ts'
import * as bcrypt from 'https://deno.land/x/bcrypt/mod.ts'
import 'https://deno.land/x/xhr@0.1.1/mod.ts'
import { installGlobals } from 'https://deno.land/x/virtualstorage@0.1.0/mod.ts'
import firebase from 'https://cdn.skypack.dev/firebase@8.7.0/app'
import 'https://cdn.skypack.dev/firebase@8.7.0/auth'
import 'https://cdn.skypack.dev/firebase@8.7.0/firestore'
import { Application, Router, Status } from 'https://deno.land/x/oak@v7.7.0/mod.ts'
import { virtualStorage } from 'https://deno.land/x/virtualstorage@0.1.0/middleware.ts'
installGlobals()

const configEnv = Deno.env.get('FIREBASE_CONFIG')

if (configEnv) {
  const firebaseConfig = JSON.parse(configEnv ?? '{}')
  const firebaseApp = firebase.initializeApp(firebaseConfig, 'dubaiclub-2f11d')
  // @ts-ignore
  const auth = firebase.auth(firebaseApp)
  // @ts-ignore
  const db = firebase.firestore(firebaseApp)

  const users = new Map()

  const router = new Router()

  // Returns any songs in the collection
  router.get('/check', async (ctx) => {
    const password = ctx.request.url.searchParams.get('password');
    if(password !== Deno.env.get('password')) {
      ctx.response.status = Status.Unauthorized
      return
    }
    const querySnapshot = await db.collection('orders').get()
    ctx.response.body = querySnapshot.docs.map((doc: any) => doc.data())
    ctx.response.type = 'json'
  })

  // Returns the first document that matches the title
  router.get('/check/:name', async (ctx) => {
    const password = ctx.request.url.searchParams.get('password');
    if(password !== Deno.env.get('password')) {
      ctx.response.status = Status.Unauthorized
      return
    }
    const { name } = ctx.params
    const querySnapshot = await db.collection('orders').where('name', '==', name).get()
    const check = querySnapshot.docs.map((doc: any) => doc.data())[0]
    if (!check) {
      ctx.response.status = 404
      ctx.response.body = `The check titled "${ctx.params.name}" was not found.`
      ctx.response.type = 'text'
    } else {
      ctx.response.body = check
      ctx.response.type = 'json'
    }
  })

  function isCheck(value: any) {
    return typeof value === 'object' && value !== null && 'name' in value
  }

  // Removes any songs with the same title and adds the new song
  router.post('/check', async (ctx) => {
    const password = ctx.request.url.searchParams.get('password');
    if(password !== Deno.env.get('password')) {
      ctx.response.status = Status.Unauthorized
      return
    }
    const body = ctx.request.body()
    if (body.type !== 'json') {
      ctx.throw(Status.BadRequest, 'Must be a JSON document')
    }
    const check = await body.value
    if (!isCheck(check)) {
      ctx.throw(Status.BadRequest, 'Payload was not well formed')
    }
    const querySnapshot = await db.collection('check').where('name', '==', check.name).get()
    await Promise.all(querySnapshot.docs.map((doc: any) => doc.ref.delete()))
    const checkRef = db.collection('check')
    await checkRef.add(check)
    ctx.response.status = Status.NoContent
  })

  const app = new Application()
  app.use(virtualStorage())

  app.use(async (ctx, next) => {
    const signedInUid = ctx.cookies.get('LOGGED_IN_UID')
    const signedInUser = signedInUid != null ? users.get(signedInUid) : undefined
    if (!signedInUid || !signedInUser || !auth.currentUser) {
      const creds = await auth.signInWithEmailAndPassword(
        Deno.env.get('FIREBASE_USERNAME'),
        Deno.env.get('FIREBASE_PASSWORD')
      )
      const { user } = creds
      if (user) {
        users.set(user.uid, user)
        ctx.cookies.set('LOGGED_IN_UID', user.uid)
      } else if (
        signedInUser &&
        signedInUid &&
        typeof signedInUid === 'object' &&
        'name' in signedInUid &&
        // @ts-ignore
        signedInUid.uid !== auth.currentUser?.uid
      ) {
        await auth.updateCurrentUser(signedInUser)
      }
    }
    return next()
  })

  app.use(router.routes())
  app.use(router.allowedMethods())
  await app.listen({ port: 8000 })
}

// const { password } = config()

// import { NewsPath } from './env'

// https://data.mongodb-api.com/app/data-rlksh/endpoint/data/v1

// const LOGIN_ROUTE = new URLPattern({ pathname: '/login' })
// const REGISTER_ROUTE = new URLPattern({ pathname: '/register' })
// const CHECK_ROUTE = new URLPattern({ pathname: '/check' })
// const CHECK_ID_ROUTE = new URLPattern({ pathname: '/check/:id' })
// const CHECKS_FILTERING_ROUTE = new URLPattern({ pathname: '/checks/status/:status(all|completed|inprogress|payed)' })
// const CHECKS_PAGINATION_ROUTE = new URLPattern({ pathname: '/checks/:id' })

// let sessions: Record<string, string> = {
//   // 'token': 'user'
// }

// const loginHandler = async (req: Request): Promise<Response> => {
//   const { url, headers, body, method } = req

//   try {
//     const bodyJson = await body!.json()
//     console.log('bodyJson', JSON.stringify(bodyJson))
//     const { name, password: reqPassword } = bodyJson
//     if (bcrypt.compareSync(reqPassword, password)) {
//       const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
//       sessions[token] = name
//       return new Response(JSON.stringify({ token }), { headers: { 'content-type': 'application/json' } })
//     }
//   } catch (e) {
//     return new Response(JSON.stringify({ error: e.message }), { headers: { 'content-type': 'application/json' } })
//   }
//   return new Response('not implemented')
// }

// const handler = async (req: Request): Promise<Response> => {
//   const { url, headers, body, method } = req

//   const loginMatch = LOGIN_ROUTE.exec(url)
//   const registerMatch = REGISTER_ROUTE.exec(url)
//   const checkMatch = CHECK_ROUTE.exec(url)
//   const checkIdMatch = CHECK_ID_ROUTE.exec(url)
//   const checksFilteringMatch = CHECKS_FILTERING_ROUTE.exec(url)
//   const checksPaginationMatch = CHECKS_PAGINATION_ROUTE.exec(url)

//   const isPOST = method === 'POST'
//   const isGET = method === 'GET'
//   const isPUT = method === 'PUT'

//   if (loginMatch && isPOST && body !== null) {
//     // POST: try to login
//     return await loginHandler(req)
//   }
//   if (registerMatch && isPOST) {
//     // POST: update credentials to access /login POST
//     return new Response('not implemented')
//   }
//   if (checkMatch && isPOST) {
//     // POST: create new check
//     return new Response('not implemented')
//     // return new Response(insertInHtml(mapStoryToHtml(buf).join('')), {headers: {
//     //     "content-type": "text/html; charset=utf-8",
//     //   }});
//   }
//   if (checkIdMatch && (isGET || isPUT)) {
//     // console.log(checkMatch.pathname.groups.id);  => "id"
//     // GET: check if bill exist
//     // PUT: update check
//     return new Response('not implemented')
//     // return new Response(insertInHtml(mapStoryToHtml(buf).join('')), {headers: {
//     //     "content-type": "text/html; charset=utf-8",
//     //   }});
//   }
//   if (checksFilteringMatch && isGET) {
//     // GET: return all checks with status or query by status
//     return new Response('not implemented')
//     // return new Response(insertInHtml(mapStoryToHtml(buf).join('')), {headers: {
//     //     "content-type": "text/html; charset=utf-8",
//     //   }});
//   }
//   if (checksPaginationMatch && isGET) {
//     // GET: return checks by id of day
//     return new Response('not implemented')
//     // return new Response(insertInHtml(mapStoryToHtml(buf).join('')), {headers: {
//     //     "content-type": "text/html; charset=utf-8",
//     //   }});
//   }
//   return new Response('Not found', {
//     status: 404
//   })
// }
// serve(handler)

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
// /check - POST: create new check
// /check/:id - GET: check if bill exist, UPDATE: update check
// /checks?status=[#all, completed, inprogress, payed] - GET: return all checks with status or query by status
// /checks/:day - GET: return checks by id of day

// general

// do not show anywhere "buy" or "pay" texts or buttons, only "order" or "complete"

// todo: add storage component for admin, to specify dishes and their supply. Validate in store component if dish is available
