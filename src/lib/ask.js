// Turns "2 bed under 2500, best value" into browse filters. The rules parser
// runs with no network; /api/ask layers a language model on top and falls back
// to this. Both go through cleanFilters, so nothing but a valid filter set can
// ever reach the UI, whatever the model says.

export const sorts = ['deal', 'price-asc', 'price-desc', 'newest', 'sqft-desc']
const types = ['house', 'condo', 'townhouse']

function amount(text) {
  const n = parseFloat(text.replace(/[,\s]/g, ''))
  return /k$/i.test(text.trim()) ? n * 1e3 : /m$/i.test(text.trim()) ? n * 1e6 : n
}

export function cleanFilters(raw = {}) {
  const out = {}
  const pos = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)
  if (pos(raw.priceMax)) out.priceMax = raw.priceMax
  if (pos(raw.priceMin)) out.priceMin = raw.priceMin
  if (out.priceMin && out.priceMax && out.priceMin > out.priceMax) delete out.priceMin
  if (pos(raw.beds)) out.beds = Math.min(Math.floor(raw.beds), 4)
  if (types.includes(raw.propertyType)) out.propertyType = raw.propertyType
  if (sorts.includes(raw.sort)) out.sort = raw.sort
  return out
}

const money = String.raw`[$€£¥]?\s*([\d][\d.,]*\s*[km]?)\b`
const notBeds = String.raw`(?!\s*\+?\s*(?:bed|br\b|bd\b|bath))`

export function parseAsk(q = '') {
  const s = q.toLowerCase()
  const raw = {}

  const beds = s.match(/(\d+)\s*\+?\s*(?:bed|br\b|bd\b)/)
  if (beds) raw.beds = +beds[1]

  const max = s.match(new RegExp(String.raw`(?:under|below|less than|max|up to|<)\s*${money}${notBeds}`))
  if (max) raw.priceMax = amount(max[1])
  const min = s.match(new RegExp(String.raw`(?:over|above|more than|at least|min|>)\s*${money}${notBeds}`))
  if (min) raw.priceMin = amount(min[1])

  if (/town\s?house|row house/.test(s)) raw.propertyType = 'townhouse'
  else if (/condo|apartment|flat\b/.test(s)) raw.propertyType = 'condo'
  else if (/\bhouse/.test(s)) raw.propertyType = 'house'

  if (/cheap|lowest|budget/.test(s)) raw.sort = 'price-asc'
  else if (/new|latest|just listed|recent/.test(s)) raw.sort = 'newest'
  else if (/big|large|space|spacious|room to/.test(s)) raw.sort = 'sqft-desc'
  else if (/luxur|high end|expensive|priciest/.test(s)) raw.sort = 'price-desc'
  else raw.sort = 'deal'

  return cleanFilters(raw)
}
