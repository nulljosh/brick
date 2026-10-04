import assert from 'node:assert/strict'
import { parseAsk, cleanFilters } from './ask.js'
import { scoreDeals } from './deals.js'

assert.deepEqual(parseAsk('2 bed under $2,500, best value'), { priceMax: 2500, beds: 2, sort: 'deal' })
assert.deepEqual(parseAsk('cheapest houses over 300k'), { priceMin: 300000, propertyType: 'house', sort: 'price-asc' })
assert.deepEqual(parseAsk('at least 3 bedrooms'), { beds: 3, sort: 'deal' }, 'a bedroom count is not a price')
assert.deepEqual(parseAsk('big townhouse up to 1.2m'), { priceMax: 1200000, propertyType: 'townhouse', sort: 'sqft-desc' })
assert.deepEqual(parseAsk(''), { sort: 'deal' })

assert.deepEqual(
  cleanFilters({ priceMax: 'DROP TABLE', beds: 99, propertyType: 'castle', sort: 'evil', extra: 1 }),
  { beds: 4 },
  'model output is clamped to the filter shape'
)
assert.deepEqual(cleanFilters({ priceMin: 5000, priceMax: 2000 }), { priceMax: 2000 })

const homes = [1000, 2000, 3000].map((price, i) => ({ id: i, beds: 2, price }))
const scored = scoreDeals([...homes, { id: 9, beds: 5, price: 100 }])
assert.deepEqual(scored.map(l => l.deal), [50, 0, -50, 0], 'scored against the same bedroom count; lone homes score 0')

console.log('ask + deals: ok')
