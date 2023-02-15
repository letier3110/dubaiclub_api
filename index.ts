import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { initializeApp } from 'https://cdn.skypack.dev/firebase@9.17.1/app'
import { getAuth, signInWithEmailAndPassword, updateCurrentUser } from 'https://cdn.skypack.dev/firebase@9.17.1/auth'
import {
  getFirestore,
  collection,
  getDocs,
  where,
  query,
  addDoc,
  deleteDoc
} from 'https://cdn.skypack.dev/firebase@9.17.1/firestore'
import { Application, Router, Status } from 'https://deno.land/x/oak@v11.1.0/mod.ts'

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
  router.get('/check', async (ctx) => {
    const password = ctx.request.url.searchParams.get('password')
    if (password !== env_password) {
      ctx.response.status = Status.Unauthorized
      return
    }
    const queryRef = collection(db, 'check')
    const sampleData = await getDocs(queryRef).then((querySnapshot) => {
      const data = querySnapshot.docs.map((x) => x.data())
      return data
    })
    ctx.response.body = sampleData // querySnapshot.docs.map((doc) => doc.data())
    ctx.response.type = 'json'
  })

  // Returns the first document that matches the title
  router.get('/check/:name', async (ctx) => {
    // const password = ctx.request.url.searchParams.get('password')
    // if (password !== env_password) {
    //   ctx.response.status = Status.Unauthorized
    //   return
    // }
    const { name } = ctx.params
    const check = await getDocs(query(collection(db, 'check'), where('name', '==', name))).then((querySnapshot) => {
      const data = querySnapshot.docs.map((x) => x.data())
      return data[0]
    })
    // const check = querySnapshot.docs.map((doc: any) => doc.data())[0]
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
    if(querySnapshot.docs.length > 0) {
      await deleteDoc(query(collection(db, 'check'), where('name', '==', check.name)))
    }
    await addDoc(collection(db, 'check'), check)
    // await checkRef.add(check)
    ctx.response.status = Status.NoContent
  })

  const app = new Application()
  // app.use(virtualStorage())
  app.use(
    oakCors({
      origin: "https://dubaiopen.club"
    }),
);

  app.use(async (ctx, next) => {
    const signedInUid = ctx.cookies.get('LOGGED_IN_UID')
    const signedInUser = signedInUid != null ? users.get(signedInUid) : undefined
    // if (!signedInUid || !signedInUser || !auth.currentUser) {
    const creds = await signInWithEmailAndPassword(auth, FIREBASE_USERNAME, FIREBASE_PASSWORD)
    const { user } = creds
    if (user) {
      users.set(user.uid, user)
      ctx.cookies.set('LOGGED_IN_UID', user.uid)
    } else if (
      signedInUser &&
      signedInUid &&
      typeof signedInUid === 'object' &&
      'name' in signedInUid &&
      signedInUid !== auth.currentUser?.uid
    ) {
      await updateCurrentUser(auth, signedInUser)
    }
    // }
    return next()
  })

  app.use(router.routes())
  app.use(router.allowedMethods())
  await app.listen({ port: 8000 })
}