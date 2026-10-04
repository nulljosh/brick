import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { listingFormatters } from '../lib/format'
import { useI18n } from '../i18n'
import './ListingCard.css'

export default function ListingCard({ listing, index = 0 }) {
  const { toggle, isFavorite } = useFavorites()
  const { language, t } = useI18n()
  const fmt = listingFormatters(listing, language, t)
  const fav = isFavorite(listing.id)

  return (
    <Link
      to={`/listing/${listing.id}`}
      className={`listing-card card fade-up`}
      style={{ animationDelay: `${(index % 12) * 0.04}s` }}
    >
      <div className="listing-card-img">
        {listing.photo && <img src={listing.photo} alt={listing.address} loading="lazy" />}
        <button
          className={`fav-btn ${fav ? 'active' : ''}`}
          onClick={e => { e.preventDefault(); toggle(listing.id) }}
          aria-label={t('favorites')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <span className="listing-type-badge">{t(listing.type)}</span>
        {listing.listedDaysAgo <= 3 && <span className="listing-new-badge">{t('new_badge')}</span>}
      </div>
      <div className="listing-card-body">
        <div className="listing-price">{fmt.price}</div>
        <div className="listing-meta">
          <span>{listing.beds} {t('bd')}</span>
          <span className="meta-dot" />
          <span>{listing.baths} {t('ba')}</span>
          <span className="meta-dot" />
          <span>{fmt.area}</span>
        </div>
        <div className="listing-address">{listing.address}</div>
        <div className="listing-neighborhood">{listing.neighborhood}</div>
      </div>
    </Link>
  )
}
