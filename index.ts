// import { config } from 'https://deno.land/x/dotenv/mod.ts'
// import { serve } from 'https://deno.land/std@0.155.0/http/server.ts'
// import * as bcrypt from 'https://deno.land/x/bcrypt/mod.ts'
// import 'https://deno.land/x/xhr@0.1.1/mod.ts'
// import { installGlobals } from 'https://deno.land/x/virtualstorage@0.1.0/mod.ts'
import { initializeApp } from 'https://cdn.skypack.dev/firebase@9.17.1/app'
import { getAuth, signInWithEmailAndPassword, updateCurrentUser } from 'https://cdn.skypack.dev/firebase@9.17.1/auth'
import {
  getFirestore,
  collection,
  getDocs,
  where,
  query,
  addDoc
} from 'https://cdn.skypack.dev/firebase@9.17.1/firestore'
import { Application, Router, Status } from 'https://deno.land/x/oak@v11.1.0/mod.ts'
// import { virtualStorage } from 'https://deno.land/x/virtualstorage@0.1.0/middleware.ts'
// installGlobals()

const env_password = Deno.env.get('password')
const FIREBASE_USERNAME = Deno.env.get('FIREBASE_USERNAME')
const FIREBASE_PASSWORD = Deno.env.get('FIREBASE_PASSWORD')
const FIREBASE_CONFIG = Deno.env.get('FIREBASE_CONFIG')

if (FIREBASE_CONFIG) {
  const firebaseConfig = JSON.parse(FIREBASE_CONFIG ?? '{}')
  const firebaseApp = initializeApp(firebaseConfig)
  const auth = getAuth(firebaseApp)
  const db = getFirestore(firebaseApp)

  const users = new Map()

  const router = new Router()

  // Returns any songs in the collection
  router.get('/check', async (ctx) => {
    //console.log('1')
    const password = ctx.request.url.searchParams.get('password')
    // //console.log(password, env_password)
    //console.log('2')
    if (password !== env_password) {
      ctx.response.status = Status.Unauthorized
      return
    }
    //console.log('3')
    const queryRef = collection(db, 'orders')
    //console.log('3.5')
    const sampleData = await getDocs(queryRef).then((querySnapshot) => {
      //console.log('3.6')
      const data = querySnapshot.docs.map((x) => x.data())
      //console.log('3.7')
      return data
    })
    //console.log('4')
    ctx.response.body = sampleData // querySnapshot.docs.map((doc) => doc.data())
    //console.log('5')
    ctx.response.type = 'json'
    //console.log('6')
  })

  // Returns the first document that matches the title
  router.get('/check/:name', async (ctx) => {
    //console.log('1')
    // const password = ctx.request.url.searchParams.get('password')
    //console.log('2')
    // if (password !== env_password) {
    //   ctx.response.status = Status.Unauthorized
    //   return
    // }
    //console.log('3')
    const { name } = ctx.params
    //console.log('4')
    const check = await getDocs(query(collection(db, 'orders'), where('name', '==', name))).then((querySnapshot) => {
      //console.log('3.6')
      const data = querySnapshot.docs.map((x) => x.data())
      //console.log('3.7')
      return data[0]
    })
    //console.log('5')
    // const check = querySnapshot.docs.map((doc: any) => doc.data())[0]
    //console.log('6')
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
    const password = ctx.request.url.searchParams.get('password')
    if (password !== env_password) {
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
    const querySnapshot = await getDocs(query(collection(db, 'check'), where('name', '==', check.name)))
    await Promise.all(querySnapshot.docs.map((doc: any) => doc.ref.delete()))
    await addDoc(collection(db, 'check'), check)
    // await checkRef.add(check)
    ctx.response.status = Status.NoContent
  })

  const app = new Application()
  // app.use(virtualStorage())

  app.use(async (ctx, next) => {
    //console.log('a')
    const signedInUid = ctx.cookies.get('LOGGED_IN_UID')
    //console.log('b')
    const signedInUser = signedInUid != null ? users.get(signedInUid) : undefined
    //console.log('c')
    // //console.log(JSON.stringify(signedInUid), signedInUser)
    // //console.log(JSON.stringify(auth.currentUser))
    // if (!signedInUid || !signedInUser || !auth.currentUser) {
    //console.log('d')
    const creds = await signInWithEmailAndPassword(auth, FIREBASE_USERNAME, FIREBASE_PASSWORD)
    //console.log('e')
    const { user } = creds
    //console.log('f')
    if (user) {
      //console.log('g')
      users.set(user.uid, user)
      //console.log('h')
      ctx.cookies.set('LOGGED_IN_UID', user.uid)
      //console.log('i')
    } else if (
      signedInUser &&
      signedInUid &&
      typeof signedInUid === 'object' &&
      'name' in signedInUid &&
      signedInUid !== auth.currentUser?.uid
    ) {
      //console.log('j')
      await updateCurrentUser(auth, signedInUser)
    }
    //console.log('k')
    // }
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
//     //console.log('bodyJson', JSON.stringify(bodyJson))
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
//     // //console.log(checkMatch.pathname.groups.id);  => "id"
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
