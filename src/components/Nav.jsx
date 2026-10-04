import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n, supportedLanguages, languageLabel } from '../i18n'
import PlaceSearch from './PlaceSearch'
import './Nav.css'

export default function Nav() {
  const { user } = useAuth()
  const location = useLocation()
  const { language, setLanguage, t } = useI18n()

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="7" y="6" width="10" height="5.5" rx="1.2" fill="currentColor" opacity="0.9"/>
            <rect x="1.5" y="12.5" width="10" height="5.5" rx="1.2" fill="currentColor" opacity="0.6"/>
            <rect x="12.5" y="12.5" width="10" height="5.5" rx="1.2" fill="currentColor" opacity="0.9"/>
          </svg>
          <span>{t('brand')}</span>
        </Link>
        <PlaceSearch />
        <div className="nav-links">
          <Link to="/browse" className={`nav-link ${location.pathname === '/browse' ? 'active' : ''}`}>
            {t('listings')}
          </Link>
          <select
            className="nav-language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            aria-label={t('language')}
          >
            {supportedLanguages.map(code => (
              <option key={code} value={code}>{languageLabel(code)}</option>
            ))}
          </select>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            {user?.name?.split(' ')[0] || t('settings')}
          </Link>
        </div>
      </div>
    </nav>
  )
}
