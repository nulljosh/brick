import { useMemo, useState } from 'react'
import { filterListings } from '../lib/filterListings'
import { useFilters } from '../context/FiltersContext'
import { useFavorites } from '../context/FavoritesContext'
import { usePlace } from '../context/PlaceContext'
import { useI18n } from '../i18n'
import FilterBar from '../components/FilterBar'
import MapView from '../components/MapView'
import ListingCard from '../components/ListingCard'
import AskBar from '../components/AskBar'
import { scoreDeals } from '../lib/deals'
import './Listings.css'

export default function Listings() {
  const { filters } = useFilters()
  const { favorites, favoriteSet } = useFavorites()
  const { place, listings, isLive, fetching, streetsUnavailable } = usePlace()
  const { t } = useI18n()

  const [askCount, setAskCount] = useState(0)
  const scored = useMemo(() => scoreDeals(listings), [listings])
  const filtered = useMemo(
    () => filterListings(scored, filters, favoriteSet),
    [scored, filters, favoriteSet]
  )

  return (
    <div className="page">
      <AskBar resultCount={filtered.length} onAnswer={() => setAskCount(n => n + 1)} />
      <FilterBar resultCount={filtered.length} />
      {fetching && <p className="listings-notice listings-fetching" role="status">{t('fetching_listings', { place: place.name })}</p>}
      {!fetching && !isLive && <p className="listings-notice">{t('sample_listings')}</p>}
      {!isLive && streetsUnavailable && <p className="listings-notice">{t('approx_locations')}</p>}
      <MapView listings={filtered} favorites={favorites} place={place} />
      <div className="listings-grid" key={askCount}>
        {filtered.map((listing, i) => (
          <ListingCard key={listing.id} listing={listing} index={i} />
        ))}
        {fetching && Array.from({ length: 8 }, (_, i) => <div key={i} className="listing-card card skeleton" aria-hidden="true" />)}
        {!fetching && filtered.length === 0 && (
          <div className="listings-empty fade-up">
            <h3>{t('no_results')}</h3>
            <p>{t('adjust_filters')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
