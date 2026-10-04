import { useFilters } from '../context/FiltersContext'
import { usePlace } from '../context/PlaceContext'
import { useI18n } from '../i18n'
import { marketFor, formatMoneyCompact } from '../lib/market'
import { propertyTypes } from '../data/listings'
import './FilterBar.css'

// A fixed "under $500K" band is meaningless in Lagos and in Zurich, so the
// bands are cut from the local market's own price scale.
function priceBands(market, mode) {
  const base = mode === 'rent'
    ? (400000 * market.level * market.grossYield) / 12
    : 400000 * market.level
  const steps = [0.5, 1, 2].map(m => roundNice(base * m))
  return [
    { min: 0, max: Infinity },
    { min: 0, max: steps[0] },
    { min: steps[0], max: steps[1] },
    { min: steps[1], max: steps[2] },
    { min: steps[2], max: Infinity }
  ]
}

function roundNice(n) {
  const mag = 10 ** Math.floor(Math.log10(n))
  return Math.round(n / (mag / 2)) * (mag / 2)
}

const bedOptions = [0, 1, 2, 3, 4]
const sortOptions = ['deal', 'price-asc', 'price-desc', 'newest', 'sqft-desc']
const sortKeys = {
  deal: 'sort_deal',
  'price-asc': 'sort_price_asc',
  'price-desc': 'sort_price_desc',
  newest: 'sort_newest',
  'sqft-desc': 'sort_largest'
}

export default function FilterBar({ resultCount }) {
  const { filters, updateFilter } = useFilters()
  const { place, mode, setMode } = usePlace()
  const { language, t } = useI18n()
  const market = marketFor(place.countryCode)
  const money = n => formatMoneyCompact(n, market.currency, language)

  function bandLabel(band, i) {
    if (i === 0) return t('any_price')
    if (band.max === Infinity) return `${money(band.min)}+`
    if (band.min === 0) return `< ${money(band.max)}`
    return `${money(band.min)} – ${money(band.max)}`
  }

  return (
    <div className="filter-bar fade-up">
      <div className="filter-row">
        <div className="filter-group">
          <span className="section-label">{place.name}</span>
          <div className="chip-row">
            <button className={`chip ${mode === 'sale' ? 'active' : ''}`} onClick={() => setMode('sale')}>{t('for_sale')}</button>
            <button className={`chip ${mode === 'rent' ? 'active' : ''}`} onClick={() => setMode('rent')}>{t('for_rent')}</button>
          </div>
        </div>
        <div className="filter-group">
          <span className="section-label">{t('price')}</span>
          <div className="chip-row">
            {priceBands(market, mode).map((band, i) => (
              <button
                key={i}
                className={`chip ${filters.priceMin === band.min && filters.priceMax === band.max ? 'active' : ''}`}
                onClick={() => { updateFilter('priceMin', band.min); updateFilter('priceMax', band.max) }}
              >
                {bandLabel(band, i)}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="section-label">{t('beds')}</span>
          <div className="chip-row">
            {bedOptions.map(value => (
              <button
                key={value}
                className={`chip ${filters.beds === value ? 'active' : ''}`}
                onClick={() => updateFilter('beds', value)}
              >
                {value === 0 ? t('any_beds') : `${value}+`}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="section-label">{t('type')}</span>
          <div className="chip-row">
            {['all', ...propertyTypes].map(value => (
              <button
                key={value}
                className={`chip ${filters.propertyType === value ? 'active' : ''}`}
                onClick={() => updateFilter('propertyType', value)}
              >
                {value === 'all' ? t('all_types') : t(value)}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="section-label">{t('sort')}</span>
          <div className="chip-row">
            {sortOptions.map(value => (
              <button
                key={value}
                className={`chip ${filters.sort === value ? 'active' : ''}`}
                onClick={() => updateFilter('sort', value)}
              >
                {t(sortKeys[value])}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="filter-result-count">
        <span className="section-label">{t('results', { n: new Intl.NumberFormat(language).format(resultCount) })}</span>
        <button
          className={`chip ${filters.favoritesOnly ? 'active' : ''}`}
          onClick={() => updateFilter('favoritesOnly', !filters.favoritesOnly)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={filters.favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {t('favorites')}
        </button>
      </div>
    </div>
  )
}
