import assert from 'node:assert/strict'
import { onRequestGet } from './listings.js'

const store = new Map()
globalThis.caches = { default: { match: async k => store.get(k.url), put: async (k, r) => store.set(k.url, r) } }
globalThis.fetch = async url => {
  assert.match(String(url), /api\.rentcast\.io\/v1\/listings\/sale/)
  return Response.json([
    { id: 'a/1', addressLine1: '1 Main St', city: 'Austin', price: 500000, bedrooms: 3, bathrooms: 2, squareFootage: 1800, propertyType: 'Condo', latitude: 30.2, longitude: -97.7, daysOnMarket: 4 },
    { id: 'bad', price: 1 }
  ])
}

const call = qs => onRequestGet({ request: new Request(`https://x.test/api/listings?${qs}`), env: { RENTCAST_KEY: 'k' } })

const ok = await (await call('lat=30.2&lng=-97.7&country=US&city=Austin&mode=sale')).json()
assert.equal(ok.listings.length, 1, 'rows without coordinates are dropped')
assert.equal(ok.listings[0].type, 'condo')
assert.equal(ok.listings[0].currency, 'USD')
assert.equal(ok.listings[0].id, 'rc-a_1', 'ids are url safe')

const none = await (await call('lat=52.5&lng=13.4&country=DE&city=Berlin&mode=sale')).json()
assert.deepEqual(none.listings, [], 'no provider covers DE without keys for it')

assert.equal((await call('lat=x&lng=1')).status, 400)
console.log('listings api: ok')
