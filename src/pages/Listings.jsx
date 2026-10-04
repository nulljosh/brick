import { useMemo } from 'react'
import { filterListings } from '../lib/filterListings'
import { useFilters } from '../context/FiltersContext'
import { useFavorites } from '../context/FavoritesContext'
import { usePlace } from '../context/PlaceContext'
import { useI18n } from '../i18n'
import FilterBar from '../components/FilterBar'
import MapView from '../components/MapView'
import ListingCard from '../components/ListingCard'
import './Listings.css'

export default function Listings() {
  const { filters } = useFilters()
  const { favorites, favoriteSet } = useFavorites()
  const { place, listings, isLive, streetsUnavailable } = usePlace()
  const { t } = useI18n()

  const filtered = useMemo(
    () => filterListings(listings, filters, favoriteSet),
    [listings, filters, favoriteSet]
  )

  return (
    <div className="page">
      <FilterBar resultCount={filtered.length} />
      {!isLive && <p className="listings-notice">{t('sample_listings')}</p>}
      {!isLive && streetsUnavailable && <p className="listings-notice">{t('approx_locations')}</p>}
      <MapView listings={filtered} favorites={favorites} place={place} />
      <div className="listings-grid">
        {filtered.map((listing, i) => (
          <ListingCard key={listing.id} listing={listing} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="listings-empty fade-up">
            <h3>{t('no_results')}</h3>
            <p>{t('adjust_filters')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
