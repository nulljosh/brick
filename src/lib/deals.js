// Deal score: how far under the typical price a home sits, measured against
// homes with the same bedroom count in the same search. 12 means 12% cheaper
// than typical; negative means pricier.
// ponytail: median of what is on screen, not a valuation model. A bedroom count
// with fewer than three homes has nothing fair to compare against, so it scores 0.

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// A single room in a shared house is not comparable to a whole unit.
const room = /\broom\b/i

export function scoreDeals(listings) {
  const groups = new Map()
  for (const l of listings) {
    const key = Math.floor(l.beds)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(l.price)
  }
  return listings.map(l => {
    const prices = groups.get(Math.floor(l.beds))
    const typical = prices.length >= 3 && !room.test(l.address || '') ? median(prices) : 0
    const deal = typical ? Math.round(((typical - l.price) / typical) * 100) : 0
    // Over 60% under is almost always a room share or a typo, not a find.
    return { ...l, deal: deal > 60 ? 0 : deal }
  })
}
