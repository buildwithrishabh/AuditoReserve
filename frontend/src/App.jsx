import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  DoorOpen,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Maximize2,
  Menu,
  Mic,
  Music,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Sun,
  Moon,
  Tv,
  Volume2,
  Wifi,
  Wind,
  X,
  Zap
} from 'lucide-react'
import { api, getError, getAccessToken, setAccessToken } from './api'

// ============================================================================
// Utility Helpers
// ============================================================================

const money = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n || 0)

const dateText = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const hoursBetween = (a, b) => {
  if (!a || !b) return 0
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return Math.max(0, (bh * 60 + bm - ah * 60 - am) / 60)
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=85',
]

const imageFor = (a, i = 0) =>
  a?.images?.[i] || a?.images?.[0] || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]

const timeAgo = (d) => {
  const ms = Date.now() - new Date(d).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ============================================================================
// Shared Queries & Hooks
// ============================================================================


const downloadBookingReceipt = async (bookingId, onLoading, setToast) => {
  if (!bookingId) return
  try {
    if (onLoading) onLoading(true)
    const r = await api.get(`/payments/${bookingId}/receipt/download`, {
      responseType: 'blob',
    })
    const u = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = u
    a.download = `auditoreserve-receipt-${bookingId.slice(-8).toUpperCase()}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(u)
    if (setToast) {
      setToast('Official receipt downloaded successfully')
      window.setTimeout(() => setToast(''), 4000)
    }
  } catch (err) {
    if (setToast) {
      setToast('Failed to download receipt. Please try again.')
      window.setTimeout(() => setToast(''), 4000)
    }
  } finally {
    if (onLoading) onLoading(false)
  }
}

const useAuditoriums = () =>
  useQuery({
    queryKey: ['auditoriums'],
    queryFn: async () =>
      (await api.get('/auditoriums/viewAllAuditoriums')).data.auditoriums || [],
  })

const useBookings = (url = '/bookings/my-bookings?limit=50') =>
  useQuery({
    queryKey: ['bookings', url],
    queryFn: async () => {
      const response = (await api.get(url)).data
      const bookings = response.bookings || []
      bookings.pagination = response.pagination
      return bookings
    },
  })

function useUser() {
  const qc = useQueryClient()
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        if (!getAccessToken()) {
          const { data: refreshData } = await api.post('/auth/refresh')
          if (refreshData.accessToken) setAccessToken(refreshData.accessToken)
          return refreshData.user
        }
        const { data } = await api.get('/auth/me')
        if (data.accessToken) setAccessToken(data.accessToken)
        return data.user
      } catch {
        setAccessToken(null)
        return null
      }
    },
    retry: false,
    staleTime: 60000,
  })

  const data = me.data
  const unread = useQuery({
    queryKey: ['unread'],
    queryFn: async () => (await api.get('/notifications/unread-count')).data.count,
    enabled: !!data,
    refetchInterval: 60000,
    retry: false,
  })

  const navigate = useNavigate()
  const [toast, setToast] = useState('')
  const seen = useRef(new Set())

  useEffect(() => {
    if (!data) return
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
      'http://localhost:5000'
    const socket = io(socketUrl, {
      withCredentials: true,
      auth: { token: getAccessToken() },
    })

    socket.on('notification', (n) => {
      if (n._id && seen.current.has(n._id)) return
      if (n._id) seen.current.add(n._id)
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread'] })
      setToast(n.title || 'You have a new update')
      window.setTimeout(() => setToast(''), 4500)
    })

    return () => socket.disconnect()
  }, [data, qc])

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccessToken(null)
      qc.setQueryData(['me'], null)
      navigate('/')
    }
  }

  return {
    user: data || null,
    loading: me.isLoading,
    unread: unread.data || 0,
    logout,
    toast,
    setToast,
  }
}

// ============================================================================
// Core UI Components
// ============================================================================

function Brand({ inverse = false }) {
  return (
    <Link className={`brand ${inverse ? 'brand-light' : ''}`} to="/">
      <span className="brand-mark">
        <DoorOpen size={18} strokeWidth={2.2} />
      </span>
      <span className="brand-text">
        Audito<span className="brand-accent">Reserve</span>
      </span>
    </Link>
  )
}

function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ar_theme') || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('ar_theme', theme) } catch {}
  }, [theme])

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle color theme"
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

function Header({ auth }) {
  const [open, setOpen] = useState(false)
  const user = auth?.user
  const unread = auth?.unread || 0

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <div className="nav-left">
          <Brand />
        </div>

        <nav id="primary-nav" className={`nav-links ${open ? 'nav-open' : ''}`}>
          {user ? (
            <>
              <NavLink
                to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/auditoriums"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setOpen(false)}
              >
                Auditoriums
              </NavLink>
              {user.role === 'student' && (
                <NavLink
                  to="/student/my-bookings"
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={() => setOpen(false)}
                >
                  My bookings
                </NavLink>
              )}
              <NavLink
                to="/notifications"
                className={({ isActive }) => `notification-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Bell size={16} /> Notifications
                {unread > 0 && <span className="unread-dot">{unread}</span>}
              </NavLink>
              <button
                className="nav-text-button mobile-only-nav-action"
                onClick={() => {
                  setOpen(false)
                  auth.logout()
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/auditoriums"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setOpen(false)}
              >
                Auditoriums
              </NavLink>
              <a href="/#how-it-works" onClick={() => setOpen(false)}>
                How it works
              </a>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setOpen(false)}
              >
                Log in
              </NavLink>
              <Link
                className="button button-small nav-cta-btn mobile-only-nav-action"
                to="/register"
                onClick={() => setOpen(false)}
              >
                <span>Get started</span>
                <ArrowRight size={14} className="nav-cta-arrow" />
              </Link>
            </>
          )}
        </nav>

        <div className="nav-right">
          <ThemeToggle />
          {user ? (
            <button
              className="nav-text-button desktop-only-nav-action"
              onClick={() => {
                setOpen(false)
                auth.logout()
              }}
            >
              Log out
            </button>
          ) : (
            <Link
              className="button button-small nav-cta-btn desktop-only-nav-action"
              to="/register"
              onClick={() => setOpen(false)}
            >
              <span>Get started</span>
              <ArrowRight size={14} className="nav-cta-arrow" />
            </Link>
          )}
          <button
            className="icon-button mobile-menu"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-wrap">
          <Brand />
          <p className="footer-tagline">Campus spaces, thoughtfully reserved.</p>
        </div>
        <nav className="footer-links" aria-label="Footer Navigation">
          <Link to="/auditoriums">Auditoriums</Link>
          <a href="/#how-it-works">How it works</a>
          <a href="mailto:support@auditoreserve.com">Contact support</a>
        </nav>
        <span className="copyright">
          © {new Date().getFullYear()} AuditoReserve. All rights reserved.
        </span>
      </div>
    </footer>
  )
}

function PageState({ error, retry, title = 'Unable to load content' }) {
  return (
    <div className="state-panel">
      <div className="state-icon error-icon">
        <AlertCircle size={22} />
      </div>
      <h3>{title}</h3>
      <p>{error ? getError(error) : 'There was an unexpected problem loading this information.'}</p>
      {retry && (
        <button className="button button-secondary" onClick={retry}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  )
}

function LoadingCards({ count = 3 }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, x) => (
        <div className="skeleton-card" key={x}>
          <div className="skeleton skeleton-image" />
          <div className="skeleton-lines">
            <div className="skeleton" style={{ width: '75%' }} />
            <div className="skeleton short" />
            <div className="skeleton" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="panel">
      <div className="skeleton-lines">
        <div className="skeleton" style={{ height: '18px', width: '30%' }} />
        <div className="skeleton" style={{ height: '14px', width: '100%' }} />
        <div className="skeleton" style={{ height: '14px', width: '92%' }} />
        <div className="skeleton" style={{ height: '14px', width: '85%' }} />
      </div>
    </div>
  )
}

function AuditoriumCard({ item }) {
  return (
    <article className="venue-card">
      <Link className="venue-image-wrap" to={`/auditoriums/${item._id}`}>
        <img className="venue-image" src={imageFor(item)} alt={item.name} loading="lazy" />
        <div className="venue-image-scrim" />
        <div className="venue-image-top-badges">
          <span className="capacity-pill">
            <Users size={12} /> {item.capacity} seats
          </span>
        </div>
      </Link>
      <div className="venue-content">
        <div className="venue-heading">
          <Link to={`/auditoriums/${item._id}`} className="venue-name">
            {item.name}
          </Link>
        </div>
        {item.description && (
          <p className="venue-card-desc">
            {item.description.length > 95
              ? `${item.description.slice(0, 95)}...`
              : item.description}
          </p>
        )}
        {item.amenities && item.amenities.length > 0 && (
          <div className="amenities">
            {item.amenities.slice(0, 3).map((a) => (
              <span className="amenity" key={a}>
                {a}
              </span>
            ))}
            {item.amenities.length > 3 && (
              <span className="amenity more">+{item.amenities.length - 3}</span>
            )}
          </div>
        )}
        <div className="venue-card-footer">
          <div className="rate-badge">
            <span className="rate-amount">{money(item.basePrice)}</span>
            <span className="rate-caption">/ hour</span>
          </div>
          <Link className="venue-action-btn" to={`/auditoriums/${item._id}`}>
            <span>View details</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  )
}

function Status({ value }) {
  const labels = {
    pending: 'Pending review',
    approved: 'Payment due',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    rejected: 'Declined',
    expired: 'Expired',
  }
  return (
    <span className={`status status-${value}`}>
      <span className="status-dot" />
      {labels[value] || value}
    </span>
  )
}

function StatCard({
  title,
  value,
  icon,
  change,
  note = 'Across your reservations',
  badge,
  highlight,
  to,
}) {
  const icons = {
    calendar: CalendarDays,
    clock: Clock3,
    check: CheckCircle2,
    confirmed: DoorOpen,
    zap: Zap,
    shield: ShieldCheck,
    building: Building2,
    users: Users,
    rupee: () => <span className="stat-rupee-sign">₹</span>,
  }
  const Icon = icons[icon] || CalendarDays
  const isRupee = icon === 'rupee'

  const cardElement = (
    <div className={`stat-card ${highlight ? `stat-card-${highlight}` : ''} ${to ? 'stat-card-clickable' : ''}`}>
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        <div className={`stat-icon-wrap ${isRupee ? 'stat-icon-rupee' : ''}`}>
          {isRupee ? <Icon /> : <Icon size={16} />}
        </div>
      </div>
      <div className="stat-value-wrap">
        <strong>{value}</strong>
        {badge && <span className="stat-badge-tag">{badge}</span>}
        {change && <span className="stat-trend-tag">{change}</span>}
      </div>
      {note && <span className="stat-foot">{note}</span>}
    </div>
  )

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {cardElement}
      </Link>
    )
  }
  return cardElement
}

// ============================================================================
// Landing Page
// ============================================================================

function Landing({ auth }) {
  const q = useAuditoriums()
  const navigate = useNavigate()

  const totalSeats = useMemo(() => {
    if (!q.data?.length) return 0
    return q.data.reduce((acc, v) => acc + (v.capacity || 0), 0)
  }, [q.data])

  const steps = [
    {
      num: '01',
      title: 'Explore & compare',
      desc: 'Review venue photos, seating capacities, and included audio-visual equipment.',
      icon: Search,
    },
    {
      num: '02',
      title: 'Select date & slot',
      desc: 'Check the live interactive calendar and select a suitable time window.',
      icon: CalendarDays,
    },
    {
      num: '03',
      title: 'Request booking',
      desc: 'Detail your event purpose and submit your reservation for administrative review.',
      icon: CheckCircle2,
    },
    {
      num: '04',
      title: 'Approval & payment',
      desc: 'Once approved by campus admins, complete payment online to lock in the space.',
      icon: ShieldCheck,
    },
  ]

  return (
    <>
      <Header auth={auth} />
      <main className="home-page">
        {/* Clean Centered Hero Section with Unique Auditorium Pattern Backdrop */}
        <div className="hero-section-wrap">
          <div className="hero-pattern-backdrop" aria-hidden="true">
            <svg
              className="hero-pattern-svg"
              width="100%"
              height="100%"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="hero-dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.45" className="hero-svg-dot" />
                </pattern>
                <radialGradient id="hero-mask-grad" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="65%" stopColor="#fff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
                </radialGradient>
                <mask id="hero-svg-mask">
                  <rect width="100%" height="100%" fill="url(#hero-mask-grad)" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-dot-grid)" mask="url(#hero-svg-mask)" />
              {/* Concentric Auditorium Amphitheater Acoustic Waves & Stage Projection Rays */}
              <g mask="url(#hero-svg-mask)" className="hero-svg-waves-group">
                <circle cx="50%" cy="-40" r="180" className="hero-wave-ring" />
                <circle cx="50%" cy="-40" r="320" className="hero-wave-ring dashed" />
                <circle cx="50%" cy="-40" r="480" className="hero-wave-ring" />
                <circle cx="50%" cy="-40" r="660" className="hero-wave-ring dashed" />
                <circle cx="50%" cy="-40" r="860" className="hero-wave-ring" />
                <circle cx="50%" cy="-40" r="1080" className="hero-wave-ring dashed" />

                <line x1="50%" y1="-40" x2="10%" y2="100%" className="hero-wave-ray" />
                <line x1="50%" y1="-40" x2="25%" y2="100%" className="hero-wave-ray" />
                <line x1="50%" y1="-40" x2="40%" y2="100%" className="hero-wave-ray" />
                <line x1="50%" y1="-40" x2="50%" y2="100%" className="hero-wave-ray" />
                <line x1="50%" y1="-40" x2="60%" y2="100%" className="hero-wave-ray" />
                <line x1="50%" y1="-40" x2="75%" y2="100%" className="hero-wave-ray" />
                <line x1="50%" y1="-40" x2="90%" y2="100%" className="hero-wave-ray" />
              </g>
            </svg>
          </div>

          <section className="hero-centered">
            <div className="hero-badge-clean">
              <span className="hero-badge-dot" />
              <span>Campus Facilities Management</span>
              <span className="badge-sep">/</span>
              <span className="badge-sub">Academic Term 2026–27</span>
            </div>

            <h1 className="hero-title-clean">
              Reserve campus auditoriums{' '}
              <span className="hero-title-gradient">with verified availability.</span>
            </h1>

            <p className="hero-description-clean">
              A unified reservation workspace for university societies, faculty coordinators, and academic departments.
              Real-time slot locking, transparent hourly rates, and direct institutional sign-off.
            </p>

            <div className="hero-actions-clean">
              <Link className="button button-hero-primary" to="/auditoriums">
                <span>Browse auditoriums</span>
                <ArrowRight size={14} className="hero-btn-arrow" />
              </Link>
              <a className="button button-hero-secondary" href="#spaces">
                <span>View featured spaces</span>
              </a>
            </div>

            <div className="hero-trust-clean">
              <div className="trust-pill">
                <Check size={13} strokeWidth={2.4} />
                <span>Conflict-free calendar locking</span>
              </div>
              <div className="trust-pill">
                <Check size={13} strokeWidth={2.4} />
                <span>Direct departmental sign-off</span>
              </div>
              <div className="trust-pill">
                <Check size={13} strokeWidth={2.4} />
                <span>Instant GST invoices</span>
              </div>
            </div>
          </section>
        </div>

        {/* Live Campus Impact / Stats Strip (Full Width) */}
        <section className="metrics-strip-section">
          <div className="metrics-strip-inner">
            <div className="metric-box">
              <div className="metric-icon-wrap">
                <Building2 size={18} />
              </div>
              <div className="metric-text">
                <strong>
                  {q.data?.length
                    ? `${q.data.length} Campus ${q.data.length === 1 ? 'Venue' : 'Venues'}`
                    : 'Campus Auditoriums'}
                </strong>
                <span>
                  {totalSeats > 0
                    ? `${totalSeats.toLocaleString()}+ audited seats & AV`
                    : 'Audited seating & AV equipment'}
                </span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-wrap">
                <Zap size={18} />
              </div>
              <div className="metric-text">
                <strong>Real-Time Slot Engine</strong>
                <span>Zero double-booking conflicts</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-wrap">
                <ShieldCheck size={18} />
              </div>
              <div className="metric-text">
                <strong>Administrative Review</strong>
                <span>Official faculty coordination</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-wrap">
                <BadgeCheck size={18} />
              </div>
              <div className="metric-text">
                <strong>Verified Invoicing</strong>
                <span>Razorpay receipts & PDF vouchers</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section id="spaces" className="section featured-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HANDPICKED SPACES</span>
              <h2>Spaces worth gathering in.</h2>
              <p>Well-equipped campus venues for the moments that bring our community together.</p>
            </div>
            <Link className="text-link" to="/auditoriums">
              Browse all auditoriums <ArrowRight size={15} />
            </Link>
          </div>
          {q.isLoading ? (
            <LoadingCards count={3} />
          ) : q.isError ? (
            <PageState error={q.error} retry={q.refetch} />
          ) : q.data?.length === 1 ? (
            (() => {
              const v = q.data[0]
              const amenitiesList = Array.isArray(v.amenities) ? v.amenities.slice(0, 6) : []
              return (
                <div className="venue-spotlight-hero">
                  <Link className="spotlight-media-wrap" to={`/auditoriums/${v._id}`}>
                    <img
                      className="spotlight-media-img"
                      src={imageFor(v)}
                      alt={v.name}
                      loading="lazy"
                    />
                    <div className="spotlight-media-scrim" />
                    <div className="spotlight-media-badges">
                      <span className="spotlight-flagship-pill">
                        <Sparkles size={12} /> Featured Venue
                      </span>
                      <span className="spotlight-capacity-pill">
                        <Users size={12} /> {v.capacity} seats
                      </span>
                    </div>
                    <div className="spotlight-live-tag">
                      <span className="spotlight-live-dot" />
                      <span>Live Calendar Available</span>
                    </div>
                  </Link>
                  <div className="spotlight-content-wrap">
                    <div className="spotlight-content-top">
                      <span className="spotlight-eyebrow">CAMPUS AUDITORIUM</span>
                      <Link to={`/auditoriums/${v._id}`} className="spotlight-title-link">
                        <h3 className="spotlight-title">{v.name}</h3>
                      </Link>
                      {v.description && <p className="spotlight-desc">{v.description}</p>}
                      {amenitiesList.length > 0 && (
                        <div className="spotlight-amenities-grid">
                          {amenitiesList.map((amenity) => (
                            <div className="spotlight-amenity-item" key={amenity}>
                              <Check size={14} strokeWidth={2.5} />
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="spotlight-foot-row">
                      <div className="spotlight-rate-group">
                        <span className="spotlight-rate-val">{money(v.basePrice)}</span>
                        <span className="spotlight-rate-sub">per hour</span>
                      </div>
                      <div className="spotlight-action-buttons">
                        <Link
                          to={`/auditoriums/${v._id}#availability`}
                          className="button button-secondary"
                        >
                          <CalendarDays size={14} />
                          <span>Check calendar</span>
                        </Link>
                        <Link
                          to={`/auditoriums/${v._id}`}
                          className="button button-primary"
                        >
                          <span>View details</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()
          ) : q.data?.length ? (
            <div className={`card-grid ${q.data.length === 2 ? 'card-grid-2' : ''}`}>
              {q.data.slice(0, 3).map((v) => (
                <AuditoriumCard item={v} key={v._id} />
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <DoorOpen size={20} />
              <span>Auditoriums will appear here once they’re added by the campus team.</span>
            </div>
          )}
        </section>

        {/* How It Works Section (A CLEARER WAY TO BOOK with Interactive Hover Effects) */}
        <section id="how-it-works" className="section process-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A CLEARER WAY TO BOOK</span>
              <h2>From idea to confirmed in 4 steps.</h2>
              <p>A simple reservation process with all essential details in plain view.</p>
            </div>
          </div>
          <div className="steps-grid">
            {steps.map((s) => {
              const StepIcon = s.icon
              return (
                <div
                  className="step"
                  key={s.num}
                  onClick={() => navigate('/auditoriums')}
                >
                  <div className="step-top-row">
                    <span className="step-number">{s.num}</span>
                    <div className="step-icon-wrap">
                      <StepIcon size={16} />
                    </div>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <div className="step-hover-action">
                    <span>Learn more</span>
                    <ArrowRight size={13} className="step-arrow" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="closing-cta">
          <div className="closing-cta-content">
            <span className="eyebrow">YOUR NEXT EVENT STARTS HERE</span>
            <h2>Host your landmark event with confidence.</h2>
            <p>Explore campus auditoriums and verify availability for your upcoming dates in minutes.</p>
          </div>
          <div className="closing-cta-actions">
            <Link
              className="button button-cta-ghost"
              to={auth?.user ? (auth.user.role === 'admin' ? '/admin' : '/student') : '/login'}
            >
              <span>{auth?.user ? 'Open workspace' : 'Sign in to book'}</span>
            </Link>
            <Link className="button button-light" to="/auditoriums">
              <span>Explore auditoriums</span>
              <ArrowRight size={15} className="cta-btn-arrow" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

// ============================================================================
// Discovery / Catalog Page
// ============================================================================

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const options = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'capacity', label: 'Seating Capacity' },
  ]

  const activeOption = options.find((o) => o.value === value) || options[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="custom-dropdown-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`custom-dropdown-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <ArrowDownUp size={14} className="dropdown-icon" />
        <span className="dropdown-label">Sort:</span>
        <strong className="dropdown-val">{activeOption.label}</strong>
        <ChevronDown size={14} className={`dropdown-chevron ${open ? 'rotate' : ''}`} />
      </button>

      {open && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="dropdown-check" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Catalog({ auth }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = useAuditoriums()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [capacity, setCapacity] = useState(searchParams.get('capacity') || '')
  const [sort, setSort] = useState('recommended')
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef(null)

  useEffect(() => {
    const s = searchParams.get('search')
    const c = searchParams.get('capacity')
    if (s !== null) setSearch(s)
    if (c !== null) setCapacity(c)
  }, [searchParams])

  // Keyboard shortcut: Cmd+K or Ctrl+K focuses the search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const venues = useMemo(() => {
    let list = [...(q.data || [])]
    if (search.trim()) {
      const qLower = search.toLowerCase()
      list = list.filter((v) =>
        `${v.name} ${v.description} ${(v.amenities || []).join(' ')}`
          .toLowerCase()
          .includes(qLower)
      )
    }
    if (capacity) {
      list = list.filter((v) => v.capacity >= Number(capacity))
    }
    if (sort === 'price-low') list.sort((x, y) => x.basePrice - y.basePrice)
    if (sort === 'price-high') list.sort((x, y) => y.basePrice - x.basePrice)
    if (sort === 'capacity') list.sort((x, y) => y.capacity - x.capacity)
    return list
  }, [q.data, search, capacity, sort])

  const activeFiltersCount = (search ? 1 : 0) + (capacity ? 1 : 0)

  return (
    <>
      <Header auth={auth} />
      <main className="page-container">
        <div className="page-top">
          <div>
            <span className="eyebrow">CAMPUS COLLECTION</span>
            <h1>Find your auditorium.</h1>
            <p>Compare venues, verify live availability, and reserve the ideal room for your event.</p>
          </div>
          <div className="catalog-count">
            <strong>{q.data?.length ?? '—'}</strong>{' '}
            <span>{q.data?.length === 1 ? 'space available' : 'spaces available'}</span>
          </div>
        </div>

        <div className="catalog-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              ref={searchInputRef}
              placeholder="Search by venue name, amenities, or features"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd>⌘ K</kbd>
            )}
          </label>
          <button
            type="button"
            className={`button button-secondary filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="count-chip" style={{ padding: '1px 6px', fontSize: '10px' }}>
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown size={14} className={`filter-chevron ${showFilters ? 'rotate' : ''}`} />
          </button>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        <div className="quick-capacity-chips">
          <span className="chips-title">Minimum capacity:</span>
          {[
            { label: 'All Spaces', val: '' },
            { label: '100+ seats', val: '100' },
            { label: '250+ seats', val: '250' },
            { label: '500+ seats', val: '500' },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              className={`chip-pill ${capacity === c.val ? 'active' : ''}`}
              onClick={() => setCapacity(capacity === c.val ? '' : c.val)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {activeFiltersCount > 0 && (
          <div className="active-filters-bar">
            {search && (
              <span className="filter-chip">
                Search: &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} aria-label="Remove search filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {capacity && (
              <span className="filter-chip">
                Min {capacity} seats
                <button onClick={() => setCapacity('')} aria-label="Remove capacity filter">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              className="reset-link"
              onClick={() => {
                setSearch('')
                setCapacity('')
              }}
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className={`catalog-layout ${showFilters ? 'filters-open' : ''}`}>
          <aside className="filter-panel">
            <div className="filter-title">
              <span>Filter Spaces</span>
              {activeFiltersCount > 0 && (
                <button
                  className="reset-link"
                  onClick={() => {
                    setCapacity('')
                    setSearch('')
                  }}
                >
                  Reset all
                </button>
              )}
            </div>
            <label className="filter-label">
              Minimum Seating Capacity
              <input
                className="input"
                type="number"
                min="1"
                placeholder="e.g. 200"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
              <div className="capacity-presets">
                {['100', '250', '500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`capacity-preset-btn ${capacity === preset ? 'active' : ''}`}
                    onClick={() => setCapacity(capacity === preset ? '' : preset)}
                  >
                    {preset}+
                  </button>
                ))}
              </div>
            </label>
            <div className="filter-note">
              <Filter size={16} />
              <span>Full equipment lists and real-time calendars are shown on each auditorium's page.</span>
            </div>
          </aside>

          <section className="catalog-results">
            <div className="results-label">
              Showing {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
              <span>·</span>
              All campus auditoriums
            </div>

            {q.isLoading ? (
              <LoadingCards count={4} />
            ) : q.isError ? (
              <PageState error={q.error} retry={q.refetch} />
            ) : venues.length === 1 && !showFilters ? (
              (() => {
                const v = venues[0]
                const amenitiesList = Array.isArray(v.amenities) ? v.amenities.slice(0, 6) : []
                return (
                  <div className="venue-spotlight-hero">
                    <Link className="spotlight-media-wrap" to={`/auditoriums/${v._id}`}>
                      <img
                        className="spotlight-media-img"
                        src={imageFor(v)}
                        alt={v.name}
                        loading="lazy"
                      />
                      <div className="spotlight-media-scrim" />
                      <div className="spotlight-media-badges">
                        <span className="spotlight-flagship-pill">
                          <Sparkles size={12} /> Campus Venue
                        </span>
                        <span className="spotlight-capacity-pill">
                          <Users size={12} /> {v.capacity} seats
                        </span>
                      </div>
                      <div className="spotlight-live-tag">
                        <span className="spotlight-live-dot" />
                        <span>Live Calendar Available</span>
                      </div>
                    </Link>
                    <div className="spotlight-content-wrap">
                      <div className="spotlight-content-top">
                        <span className="spotlight-eyebrow">CAMPUS AUDITORIUM</span>
                        <Link to={`/auditoriums/${v._id}`} className="spotlight-title-link">
                          <h3 className="spotlight-title">{v.name}</h3>
                        </Link>
                        {v.description && <p className="spotlight-desc">{v.description}</p>}
                        {amenitiesList.length > 0 && (
                          <div className="spotlight-amenities-grid">
                            {amenitiesList.map((amenity) => (
                              <div className="spotlight-amenity-item" key={amenity}>
                                <Check size={14} strokeWidth={2.5} />
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="spotlight-foot-row">
                        <div className="spotlight-rate-group">
                          <span className="spotlight-rate-val">{money(v.basePrice)}</span>
                          <span className="spotlight-rate-sub">per hour</span>
                        </div>
                        <div className="spotlight-action-buttons">
                          <Link
                            to={`/auditoriums/${v._id}#availability`}
                            className="button button-secondary"
                          >
                            <CalendarDays size={14} />
                            <span>Check calendar</span>
                          </Link>
                          <Link
                            to={`/auditoriums/${v._id}`}
                            className="button button-primary"
                          >
                            <span>View details</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : venues.length ? (
              <div className={`card-grid ${venues.length <= 2 ? 'card-grid-2' : ''}`}>
                {venues.map((v) => (
                  <AuditoriumCard item={v} key={v._id} />
                ))}
              </div>
            ) : (
              <div className="state-panel">
                <div className="state-icon">
                  <Search size={22} />
                </div>
                <h3>No auditoriums match your filters</h3>
                <p>Try searching for a different keyword or lowering your minimum seating capacity.</p>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setSearch('')
                    setCapacity('')
                  }}
                >
                  Reset all filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ============================================================================
// Auditorium Detail Page
// ============================================================================

const getAmenityIcon = (name) => {
  const l = (name || '').toLowerCase()
  if (l.includes('projector') || l.includes('screen') || l.includes('display') || l.includes('led') || l.includes('tv')) return <Tv size={15} />
  if (l.includes('sound') || l.includes('audio') || l.includes('speaker')) return <Volume2 size={15} />
  if (l.includes('wi-fi') || l.includes('wifi') || l.includes('internet')) return <Wifi size={15} />
  if (l.includes('air') || l.includes('ac') || l.includes('ventilation') || l.includes('cooling')) return <Wind size={15} />
  if (l.includes('stage') || l.includes('mic') || l.includes('podium')) return <Mic size={15} />
  if (l.includes('parking') || l.includes('car')) return <Car size={15} />
  if (l.includes('power') || l.includes('backup') || l.includes('generator')) return <Zap size={15} />
  if (l.includes('green') || l.includes('room') || l.includes('dressing')) return <DoorOpen size={15} />
  if (l.includes('seat') || l.includes('chair') || l.includes('capacity')) return <Users size={15} />
  return <Sparkles size={15} />
}

function Detail({ auth }) {
  const user = auth?.user
  const { id } = useParams()
  const q = useQuery({
    queryKey: ['auditorium', id],
    queryFn: async () => (await api.get(`/auditoriums/viewAuditorium/${id}`)).data.auditorium,
  })

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [range, setRange] = useState({ start: '09:00', end: '11:00' })
  const [activeImageIndex, setActiveImageIndex] = useState(null)

  // Format month as YYYY-MM in local time to avoid UTC-offset shift
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`

  const cal = useQuery({
    queryKey: ['calendar', id, monthKey],
    queryFn: async () =>
      (
        await api.get('/bookings/calendar', {
          params: { auditoriumId: id, month: monthKey },
        })
      ).data.bookings || [],
  })

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstDayOffset = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  // Ensure selected day does not exceed days in the active month
  const safeDay = Math.min(selectedDay, daysInMonth)
  const selectedDateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
  const selectedDateObj = new Date(month.getFullYear(), month.getMonth(), safeDay)

  const isSelectedDatePast = selectedDateObj < today
  const isSelectedDateToday =
    selectedDateObj.getFullYear() === today.getFullYear() &&
    selectedDateObj.getMonth() === today.getMonth() &&
    selectedDateObj.getDate() === today.getDate()

  const hours = hoursBetween(range.start, range.end)

  // Match bookings on given date
  const getBookingsForDate = (dateKey) => {
    return (cal.data || []).filter((b) => {
      if (!b?.bookingDate) return false
      const rawPrefix = String(b.bookingDate).slice(0, 10)
      if (rawPrefix === dateKey) return true
      const d = new Date(b.bookingDate)
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return dStr === dateKey
    })
  }

  const selectedDayBookings = getBookingsForDate(selectedDateStr)

  // Check for time overlap with existing bookings on the selected day
  const conflictingBooking = selectedDayBookings.find((b) => {
    if (!b.startTime || !b.endTime) return false
    return range.start < b.endTime && range.end > b.startTime
  })

  // Quick jump to today
  const jumpToToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDay(today.getDate())
  }

  // Handle escape & arrow keys for image lightbox
  useEffect(() => {
    if (activeImageIndex === null) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveImageIndex(null)
      if (e.key === 'ArrowLeft' && q.data?.images?.length) {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : q.data.images.length - 1))
      }
      if (e.key === 'ArrowRight' && q.data?.images?.length) {
        setActiveImageIndex((prev) => (prev < q.data.images.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeImageIndex, q.data])

  if (q.isLoading) {
    return (
      <>
        <Header auth={auth} />
        <main className="page-container">
          <LoadingCards count={2} />
        </main>
        <Footer />
      </>
    )
  }

  if (q.isError) {
    return (
      <>
        <Header auth={auth} />
        <main className="page-container">
          <PageState error={q.error} retry={q.refetch} />
        </main>
        <Footer />
      </>
    )
  }

  const v = q.data
  const galleryImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : [imageFor(v, 0)]
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

  const bookingTargetUrl = `/student/book/${id}?date=${selectedDateStr}&start=${range.start}&end=${range.end}`

  return (
    <>
      <Header auth={auth} />
      <main className="page-container detail-page">
        {/* Navigation Breadcrumb */}
        <div className="breadcrumbs">
          <Link to="/auditoriums">Auditoriums</Link>
          <ChevronRight size={13} />
          <strong>{v.name}</strong>
        </div>

        {/* Gallery Showcase */}
        {galleryImages.length === 1 ? (
          <div className="detail-hero-showcase" onClick={() => setActiveImageIndex(0)}>
            <img className="hero-showcase-image" src={galleryImages[0]} alt={v.name} />
            <div className="hero-showcase-overlay" />
            <div className="hero-showcase-badge">
              <Building2 size={13} />
              <span>Campus Venue</span>
            </div>
            <button
              type="button"
              className="gallery-count gallery-count-btn"
              onClick={(e) => {
                e.stopPropagation()
                setActiveImageIndex(0)
              }}
              aria-label="View photo in full screen"
            >
              <Maximize2 size={12} />
              <span>1 photo</span>
            </button>
          </div>
        ) : galleryImages.length === 2 ? (
          <div className="detail-gallery-dual">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                className="gallery-dual-item"
                onClick={() => setActiveImageIndex(idx)}
                role="button"
                tabIndex={0}
                aria-label={`View photo ${idx + 1}`}
              >
                <img src={img} alt={`${v.name} view ${idx + 1}`} />
                <span className="gallery-expand-hint">
                  <Maximize2 size={13} />
                </span>
              </div>
            ))}
            <button
              type="button"
              className="gallery-count gallery-count-btn"
              onClick={() => setActiveImageIndex(0)}
            >
              <Maximize2 size={12} />
              <span>2 photos</span>
            </button>
          </div>
        ) : (
          <div className="detail-gallery-grid">
            <div
              className="gallery-main-wrap"
              onClick={() => setActiveImageIndex(0)}
              role="button"
              tabIndex={0}
              aria-label="View main photo"
            >
              <img className="gallery-main" src={galleryImages[0]} alt={v.name} />
              <span className="gallery-expand-hint">
                <Maximize2 size={13} /> Full view
              </span>
            </div>
            <div className="gallery-side">
              <div
                className="gallery-side-wrap"
                onClick={() => setActiveImageIndex(1)}
                role="button"
                tabIndex={0}
                aria-label="View photo 2"
              >
                <img src={galleryImages[1]} alt={`${v.name} seating`} />
                <span className="gallery-expand-hint">
                  <Maximize2 size={12} />
                </span>
              </div>
              <div
                className="gallery-side-wrap"
                onClick={() => setActiveImageIndex(2)}
                role="button"
                tabIndex={0}
                aria-label="View photo 3"
              >
                <img src={galleryImages[2]} alt={`${v.name} stage`} />
                <span className="gallery-expand-hint">
                  <Maximize2 size={12} />
                </span>
              </div>
            </div>
            <button
              type="button"
              className="gallery-count gallery-count-btn"
              onClick={() => setActiveImageIndex(0)}
            >
              <Maximize2 size={12} />
              <span>{galleryImages.length} photos</span>
            </button>
          </div>
        )}

        {/* Lightbox Modal */}
        {activeImageIndex !== null && (
          <div
            className="lightbox-overlay"
            onClick={() => setActiveImageIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo preview"
          >
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="lightbox-close"
                onClick={() => setActiveImageIndex(null)}
                aria-label="Close photo preview"
              >
                <X size={20} />
              </button>
              <img
                src={galleryImages[activeImageIndex]}
                alt={`${v.name} photo ${activeImageIndex + 1}`}
                className="lightbox-image"
              />
              {galleryImages.length > 1 && (
                <div className="lightbox-nav">
                  <button
                    type="button"
                    className="lightbox-nav-btn"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev > 0 ? prev - 1 : galleryImages.length - 1
                      )
                    }
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="lightbox-counter">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </span>
                  <button
                    type="button"
                    className="lightbox-nav-btn"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev < galleryImages.length - 1 ? prev + 1 : 0
                      )
                    }
                    aria-label="Next photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-layout">
          <section className="detail-info">
            <div className="detail-header-meta">
              <span className="eyebrow">CAMPUS VENUE</span>
              <span className="detail-live-tag">
                <span className="status-dot-pulse" /> Live Availability
              </span>
            </div>
            <h1>{v.name}</h1>
            <p className="detail-description">{v.description}</p>

            {/* Key Facts Cards */}
            <div className="detail-facts-grid">
              <div className="detail-fact-card">
                <div className="fact-icon-wrap fact-icon-blue">
                  <Users size={20} />
                </div>
                <div className="fact-content">
                  <span className="fact-label">Capacity</span>
                  <strong className="fact-value">{v.capacity} seats</strong>
                  <span className="fact-sub">Auditorium Seating</span>
                </div>
              </div>
              <div className="detail-fact-card">
                <div className="fact-icon-wrap fact-icon-green">
                  <Clock3 size={20} />
                </div>
                <div className="fact-content">
                  <span className="fact-label">Hourly Rate</span>
                  <strong className="fact-value">{money(v.basePrice)} <small>/ hr</small></strong>
                  <span className="fact-sub">Standard University Tariff</span>
                </div>
              </div>
              <div className="detail-fact-card">
                <div className="fact-icon-wrap fact-icon-purple">
                  <ShieldCheck size={20} />
                </div>
                <div className="fact-content">
                  <span className="fact-label">Booking Policy</span>
                  <strong className="fact-value">Admin Review</strong>
                  <span className="fact-sub">Pay after approval</span>
                </div>
              </div>
            </div>

            {/* Included Amenities */}
            <div className="detail-section">
              <div className="section-title-wrap">
                <h2>Included Amenities</h2>
                <span className="section-badge">{(v.amenities || []).length} available</span>
              </div>
              <div className="amenity-grid">
                {(v.amenities || []).map((a) => (
                  <div key={a} className="amenity-chip">
                    <span className="amenity-chip-icon">{getAmenityIcon(a)}</span>
                    <span className="amenity-chip-text">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="detail-section availability-section">
              <div className="calendar-header-bar">
                <div className="calendar-header-titles">
                  <h2>Availability Calendar</h2>
                  <p>Pick a date on the schedule to check live reserved slots and open times.</p>
                </div>
                <div className="calendar-controls">
                  {!isCurrentMonth && (
                    <button
                      type="button"
                      className="button button-ghost button-sm calendar-today-btn"
                      onClick={jumpToToday}
                    >
                      <RotateCcw size={13} /> Today
                    </button>
                  )}
                  <div className="calendar-month-selector">
                    <button
                      className="icon-button"
                      onClick={() =>
                        setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
                      }
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <strong>
                      {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </strong>
                    <button
                      className="icon-button"
                      onClick={() =>
                        setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
                      }
                      aria-label="Next month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weekdays Header */}
              <div className="calendar-grid calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <span key={i} className="calendar-weekday-cell">
                    {d}
                  </span>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="calendar-grid calendar-days-grid">
                {Array.from({ length: firstDayOffset }, (_, i) => (
                  <div key={`empty-${i}`} className="calendar-day-empty" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNumber = i + 1
                  const dateKey = `${month.getFullYear()}-${String(
                    month.getMonth() + 1
                  ).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                  const dayDate = new Date(month.getFullYear(), month.getMonth(), dayNumber)
                  const isPast = dayDate < today
                  const isToday =
                    dayDate.getFullYear() === today.getFullYear() &&
                    dayDate.getMonth() === today.getMonth() &&
                    dayDate.getDate() === today.getDate()
                  const isSelected = safeDay === dayNumber
                  const dayBookings = getBookingsForDate(dateKey)
                  const hasBookings = dayBookings.length > 0

                  return (
                    <button
                      key={dayNumber}
                      type="button"
                      aria-label={`${dateKey}${isToday ? ', today' : ''}${
                        hasBookings ? `, ${dayBookings.length} booking(s)` : ', available'
                      }`}
                      className={`calendar-day ${isSelected ? 'selected' : ''} ${
                        isPast ? 'disabled' : ''
                      } ${isToday ? 'is-today' : ''} ${
                        hasBookings ? 'day-has-bookings' : ''
                      }`}
                      disabled={isPast}
                      onClick={() => setSelectedDay(dayNumber)}
                    >
                      <span className="calendar-day-number">{dayNumber}</span>
                      {isToday && !isSelected && <span className="today-dot" title="Today" />}
                      {hasBookings && (
                        <span
                          className="booking-indicator-dot"
                          title={`${dayBookings.length} booking(s) scheduled`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Selected Day Schedule Inspector */}
              <div className="calendar-day-schedule">
                <div className="schedule-header">
                  <div className="schedule-title">
                    <CalendarCheck size={16} />
                    <strong>
                      {selectedDateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                    {isSelectedDateToday && <span className="schedule-today-pill">Today</span>}
                  </div>
                  <span
                    className={`schedule-status-badge ${
                      isSelectedDatePast
                        ? 'status-past'
                        : selectedDayBookings.length > 0
                        ? 'status-booked'
                        : 'status-clear'
                    }`}
                  >
                    {isSelectedDatePast
                      ? 'Past date'
                      : selectedDayBookings.length > 0
                      ? `${selectedDayBookings.length} reserved slot${
                          selectedDayBookings.length === 1 ? '' : 's'
                        }`
                      : 'All hours open'}
                  </span>
                </div>

                {isSelectedDatePast ? (
                  <div className="schedule-notice past-notice">
                    <Info size={15} />
                    <span>This date has passed. Please select today or a future date to book.</span>
                  </div>
                ) : selectedDayBookings.length > 0 ? (
                  <div className="schedule-slots-wrap">
                    <p className="schedule-slots-intro">
                      Existing reservations on central campus schedule for this date:
                    </p>
                    <div className="schedule-slots-list">
                      {selectedDayBookings.map((b, idx) => (
                        <div key={b._id || idx} className="schedule-slot-pill">
                          <Clock3 size={13} />
                          <span className="slot-time-text">
                            {b.startTime} – {b.endTime}
                          </span>
                          <span className="slot-status-tag">{b.status || 'Reserved'}</span>
                        </div>
                      ))}
                    </div>
                    <p className="schedule-slots-note">
                      You may request any time window outside of the above reserved hours.
                    </p>
                  </div>
                ) : (
                  <div className="schedule-notice open-notice">
                    <CheckCircle2 size={16} />
                    <span>No conflicting reservations. Venue is fully available throughout this date!</span>
                  </div>
                )}
              </div>

              {/* Calendar Legend */}
              <div className="calendar-legend">
                <span>
                  <i className="legend-available" /> Available
                </span>
                <span>
                  <i className="legend-booked" /> Reserved slots
                </span>
                <span>
                  <i className="legend-selected" /> Selected date
                </span>
                <span>
                  <i className="legend-today" /> Today
                </span>
              </div>

              {cal.isError && (
                <div className="inline-error">
                  <AlertCircle size={14} />
                  <span>Unable to refresh live availability.</span>{' '}
                  <button onClick={() => cal.refetch()}>Retry</button>
                </div>
              )}
            </div>
          </section>

          {/* Sticky Reservation Request Card */}
          <aside className="booking-card">
            <div className="booking-card-top">
              <span className="booking-card-label">
                <Sparkles size={12} /> RESERVATION REQUEST
              </span>
              <h2>Request this space</h2>
              <p>Select your date and reservation time. Your request is subject to administrative review.</p>
            </div>

            {/* Date Selection (Synchronized with Calendar) */}
            <label className="form-label">
              <span>Date</span>
              <div className="input-with-icon">
                <CalendarDays size={16} className="input-icon-left" />
                <input
                  className="input input-has-icon"
                  type="date"
                  value={selectedDateStr}
                  min={today.toISOString().slice(0, 10)}
                  onChange={(e) => {
                    if (!e.target.value) return
                    const [y, m, d] = e.target.value.split('-').map(Number)
                    setMonth(new Date(y, m - 1, 1))
                    setSelectedDay(d)
                  }}
                />
              </div>
            </label>

            {/* Quick Duration Presets */}
            <div className="quick-presets-group">
              <span className="presets-label">Quick duration:</span>
              <div className="presets-row">
                {[
                  { label: '2 hrs', h: 2 },
                  { label: '3 hrs', h: 3 },
                  { label: '4 hrs', h: 4 },
                  { label: 'Full Day (8h)', h: 8 },
                ].map((item) => {
                  const isActive = hours === item.h
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`preset-pill ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const [sh, sm] = range.start.split(':').map(Number)
                        const endHour = Math.min(23, sh + item.h)
                        setRange({
                          ...range,
                          end: `${String(endHour).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
                        })
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Slot Inputs */}
            <div className="time-row">
              <label className="form-label">
                <span>From</span>
                <input
                  className="input"
                  type="time"
                  value={range.start}
                  onChange={(e) => setRange({ ...range, start: e.target.value })}
                />
              </label>
              <label className="form-label">
                <span>Until</span>
                <input
                  className="input"
                  type="time"
                  value={range.end}
                  onChange={(e) => setRange({ ...range, end: e.target.value })}
                />
              </label>
            </div>

            {/* Overlap / Conflict Warning */}
            {conflictingBooking && (
              <div className="conflict-alert-box">
                <AlertTriangle size={15} />
                <div className="conflict-text">
                  <strong>Slot Conflict</strong>
                  <span>
                    Selected time overlaps with an existing reservation ({conflictingBooking.startTime} – {conflictingBooking.endTime}). Please pick another time.
                  </span>
                </div>
              </div>
            )}

            {/* Price Estimation */}
            <div className="estimate-box">
              <div className="estimate-details">
                <span className="estimate-label">Estimated Total</span>
                <small className="estimate-sub">
                  {hours > 0 ? (
                    <>
                      {money(v.basePrice)}/hr × {hours} {hours === 1 ? 'hour' : 'hours'}
                    </>
                  ) : (
                    'Select a valid start & end time'
                  )}
                </small>
              </div>
              <strong className="estimate-price">
                {hours > 0 ? money(Math.round(hours * v.basePrice)) : '—'}
              </strong>
            </div>

            {/* CTA Button */}
            <Link
              className={`button booking-submit ${
                hours <= 0 || conflictingBooking || isSelectedDatePast ? 'disabled-link' : ''
              }`}
              to={
                hours > 0 && !conflictingBooking && !isSelectedDatePast
                  ? user
                    ? bookingTargetUrl
                    : `/login?redirect=${encodeURIComponent(bookingTargetUrl)}`
                  : '#'
              }
            >
              {isSelectedDatePast ? (
                <>Date has passed</>
              ) : conflictingBooking ? (
                <>Time slot already booked</>
              ) : hours <= 0 ? (
                <>Select valid time window</>
              ) : user ? (
                <>
                  Continue to booking <ArrowRight size={15} />
                </>
              ) : (
                <>
                  Sign in to reserve <ArrowRight size={15} />
                </>
              )}
            </Link>

            <div className="secure-note">
              <ShieldCheck size={14} />
              <span>No payment required upfront. Billed only after campus approval.</span>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ============================================================================
// Authentication Pages (Login, Register, Forgot, Reset)
// ============================================================================

function AuthPage({ kind }) {
  const nav = useNavigate()
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const token = pathToken || searchParams.get('token')
  const redirectUrl = searchParams.get('redirect')
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const qc = useQueryClient()

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') nav('/')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nav])

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === 'login') {
        return (await api.post('/auth/login', { email: form.email, password: form.password })).data
      }
      if (kind === 'register') {
        return (await api.post('/auth/register', form)).data
      }
      if (kind === 'forgot') {
        return (await api.post('/auth/forget-password', { email: form.email })).data
      }
      return (await api.post(`/auth/reset-password/${token}`, { password: form.password })).data
    },
    onSuccess: (d) => {
      setError('')
      if (kind === 'login') {
        if (d.accessToken) setAccessToken(d.accessToken)
        qc.setQueryData(['me'], d.user)
        nav(redirectUrl || (d.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'))
      } else if (kind === 'register') {
        setMessage('Your account is ready. Please check your university email for the verification link.')
      } else if (kind === 'forgot') {
        setMessage('If that address is registered, a secure password reset link has been dispatched.')
      } else {
        setMessage('Password updated successfully. You can now sign in with your new credentials.')
      }
    },
    onError: (e) => setError(getError(e)),
  })

  const titles = {
    login: ['Sign in to AuditoReserve', 'Enter your university credentials to continue.'],
    register: ['Create an account', 'Enter your university details to get started.'],
    forgot: ['Reset your password', 'We’ll email you a secure link to reset your account.'],
    reset: ['Set a new password', 'Choose a strong password with at least 6 characters.'],
  }

  return (
    <div
      className="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) nav('/')
      }}
    >
      <div
        className="auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        aria-describedby="auth-description"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={() => nav('/')}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="auth-modal-top">
          <div className="brand-mark">
            <DoorOpen size={16} strokeWidth={2.2} />
          </div>
          <span className="auth-modal-brand-name">
            Audito<span className="brand-accent">Reserve</span>
          </span>
        </div>

        <div className="auth-modal-header">
          <h2 id="auth-title">{titles[kind][0]}</h2>
          <p id="auth-description">{titles[kind][1]}</p>
        </div>

        {['login', 'register'].includes(kind) && (
          <div className="auth-segmented-tabs">
            <button
              type="button"
              className={kind === 'login' ? 'active' : ''}
              onClick={() => {
                setError('')
                setMessage('')
                nav('/login')
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={kind === 'register' ? 'active' : ''}
              onClick={() => {
                setError('')
                setMessage('')
                nav('/register')
              }}
            >
              Create account
            </button>
          </div>
        )}

        {message ? (
          <div className="auth-success">
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <div>
              <span>{message}</span>
              {kind !== 'register' && (
                <div style={{ marginTop: '10px' }}>
                  <Link to="/login" className="text-link">
                    Continue to sign in <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              mutation.mutate()
            }}
          >
            {kind === 'register' && (
              <label className="form-label">
                Full name
                <input
                  className="input"
                  required
                  autoComplete="name"
                  placeholder="e.g. Aarav Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
            )}

            {kind !== 'reset' && (
              <label className="form-label">
                University email
                <input
                  className="input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="student@tmu.ac.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {kind === 'register' && (
                  <span className="field-hint" style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Institutional (@tmu.ac.in) email required
                  </span>
                )}
              </label>
            )}

            {['login', 'register', 'reset'].includes(kind) && (
              <label className="form-label">
                Password
                <span className="password-field">
                  <input
                    className="input"
                    type={visible ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={kind === 'login' ? 'current-password' : 'new-password'}
                    placeholder={kind === 'login' ? '••••••••' : 'At least 6 characters'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                  >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
                {kind === 'register' && (
                  <span className="field-hint">
                    Use at least 6 characters with letters and numbers.
                  </span>
                )}
              </label>
            )}

            {error && (
              <div className="form-error">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span>{error}</span>
                  {error.toLowerCase().includes('verify') && (
                    <Link to="/verify-email" style={{ display: 'block', marginTop: '4px', textDecoration: 'underline' }}>
                      Resend verification email
                    </Link>
                  )}
                </div>
              </div>
            )}

            <button className="button auth-submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Please wait…'
                : kind === 'login'
                ? 'Sign in'
                : kind === 'register'
                ? 'Create account'
                : kind === 'forgot'
                ? 'Send reset link'
                : 'Update password'}{' '}
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {kind === 'login' && (
          <div className="auth-modal-footer">
            <Link to="/forgot-password" className="auth-sub-link">
              Forgot password?
            </Link>
          </div>
        )}

        {kind === 'forgot' && (
          <div className="auth-modal-footer">
            <Link to="/login" className="auth-sub-link">
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        )}

        {kind === 'register' && (
          <div className="auth-terms">
            By creating an account, you agree to comply with campus venue regulations and university guidelines.
          </div>
        )}

        <div className="auth-modal-trust">
          <ShieldCheck size={13} />
          <span>Institutional authentication & verified access</span>
        </div>
      </div>
    </div>
  )
}

function VerifyPage() {
  const [search] = useSearchParams()
  const token = search.get('token')
  const q = useQuery({
    queryKey: ['verify', token],
    queryFn: async () => (await api.get('/auth/verify-email', { params: { token } })).data,
    enabled: !!token,
    retry: false,
  })

  return (
    <div className="center-state">
      <Brand />
      {q.isLoading && (
        <div className="state-panel">
          <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          <h3>Verifying your email…</h3>
          <p>Please wait while we confirm your university credentials.</p>
        </div>
      )}
      {q.isError && (
        <div className="state-panel">
          <div className="state-icon error-icon">
            <X size={20} />
          </div>
          <h3>Verification link expired or invalid</h3>
          <p>{getError(q.error)}</p>
          <Link className="button button-secondary" to="/login">
            Back to sign in
          </Link>
        </div>
      )}
      {q.isSuccess && (
        <div className="state-panel">
          <div className="state-icon success-icon">
            <Check size={22} />
          </div>
          <h3>Email verified successfully</h3>
          <p>Your university email is confirmed. You can now sign in and begin booking campus spaces.</p>
          <Link className="button" to="/login">
            Continue to sign in <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {!token && (
        <div className="state-panel">
          <div className="state-icon">
            <CircleHelp size={22} />
          </div>
          <h3>Verification token missing</h3>
          <p>Open the link sent to your university inbox to verify your account, or request a new one below.</p>
          <ResendForm />
        </div>
      )}
    </div>
  )
}

function ResendForm() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const m = useMutation({
    mutationFn: () => api.post('/auth/resend-verification', { email }),
    onSuccess: () => setNote('A new verification email has been dispatched.'),
    onError: (e) => setNote(getError(e)),
  })

  return (
    <form
      className="resend-form"
      onSubmit={(e) => {
        e.preventDefault()
        m.mutate()
      }}
    >
      <input
        className="input"
        type="email"
        required
        placeholder="you@university.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="button button-secondary" disabled={m.isPending}>
        {m.isPending ? 'Sending…' : 'Resend link'}
      </button>
      {note && <small>{note}</small>}
    </form>
  )
}

// ============================================================================
// Dashboard Shell & Navigation
// ============================================================================

function DashboardShell({ auth, title, subtitle, children }) {
  const [menu, setMenu] = useState(false)
  const user = auth.user
  const isAdmin = user?.role === 'admin'

  const navItems = isAdmin
    ? [
        ['/admin/dashboard', 'Overview', LayoutDashboard],
        ['/admin/bookings', 'Bookings', CalendarDays],
        ['/admin/auditoriums', 'Auditoriums', DoorOpen],
        ['/notifications', 'Notifications', Bell],
      ]
    : [
        ['/student/dashboard', 'Dashboard', LayoutDashboard],
        ['/auditoriums', 'Auditoriums', DoorOpen],
        ['/student/my-bookings', 'My bookings', CalendarDays],
        ['/notifications', 'Notifications', Bell],
      ]

  return (
    <div className="dashboard-shell">
      <aside id="workspace-nav" aria-label="Workspace navigation" className={`sidebar ${menu ? 'sidebar-open' : ''}`}>
        <Brand />
        <div className="side-org">
          <div className="org-avatar">AR</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Campus Operations</strong>
            <span>{isAdmin ? 'Administrator' : 'Student Workspace'}</span>
          </div>
          <BadgeCheck size={15} style={{ color: 'var(--brand-700)', flexShrink: 0 }} />
        </div>

        <span className="side-label">NAVIGATION</span>
        <nav className="side-nav">
          {navItems.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setMenu(false)}>
              <Icon size={16} />
              <span>{label}</span>
              {label === 'Notifications' && auth.unread > 0 && (
                <span className="side-count">{auth.unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-box">
            <CircleHelp size={16} />
            <span>
              <strong>Need assistance?</strong>
              <a href="mailto:support@auditoreserve.com">Contact campus support</a>
            </span>
          </div>

          <div className="profile-row">
            <div className="profile-avatar">{user?.name?.[0] || 'U'}</div>
            <div className="profile-meta">
              <strong>{user?.name || 'Account'}</strong>
              <span>{user?.email || ''}</span>
            </div>
            <button
              className="icon-button"
              aria-label="Log out"
              title="Log out"
              onClick={auth.logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="dash-main">
        <header className="dash-topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={menu}
            aria-controls="workspace-nav"
          >
            <Menu size={18} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <ThemeToggle />
            <span className="live-status">
              <i /> System operational
            </span>
            <Link className="topbar-bell" to="/notifications" aria-label="Notifications">
              <Bell size={17} />
              {auth.unread > 0 && <i />}
            </Link>
            <div className="topbar-avatar" title={user?.name}>
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </header>

        <div className="dash-content">
          <div className="dash-heading">
            <div>
              <span className="eyebrow">{subtitle || 'CAMPUS OPERATIONS'}</span>
              <h1>{title}</h1>
            </div>
            <div className="dash-heading-actions">{children?.actions}</div>
          </div>
          {children?.content}
        </div>
      </main>

      {menu && (
        <button
          className="sidebar-scrim"
          onClick={() => setMenu(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  )
}

function RequireRole({ auth, role, children }) {
  if (auth.loading) {
    return (
      <div className="auth-loading">
        <span className="loading-orbit" />
        <span>Loading workspace…</span>
      </div>
    )
  }
  if (!auth.user) return <Navigate to="/login" replace />
  if (role && auth.user.role !== role) {
    return (
      <Navigate
        to={auth.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
        replace
      />
    )
  }
  return children
}

// ============================================================================
// Student Views, Booking Modals & Drawers
// ============================================================================

function CancelBookingModal({ booking, onClose, onConfirm, isPending }) {
  if (!booking) return null
  return (
    <div className="confirm-modal-backdrop" onClick={onClose}>
      <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-icon warning">
          <AlertCircle size={22} />
        </div>
        <div className="confirm-modal-body">
          <h3>Cancel Booking Request?</h3>
          <p>
            Are you sure you want to cancel the reservation for{' '}
            <strong>{booking.auditorium?.name || 'this auditorium'}</strong> on{' '}
            <strong>{dateText(booking.bookingDate)}</strong> ({booking.startTime} – {booking.endTime})?
          </p>
          <div className="confirm-modal-warning">
            This will immediately release the hold on this time slot and make it available for other campus departments and societies.
          </div>
        </div>
        <div className="confirm-modal-actions">
          <button className="button button-secondary" onClick={onClose} disabled={isPending}>
            Keep Reservation
          </button>
          <button className="button button-danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Cancelling…' : 'Yes, Cancel Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StudentBookingDrawer({ booking, onClose, onCancelClick, auth }) {
  if (!booking) return null

  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const isApproved = booking.status === 'approved'
  const isConfirmed = booking.status === 'confirmed'
  const isPending = booking.status === 'pending'
  const isCancelled = ['cancelled', 'rejected', 'expired'].includes(booking.status)
  const duration = hoursBetween(booking.startTime, booking.endTime)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const copyRefId = () => {
    if (!booking._id) return
    navigator.clipboard?.writeText(booking._id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    downloadBookingReceipt(
      booking._id,
      setDownloading,
      auth?.setToast
    )
  }

  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="booking-drawer student-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="eyebrow">RESERVATION DETAILS</span>
            <h2>{booking.auditorium?.name || 'Auditorium'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close details (Esc)" title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-status-wrap">
          <Status value={booking.status} />
          <button
            type="button"
            className="booking-ref-chip interactive"
            onClick={copyRefId}
            title="Click to copy Booking ID"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>#{booking._id?.slice(-8).toUpperCase()}</span>
            {copied && <span className="copied-pill">Copied</span>}
          </button>
        </div>

        {/* Status contextual alert */}
        {isPending && (
          <div className="drawer-banner banner-pending">
            <Clock3 size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Under Administrative Review</strong>
              <span>Campus facility coordinators are verifying your schedule and AV requirements.</span>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="drawer-banner banner-approved">
            <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Request Approved — Payment Due</strong>
              <span>
                Please complete payment before{' '}
                <strong>{dateText(booking.paymentDeadline)}</strong> to lock in this reservation.
              </span>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="drawer-banner banner-confirmed">
            <BadgeCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Reservation Confirmed & Paid</strong>
              <span>Your slot is locked on the campus calendar. Official receipt is verified and ready.</span>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="drawer-banner banner-cancelled">
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Booking Inactive</strong>
              <span>This booking was {booking.status}. You may submit a new request if needed.</span>
            </div>
          </div>
        )}

        {/* Venue Preview */}
        {booking.auditorium && (
          <div className="drawer-venue-card">
            <img src={imageFor(booking.auditorium)} alt={booking.auditorium.name} />
            <div className="drawer-venue-info">
              <strong>{booking.auditorium.name}</strong>
              <span>
                <Users size={13} /> {booking.auditorium.capacity} seating capacity · {money(booking.auditorium.basePrice)}/hr
              </span>
              {booking.auditorium.location && (
                <span className="venue-location-sub">
                  <MapPin size={12} /> {booking.auditorium.location}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Key Event Details Grid */}
        <div className="drawer-details-grid">
          <div className="detail-item">
            <span>Event Date</span>
            <strong>{dateText(booking.bookingDate)}</strong>
          </div>
          <div className="detail-item">
            <span>Time Window</span>
            <strong>
              {booking.startTime} – {booking.endTime}
              {duration > 0 && <small className="duration-tag">{duration}h</small>}
            </strong>
          </div>
          <div className="detail-item">
            <span>Total Amount</span>
            <strong className="drawer-amount">{money(booking.totalPrice)}</strong>
          </div>
          <div className="detail-item">
            <span>Payment Status</span>
            <strong>
              {isConfirmed ? (
                <span className="pay-status-paid"><Check size={12} /> Paid in full</span>
              ) : isApproved ? (
                <span className="pay-status-due">Payment Due</span>
              ) : isCancelled ? (
                <span className="pay-status-pending">Cancelled / Closed</span>
              ) : (
                <span className="pay-status-pending">Awaiting Review</span>
              )}
            </strong>
          </div>
        </div>

        {/* Purpose Card */}
        <div className="drawer-purpose-card">
          <span className="purpose-label">Event Purpose & Scope</span>
          <p className="drawer-purpose-text">{booking.purpose || 'No event details specified.'}</p>
        </div>

        <div className="drawer-meta-bar">
          <span>Requested On: {dateText(booking.createdAt)}</span>
          {booking.paymentDeadline && isApproved && (
            <span className="deadline-highlight">Pay by: {dateText(booking.paymentDeadline)}</span>
          )}
        </div>

        {/* Drawer Actions */}
        <div className="drawer-actions">
          {isApproved && (
            <Link className="button button-action-pay" to={`/student/payment/${booking._id}`} onClick={onClose} style={{ flex: 1 }}>
              <CreditCard size={15} /> Complete Payment <ArrowRight size={14} />
            </Link>
          )}
          {isConfirmed && (
            <button
              className="button button-receipt-download"
              onClick={handleDownload}
              disabled={downloading}
              style={{ flex: 1 }}
            >
              {downloading ? (
                <>
                  <RefreshCw size={14} className="spin" /> Generating PDF…
                </>
              ) : (
                <>
                  <Download size={14} /> Download Official Receipt
                </>
              )}
            </button>
          )}
          {(isPending || isApproved) && onCancelClick && (
            <button
              className="button button-secondary subtle-danger"
              onClick={() => {
                onClose()
                onCancelClick(booking)
              }}
            >
              Cancel Request
            </button>
          )}
          <button className="button button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  )
}

function StudentDashboard({ user, auth }) {
  const q = useBookings()
  const qc = useQueryClient()
  const data = q.data || []
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const pending = data.filter((b) => b.status === 'pending').length
  const approved = data.filter((b) => b.status === 'approved').length
  const confirmed = data.filter((b) => b.status === 'confirmed').length
  const payable = data.find((b) => b.status === 'approved')

  // Find next upcoming confirmed booking
  const todayMidnight = new Date().setHours(0, 0, 0, 0)
  const upcomingConfirmed = data
    .filter((b) => b.status === 'confirmed' && new Date(b.bookingDate).getTime() >= todayMidnight)
    .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const cancel = useMutation({
    mutationFn: (id) => api.put(`/bookings/cancel/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      setCancelTarget(null)
      setSelectedBooking(null)
    },
  })

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}.`}
        subtitle="STUDENT WORKSPACE"
        children={{
          actions: (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link className="button" to="/student/book">
                <CalendarPlus size={14} /> Request a booking
              </Link>
              <Link className="button button-secondary" to="/auditoriums">
                <DoorOpen size={14} /> Browse auditoriums
              </Link>
            </div>
          ),
          content: (
            <>
              {q.isLoading ? (
                <LoadingRows />
              ) : q.isError ? (
                <PageState error={q.error} retry={q.refetch} />
              ) : (
                <>
                  <div className="stats-grid">
                    <StatCard
                      title="Total reservations"
                      value={data.length}
                      icon="calendar"
                      to="/student/my-bookings"
                    />
                    <StatCard
                      title="Pending review"
                      value={pending}
                      icon="clock"
                      to="/student/my-bookings?status=pending"
                    />
                    <StatCard
                      title="Approved (payment due)"
                      value={approved}
                      icon="check"
                      highlight={approved > 0 ? 'warning' : null}
                      to="/student/my-bookings?status=approved"
                    />
                    <StatCard
                      title="Confirmed bookings"
                      value={confirmed}
                      icon="confirmed"
                      to="/student/my-bookings?status=confirmed"
                    />
                  </div>

                  {/* Payment pending banner */}
                  {payable && (
                    <div className="payment-alert">
                      <div className="alert-icon">
                        <Clock3 size={18} />
                      </div>
                      <div className="alert-copy">
                        <strong>Action required: Reservation approved — payment pending</strong>
                        <span>
                          {payable.auditorium?.name} · {dateText(payable.bookingDate)} ({payable.startTime} – {payable.endTime}) · Payment due by{' '}
                          {dateText(payable.paymentDeadline)}
                        </span>
                      </div>
                      <Link className="button button-small" to={`/student/payment/${payable._id}`}>
                        Pay {money(payable.totalPrice)} <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}

                  {/* Next Confirmed Event Spotlight */}
                  {upcomingConfirmed && (
                    <div className="spotlight-card">
                      <div className="spotlight-left">
                        {upcomingConfirmed.auditorium && (
                          <img
                            className="spotlight-img"
                            src={imageFor(upcomingConfirmed.auditorium)}
                            alt={upcomingConfirmed.auditorium.name}
                          />
                        )}
                        <div className="spotlight-meta">
                          <span className="spotlight-tag">
                            <BadgeCheck size={13} /> Next Confirmed Event
                          </span>
                          <h3>{upcomingConfirmed.auditorium?.name || 'Auditorium'}</h3>
                          <p>
                            {dateText(upcomingConfirmed.bookingDate)} · {upcomingConfirmed.startTime} – {upcomingConfirmed.endTime}
                            {upcomingConfirmed.purpose
                              ? ` · ${
                                  upcomingConfirmed.purpose.length > 50
                                    ? `${upcomingConfirmed.purpose.slice(0, 50)}…`
                                    : upcomingConfirmed.purpose
                                }`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="spotlight-actions">
                        <button
                          className="button button-secondary button-small"
                          onClick={() => setSelectedBooking(upcomingConfirmed)}
                        >
                          View details
                        </button>
                        <button
                          className="button button-small"
                          disabled={downloadingId === upcomingConfirmed._id}
                          onClick={() =>
                            downloadBookingReceipt(
                              upcomingConfirmed._id,
                              (l) => setDownloadingId(l ? upcomingConfirmed._id : null),
                              auth?.setToast
                            )
                          }
                        >
                          {downloadingId === upcomingConfirmed._id ? (
                            <RefreshCw size={13} className="spin" />
                          ) : (
                            <FileText size={13} />
                          )}{' '}
                          Receipt PDF
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="dashboard-bottom-grid">
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <div className="panel-title-with-badge">
                            <h2>Recent Reservations</h2>
                            {data.length > 0 && (
                              <span className="count-chip">{data.length} total</span>
                            )}
                          </div>
                          <p>Track request statuses, payment schedules, and verified bookings.</p>
                        </div>
                        <Link className="text-link" to="/student/my-bookings">
                          View all <ArrowRight size={14} />
                        </Link>
                      </div>

                      {data.length ? (
                        <BookingTable
                          bookings={data.slice(0, 5)}
                          student
                          onRowClick={(b) => setSelectedBooking(b)}
                          onAction={(b) => (
                            <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                className="table-action action-details"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedBooking(b)
                                }}
                                title="View reservation details & receipt"
                              >
                                <Eye size={13} /> Details
                              </button>
                            </div>
                          )}
                        />
                      ) : (
                        <EmptyBookings />
                      )}
                    </div>

                    <div className="panel quick-actions-panel">
                      <div className="panel-header">
                        <div>
                          <h2>Quick Actions</h2>
                          <p>Jump straight to common campus tasks.</p>
                        </div>
                      </div>
                      <div className="quick-actions-grid">
                        <Link className="quick-action-card" to="/student/book">
                          <div className="quick-action-icon action-blue">
                            <CalendarPlus size={18} />
                          </div>
                          <div className="quick-action-info">
                            <strong>Request a Booking</strong>
                            <span>Submit a new auditorium reservation</span>
                          </div>
                          <ArrowRight size={15} className="quick-action-arrow" />
                        </Link>
                        <Link className="quick-action-card" to="/auditoriums">
                          <div className="quick-action-icon action-purple">
                            <DoorOpen size={18} />
                          </div>
                          <div className="quick-action-info">
                            <strong>Browse Auditoriums</strong>
                            <span>Compare capacities, AV & calendars</span>
                          </div>
                          <ArrowRight size={15} className="quick-action-arrow" />
                        </Link>
                        <Link className="quick-action-card" to="/student/my-bookings">
                          <div className="quick-action-icon action-emerald">
                            <FileText size={18} />
                          </div>
                          <div className="quick-action-info">
                            <strong>Reservation History</strong>
                            <span>Track approvals & download receipts</span>
                          </div>
                          <ArrowRight size={15} className="quick-action-arrow" />
                        </Link>
                        <Link className="quick-action-card" to="/notifications">
                          <div className="quick-action-icon action-amber">
                            <Bell size={18} />
                          </div>
                          <div className="quick-action-info">
                            <strong>Notifications</strong>
                            <span>
                              {auth.unread > 0
                                ? `${auth.unread} unread ${auth.unread === 1 ? 'alert' : 'alerts'}`
                                : 'View booking & payment alerts'}
                            </span>
                          </div>
                          <ArrowRight size={15} className="quick-action-arrow" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Student Booking Drawer */}
              {selectedBooking && (
                <StudentBookingDrawer
                  booking={selectedBooking}
                  onClose={() => setSelectedBooking(null)}
                  onCancelClick={(b) => setCancelTarget(b)}
                  auth={auth}
                />
              )}

              {/* Cancel Confirmation Modal */}
              {cancelTarget && (
                <CancelBookingModal
                  booking={cancelTarget}
                  onClose={() => setCancelTarget(null)}
                  onConfirm={() => cancel.mutate(cancelTarget._id)}
                  isPending={cancel.isPending}
                />
              )}
            </>
          ),
        }}
      />
    </RequireRole>
  )
}

function BookingTable({ bookings, student = false, onAction, onRowClick }) {
  return (
    <div className="table-scroll">
      <table className="booking-table">
        <thead>
          <tr>
            <th>Auditorium</th>
            <th>Date & Time</th>
            {!student && <th>Requested By</th>}
            <th>Status</th>
            <th>Amount</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr
              key={b._id}
              onClick={onRowClick ? () => onRowClick(b) : undefined}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              <td data-label="Auditorium">
                <strong>{b.auditorium?.name || 'Auditorium'}</strong>
                <span className="cell-sub">{b.purpose || 'Campus reservation'}</span>
              </td>
              <td data-label="Date and time" style={{ whiteSpace: 'nowrap' }}>
                <strong>{dateText(b.bookingDate)}</strong>
                <span className="cell-sub">
                  {b.startTime} – {b.endTime}
                  {hoursBetween(b.startTime, b.endTime) > 0 && (
                    <span className="duration-tag">{hoursBetween(b.startTime, b.endTime)}h</span>
                  )}
                </span>
              </td>
              {!student && (
                <td data-label="Requested by">
                  <strong>{b.user?.name || 'Student'}</strong>
                  <span className="cell-sub">{b.user?.email}</span>
                </td>
              )}
              <td data-label="Status">
                <Status value={b.status} />
              </td>
              <td className="amount-cell" data-label="Amount">{money(b.totalPrice)}</td>
              <td data-label="Actions" style={{ textAlign: 'right' }}>
                {onAction ? (
                  onAction(b)
                ) : student && b.status === 'approved' ? (
                  <Link className="table-action" to={`/student/payment/${b._id}`}>
                    Pay now
                  </Link>
                ) : student && b.status === 'confirmed' ? (
                  <span className="table-action action-paid" style={{ cursor: 'default' }}>
                    <CheckCircle2 size={12} /> Paid
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyBookings() {
  return (
    <div className="empty-panel">
      <div className="state-icon">
        <CalendarDays size={20} />
      </div>
      <div>
        <h3>No bookings on record yet</h3>
        <p>Explore campus auditoriums and submit a booking request for your next event.</p>
      </div>
      <Link className="button button-secondary" to="/auditoriums">
        Explore spaces <ArrowRight size={14} />
      </Link>
    </div>
  )
}

function MyBookings({ auth }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('status') || 'all'
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const q = useBookings('/bookings/my-bookings?limit=50')
  const qc = useQueryClient()

  const cancel = useMutation({
    mutationFn: (id) => api.put(`/bookings/cancel/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      setCancelTarget(null)
      setSelectedBooking(null)
    },
  })

  const allBookings = q.data || []
  const counts = {
    all: allBookings.length,
    pending: allBookings.filter((b) => b.status === 'pending').length,
    approved: allBookings.filter((b) => b.status === 'approved').length,
    confirmed: allBookings.filter((b) => b.status === 'confirmed').length,
    cancelled: allBookings.filter((b) => ['cancelled', 'rejected', 'expired'].includes(b.status)).length,
  }

  // Filter by tab
  const tabFiltered = allBookings.filter((b) => {
    if (tab === 'all') return true
    if (tab === 'cancelled') return ['cancelled', 'rejected', 'expired'].includes(b.status)
    return b.status === tab
  })

  // Filter by search query
  const filteredBookings = tabFiltered.filter((b) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    const name = b.auditorium?.name?.toLowerCase() || ''
    const purpose = b.purpose?.toLowerCase() || ''
    return name.includes(term) || purpose.includes(term)
  })

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title="My bookings"
        subtitle="RESERVATION HISTORY"
        children={{
          actions: (
            <Link className="button" to="/student/book">
              <CalendarPlus size={14} /> New booking
            </Link>
          ),
          content: (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Your Reservations</h2>
                  <p>Track request statuses, payment deadlines, and confirmed venue bookings.</p>
                </div>
              </div>

              {/* Live Search Bar */}
              <div className="booking-search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Filter reservations by auditorium name or event purpose…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="icon-button"
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {search && (
                <div className="search-count-pill">
                  Showing {filteredBookings.length} of {allBookings.length} reservations matching "{search}"
                </div>
              )}

              {/* Status Tabs */}
              <div className="tabs">
                {[
                  ['all', 'All reservations'],
                  ['pending', 'Pending review'],
                  ['approved', 'Approved (Payment due)'],
                  ['confirmed', 'Confirmed'],
                  ['cancelled', 'Cancelled'],
                ].map(([k, l]) => (
                  <button
                    className={tab === k ? 'tab-active' : ''}
                    onClick={() => {
                      setTab(k)
                      setSearchParams(k === 'all' ? {} : { status: k })
                    }}
                    key={k}
                  >
                    {l}
                    {counts[k] > 0 && <span className="tab-count">{counts[k]}</span>}
                  </button>
                ))}
              </div>

              {q.isLoading ? (
                <LoadingRows />
              ) : q.isError ? (
                <PageState error={q.error} retry={q.refetch} />
              ) : filteredBookings.length ? (
                <BookingTable
                  bookings={filteredBookings}
                  student
                  onRowClick={(b) => setSelectedBooking(b)}
                  onAction={(b) => (
                    <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="table-action action-details"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBooking(b)
                        }}
                        title="View reservation details & receipt"
                      >
                        <Eye size={13} /> Details
                      </button>
                    </div>
                  )}
                />
              ) : (
                <EmptyBookings />
              )}

              {/* Student Booking Drawer */}
              {selectedBooking && (
                <StudentBookingDrawer
                  booking={selectedBooking}
                  onClose={() => setSelectedBooking(null)}
                  onCancelClick={(b) => setCancelTarget(b)}
                  auth={auth}
                />
              )}

              {/* Cancel Confirmation Modal */}
              {cancelTarget && (
                <CancelBookingModal
                  booking={cancelTarget}
                  onClose={() => setCancelTarget(null)}
                  onConfirm={() => cancel.mutate(cancelTarget._id)}
                  isPending={cancel.isPending}
                />
              )}
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

const QUICK_SLOTS = [
  { label: 'Morning Slot', start: '09:00', end: '12:00' },
  { label: 'Afternoon Slot', start: '13:00', end: '16:00' },
  { label: 'Late Afternoon', start: '16:00', end: '19:00' },
  { label: 'Evening Gala', start: '18:00', end: '21:00' },
]

function BookPage({ auth }) {
  const { auditoriumId } = useParams()
  const [search] = useSearchParams()
  const aq = useAuditoriums()
  const qc = useQueryClient()
  const nav = useNavigate()

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`

  const [form, setForm] = useState({
    auditoriumId: auditoriumId || search.get('auditoriumId') || '',
    bookingDate: search.get('date') || todayStr,
    startTime: search.get('start') || '09:00',
    endTime: search.get('end') || '11:00',
    purpose: '',
  })
  const [error, setError] = useState('')

  const venue = aq.data?.find((v) => v._id === form.auditoriumId)
  const duration = hoursBetween(form.startTime, form.endTime)
  const isTimeInvalid = form.startTime && form.endTime && form.startTime >= form.endTime

  // Date validation
  const isDateToday = form.bookingDate === todayStr
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`
  const isPastTimeToday = isDateToday && form.startTime <= currentHHMM

  // Quick Date Helpers (local timezone safe)
  const setQuickDateOffset = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    setForm((prev) => ({ ...prev, bookingDate: str }))
  }

  // Quick Duration Helper
  const setDurationHours = (hrs) => {
    const [h, m] = form.startTime.split(':').map(Number)
    const totalMinutes = h * 60 + (m || 0) + hrs * 60
    const endH = Math.min(23, Math.floor(totalMinutes / 60))
    const endM = totalMinutes >= 24 * 60 ? 59 : totalMinutes % 60
    const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
    setForm((prev) => ({ ...prev, endTime: endStr }))
  }

  // Live availability calendar for selected auditorium and month
  const monthKey = form.bookingDate ? form.bookingDate.slice(0, 7) : ''
  const cal = useQuery({
    queryKey: ['calendar', form.auditoriumId, monthKey],
    queryFn: async () => {
      if (!form.auditoriumId || !monthKey) return []
      return (
        await api.get('/bookings/calendar', {
          params: { auditoriumId: form.auditoriumId, month: monthKey },
        })
      ).data.bookings || []
    },
    enabled: Boolean(form.auditoriumId && monthKey),
  })

  // Existing bookings on the selected day
  const dayBookings = useMemo(() => {
    if (!cal.data || !form.bookingDate) return []
    return cal.data
      .filter((b) => {
        if (!b?.bookingDate || !b.startTime || !b.endTime) return false
        const d = new Date(b.bookingDate)
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
        return dStr === form.bookingDate || String(b.bookingDate).slice(0, 10) === form.bookingDate
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [cal.data, form.bookingDate])

  // Detect conflicting existing booking on that day
  const conflictingBooking = useMemo(() => {
    if (!dayBookings.length || !form.startTime || !form.endTime) return null
    return dayBookings.find((b) => form.startTime < b.endTime && form.endTime > b.startTime)
  }, [dayBookings, form.startTime, form.endTime])

  const mutation = useMutation({
    mutationFn: () => {
      return api.post('/bookings/createBooking', {
        auditoriumId: form.auditoriumId,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      nav('/student/my-bookings')
    },
    onError: (e) => setError(getError(e)),
  })

  const isFormValid =
    form.auditoriumId &&
    form.bookingDate &&
    form.startTime &&
    form.endTime &&
    !isTimeInvalid &&
    !isPastTimeToday &&
    !conflictingBooking &&
    duration > 0 &&
    form.purpose.trim().length >= 3

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title="Request a booking"
        subtitle="NEW RESERVATION"
        children={{
          actions: (
            <Link className="button button-secondary" to={venue ? `/auditoriums/${venue._id}` : '/auditoriums'}>
              <ArrowLeft size={14} /> {venue ? 'Back to venue' : 'Browse auditoriums'}
            </Link>
          ),
          content: (
            <div className="booking-flow">
              <section className="panel booking-form-panel">
                <div className="panel-header">
                  <div>
                    <h2>Reservation Details</h2>
                    <p>Select your auditorium, date, time window, and event purpose for administrative review.</p>
                  </div>
                  <span className="step-chip">
                    Step 1 <span>of</span> 3
                  </span>
                </div>

                <div className="progress-steps">
                  <span className="current">
                    <i>1</i> Details & Schedule
                  </span>
                  <span>
                    <i>2</i> Administrative Review
                  </span>
                  <span>
                    <i>3</i> Fee Payment & Confirmation
                  </span>
                </div>

                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!isFormValid) return
                    setError('')
                    mutation.mutate()
                  }}
                >
                  {/* 1. Auditorium Selection */}
                  <div className="form-group">
                    <div className="form-section-head">
                      <span className="form-section-num">1</span>
                      <span>Choose Auditorium</span>
                    </div>
                    <label className="form-label">
                      <select
                        className="input"
                        value={form.auditoriumId}
                        onChange={(e) => setForm({ ...form, auditoriumId: e.target.value })}
                        required
                      >
                        <option value="">Choose an auditorium venue</option>
                        {(aq.data || []).map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.name} · {v.capacity} seats · {money(v.basePrice)}/hr
                          </option>
                        ))}
                      </select>
                    </label>

                    {venue && (
                      <div className="venue-selected-card">
                        <img src={imageFor(venue)} alt={venue.name} className="venue-selected-thumb" />
                        <div className="venue-selected-info">
                          <strong>{venue.name}</strong>
                          <div className="venue-selected-meta">
                            <span>
                              <Users size={13} /> {venue.capacity} seats capacity
                            </span>
                            <span>•</span>
                            <span>
                              <Clock3 size={13} /> {money(venue.basePrice)} / hour
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Event Date & Time */}
                  <div className="form-group">
                    <div className="form-section-head">
                      <span className="form-section-num">2</span>
                      <span>Date & Time Window</span>
                    </div>
                    <label className="form-label">
                      Event Date
                      <input
                        className="input"
                        type="date"
                        min={todayStr}
                        value={form.bookingDate}
                        onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                        required
                      />
                    </label>
                    <div className="quick-chip-group">
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick select:</span>
                      <button
                        type="button"
                        className={`quick-chip ${form.bookingDate === todayStr ? 'active' : ''}`}
                        onClick={() => setQuickDateOffset(0)}
                      >
                        Today
                      </button>
                      <button type="button" className="quick-chip" onClick={() => setQuickDateOffset(1)}>
                        Tomorrow
                      </button>
                      <button type="button" className="quick-chip" onClick={() => setQuickDateOffset(2)}>
                        In 2 days
                      </button>
                      <button type="button" className="quick-chip" onClick={() => setQuickDateOffset(7)}>
                        Next week
                      </button>
                    </div>

                    {form.auditoriumId && form.bookingDate && (
                      <div className="day-slots-bar">
                        {cal.isLoading ? (
                          <span>Checking booked slots for {dateText(form.bookingDate)}…</span>
                        ) : dayBookings.length > 0 ? (
                          <>
                            <span>Booked on {dateText(form.bookingDate)}:</span>
                            {dayBookings.map((b, idx) => (
                              <span className="booked-slot-chip" key={b._id || idx}>
                                <Clock3 size={11} /> {b.startTime}–{b.endTime}
                              </span>
                            ))}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                            <span>All time slots are currently open on {dateText(form.bookingDate)}.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Time Slots, Presets & Duration */}
                  <div className="form-group">
                    <div className="time-row">
                      <label className="form-label">
                        Start Time
                        <input
                          className="input"
                          type="time"
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                          required
                        />
                      </label>
                      <label className="form-label">
                        End Time
                        <input
                          className="input"
                          type="time"
                          value={form.endTime}
                          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                          required
                        />
                      </label>
                    </div>

                    {/* Inline time & conflict validation feedback */}
                    {isTimeInvalid && (
                      <div className="inline-feedback error">
                        <AlertCircle size={13} /> Start time must be earlier than end time.
                      </div>
                    )}
                    {isPastTimeToday && (
                      <div className="inline-feedback warning">
                        <AlertCircle size={13} /> Selected start time has already passed for today.
                      </div>
                    )}
                    {conflictingBooking && (
                      <div className="inline-feedback error">
                        <AlertTriangle size={13} /> Time conflict: This venue already has a reservation from{' '}
                        {conflictingBooking.startTime} to {conflictingBooking.endTime}. Please choose another window.
                      </div>
                    )}
                    {!isTimeInvalid && !isPastTimeToday && !conflictingBooking && duration > 0 && (
                      <div className="inline-feedback success">
                        <Check size={13} /> Duration: {duration} hours ({money(venue ? Math.round(duration * venue.basePrice) : 0)})
                      </div>
                    )}

                    {/* Quick Duration Buttons */}
                    <div className="quick-chip-group" style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Set duration:</span>
                      {[1, 2, 3, 4, 8].map((h) => (
                        <button
                          key={h}
                          type="button"
                          className={`quick-chip ${duration === h ? 'active' : ''}`}
                          onClick={() => setDurationHours(h)}
                        >
                          {h === 4 ? '4h (Half day)' : h === 8 ? '8h (Full day)' : `${h} hr${h > 1 ? 's' : ''}`}
                        </button>
                      ))}
                    </div>

                    {/* Popular Slot Presets */}
                    <div className="quick-chip-group" style={{ marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Popular slots:</span>
                      {QUICK_SLOTS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          className={`quick-chip ${form.startTime === s.start && form.endTime === s.end ? 'active' : ''}`}
                          onClick={() => setForm((prev) => ({ ...prev, startTime: s.start, endTime: s.end }))}
                        >
                          {s.label} ({s.start}–{s.end})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Event Purpose (Valid Model Field) */}
                  <div className="form-group">
                    <div className="form-section-head">
                      <span className="form-section-num">3</span>
                      <span>Event Purpose</span>
                    </div>
                    <div className="quick-chip-group" style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quick templates:</span>
                      {[
                        'Department Seminar on ',
                        'Technical Workshop: ',
                        'Guest Lecture by ',
                        'Student Society Event: ',
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          className="quick-chip"
                          onClick={() => setForm((prev) => ({ ...prev, purpose: tpl }))}
                        >
                          {tpl.replace(/[: ]+$/, '')}
                        </button>
                      ))}
                    </div>
                    <label className="form-label">
                      <textarea
                        className="input textarea"
                        maxLength={500}
                        rows={4}
                        placeholder="State the purpose of this reservation (e.g., Annual Technical Symposium, Department Orientation, Guest Lecture by Prof. Sharma)..."
                        value={form.purpose}
                        onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                        required
                      />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span className="field-hint">
                        {form.purpose.trim().length < 3
                          ? 'Please provide a brief description of the event purpose (min 3 characters).'
                          : 'Clear context facilitates timely administrative approval.'}
                      </span>
                      <span className="field-hint">{form.purpose.length}/500</span>
                    </div>
                  </div>

                  {error && (
                    <div className="form-error">
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* 8. Submit Button */}
                  <button
                    className="button auth-submit"
                    disabled={mutation.isPending || !isFormValid}
                  >
                    {mutation.isPending ? 'Submitting booking request…' : 'Submit booking request'}{' '}
                    <ArrowRight size={15} />
                  </button>

                  <p className="submission-note">
                    <ShieldCheck size={14} />
                    <span>No advance payment is taken today. Invoicing is processed only after official campus administrative review.</span>
                  </p>
                </form>
              </section>

              {/* Live Sticky Summary Sidebar */}
              <aside className="booking-summary">
                <span className="booking-card-label">RESERVATION SUMMARY</span>
                {venue ? (
                  <>
                    <img src={imageFor(venue)} alt={venue.name} />
                    <h3>{venue.name}</h3>
                    <span className="summary-capacity">
                      <Users size={14} />
                      {venue.capacity} seating capacity
                    </span>
                  </>
                ) : (
                  <div className="summary-placeholder">
                    <DoorOpen size={22} />
                    <span>Select an auditorium to view its venue preview and calculated charges.</span>
                  </div>
                )}

                <div className="summary-lines">
                  <div>
                    <span>
                      <CalendarDays size={14} /> Date
                    </span>
                    <strong>{form.bookingDate ? dateText(form.bookingDate) : 'Select a date'}</strong>
                  </div>
                  <div>
                    <span>
                      <Clock3 size={14} /> Time Window
                    </span>
                    <strong>
                      {form.startTime} – {form.endTime}
                    </strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{duration > 0 ? `${duration} hours` : '—'}</strong>
                  </div>
                  {venue && (
                    <div>
                      <span>Hourly Rate</span>
                      <strong>{money(venue.basePrice)} / hr</strong>
                    </div>
                  )}
                  <div className="summary-total">
                    <span>Estimated Total</span>
                    <strong>
                      {venue && duration > 0 ? money(Math.round(duration * venue.basePrice)) : '—'}
                    </strong>
                  </div>
                </div>

                <div className="summary-note">
                  Once submitted, the venue slot remains provisionally held while campus facilities management reviews your event requirements.
                </div>
              </aside>
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

function ConfirmedReceiptView({ booking, payment, auth }) {
  const [downloading, setDownloading] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedTxn, setCopiedTxn] = useState(false)

  const transactionId = payment?.gatewayPaymentId || booking?.paymentId?.gatewayPaymentId || payment?._id || `TXN-${booking?._id?.slice(-8).toUpperCase()}`
  const receiptNumber = payment?.receipt || `AR-${new Date(payment?.paidAt || booking?.updatedAt || Date.now()).getFullYear()}-${booking?._id?.slice(-6).toUpperCase()}`
  const paidAmount = payment?.amount || booking?.totalPrice || 0
  const duration = hoursBetween(booking?.startTime, booking?.endTime)

  const copyBookingId = () => {
    if (!booking?._id) return
    navigator.clipboard?.writeText(booking._id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const copyTxn = () => {
    navigator.clipboard?.writeText(transactionId)
    setCopiedTxn(true)
    setTimeout(() => setCopiedTxn(false), 2000)
  }

  const handleDownload = () => {
    downloadBookingReceipt(booking._id, setDownloading, auth?.setToast)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="receipt-voucher-wrapper">
      <div className="receipt-voucher-card">
        {/* Top Verified Header Bar */}
        <div className="receipt-voucher-top">
          <div className="voucher-seal">
            <BadgeCheck size={32} />
          </div>
          <div className="voucher-top-info">
            <span className="voucher-eyebrow">OFFICIAL PAYMENT RECEIPT & VOUCHER</span>
            <h2>Reservation Confirmed & Secured</h2>
            <p>Your auditorium reservation is officially confirmed and locked on the university schedule.</p>
          </div>
          <div className="voucher-badge-paid">
            <CheckCircle2 size={13} />
            <span>PAID IN FULL</span>
          </div>
        </div>

        {/* Receipt Meta Strip */}
        <div className="receipt-meta-strip">
          <div className="meta-strip-item">
            <span>RECEIPT NUMBER</span>
            <strong>{receiptNumber}</strong>
          </div>
          <div className="meta-strip-item">
            <span>RESERVATION REF</span>
            <button type="button" className="copy-code-btn" onClick={copyBookingId} title="Click to copy booking ID">
              <code>#{booking?._id?.slice(-8).toUpperCase()}</code>
              {copiedId ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
          <div className="meta-strip-item">
            <span>PAYMENT DATE</span>
            <strong>{dateText(payment?.paidAt || booking?.updatedAt || Date.now())}</strong>
          </div>
          <div className="meta-strip-item">
            <span>ORGANIZER</span>
            <strong>{auth?.user?.name || booking?.user?.name || 'Student Organizer'}</strong>
          </div>
        </div>

        {/* Venue & Booking Summary Box */}
        <div className="voucher-venue-card">
          {booking?.auditorium && (
            <img src={imageFor(booking.auditorium)} alt={booking.auditorium.name} className="voucher-venue-img" />
          )}
          <div className="voucher-venue-details">
            <span className="voucher-venue-label">RESERVED FACILITY</span>
            <h3>{booking?.auditorium?.name || 'Campus Auditorium'}</h3>
            <div className="voucher-venue-specs">
              <span><Users size={12} /> {booking?.auditorium?.capacity} Capacity</span>
              <span>•</span>
              <span><CalendarDays size={12} /> {dateText(booking?.bookingDate)}</span>
              <span>•</span>
              <span><Clock3 size={12} /> {booking?.startTime} – {booking?.endTime} ({duration > 0 ? `${duration} hrs` : 'Standard'})</span>
            </div>
          </div>
        </div>

        {/* Purpose / Event Scope */}
        {booking?.purpose && (
          <div className="voucher-purpose-card">
            <span>EVENT PURPOSE & SCOPE</span>
            <p>{booking.purpose}</p>
          </div>
        )}

        {/* Itemized Financial Breakdown */}
        <div className="voucher-breakdown-section">
          <div className="breakdown-header">
            <span>Line Item & Description</span>
            <span style={{ textAlign: 'center' }}>Duration</span>
            <span style={{ textAlign: 'right' }}>Amount Paid</span>
          </div>
          <div className="breakdown-row">
            <div>
              <strong>Facility Reservation: {booking?.auditorium?.name}</strong>
              <small>Authorized venue reservation on central campus master schedule</small>
            </div>
            <div style={{ textAlign: 'center' }}>
              {duration > 0 ? `${duration} Hours` : 'Standard Slot'}
            </div>
            <div style={{ textAlign: 'right' }}>
              {money(paidAmount)}
            </div>
          </div>
          <div className="breakdown-total-row">
            <div>
              <strong>TOTAL AMOUNT PAID:</strong>
              <small>Via Razorpay (Inclusive of applicable university facility fees)</small>
            </div>
            <div className="total-highlight">
              {money(paidAmount)}
            </div>
          </div>
        </div>

        {/* Verified Gateway Transaction Box */}
        <div className="voucher-transaction-box">
          <div className="tx-col">
            <span>PAYMENT METHOD</span>
            <strong>Razorpay Secure Gateway</strong>
          </div>
          <div className="tx-col">
            <span>TRANSACTION ID</span>
            <button type="button" className="copy-code-btn" onClick={copyTxn} title="Click to copy Transaction ID">
              <code>{transactionId}</code>
              {copiedTxn ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
          <div className="tx-col">
            <span>AUTHORIZATION STATUS</span>
            <strong className="status-completed-text">
              <CheckCircle2 size={12} /> Completed & Settled
            </strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="voucher-actions-bar">
          <button
            type="button"
            className="button button-receipt-primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <RefreshCw size={14} className="spin" /> Generating PDF…
              </>
            ) : (
              <>
                <Download size={14} /> Download Official PDF Receipt
              </>
            )}
          </button>
          <button
            type="button"
            className="button button-secondary button-receipt-print"
            onClick={handlePrint}
          >
            <Printer size={14} /> Print Receipt
          </button>
          <Link className="button button-secondary" to="/student/my-bookings">
            <ArrowLeft size={14} /> Back to My Bookings
          </Link>
        </div>

        {/* Footer Legal & Verification */}
        <div className="voucher-footer">
          <p>
            This is an official electronic receipt issued by <strong>AuditoReserve</strong>.
            Central Facilities & Infrastructure Management, Teerthanker Mahaveer University.
          </p>
        </div>
      </div>
    </div>
  )
}

function PaymentPage({ auth }) {
  const { bookingId } = useParams()
  const q = useBookings()
  const booking = q.data?.find((b) => b._id === bookingId)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [busy, setBusy] = useState(false)

  const start = async () => {
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post(
        `/payments/create-order/${bookingId}`,
        {},
        { headers: { 'Idempotency-Key': crypto.randomUUID() } }
      )
      if (!window.Razorpay) {
        throw new Error('The secure payment gateway is temporarily unavailable. Please refresh and retry.')
      }
      const checkout = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'AuditoReserve',
        description: `${booking?.auditorium?.name || 'Auditorium'} reservation`,
        order_id: data.order.id,
        prefill: {
          name: auth.user?.name,
          email: auth.user?.email,
        },
        theme: { color: '#3978F6' },
        handler: async (response) => {
          try {
            const verified = await api.post(
              '/payments/verify',
              { bookingId, ...response },
              { headers: { 'Idempotency-Key': crypto.randomUUID() } }
            )
            setSuccess(verified.data.payment)
            await q.refetch()
          } catch (e) {
            setError(getError(e))
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      })

      checkout.on('payment.failed', (r) => {
        setError(r.error?.description || 'Payment was unsuccessful. Please check your payment details.')
        setBusy(false)
      })

      checkout.open()
    } catch (e) {
      setError(e.message || getError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title="Complete payment"
        subtitle="SECURE CHECKOUT"
        children={{
          content: q.isLoading ? (
            <LoadingRows />
          ) : q.isError ? (
            <PageState error={q.error} retry={q.refetch} />
          ) : isConfirmed ? (
            <ConfirmedReceiptView
              booking={booking}
              payment={success || booking?.paymentId}
              auth={auth}
            />
          ) : !booking ? (
            <div className="state-panel">
              <div className="state-icon">
                <AlertCircle size={22} />
              </div>
              <h3>Booking record not found</h3>
              <p>We couldn’t find this reservation in your account records.</p>
              <Link className="button button-secondary" to="/student/my-bookings">
                Back to bookings
              </Link>
            </div>
          ) : (
            <div className="payment-layout">
              <section className="panel payment-panel">
                <span className="eyebrow">APPROVED RESERVATION</span>
                <h2>{booking.auditorium?.name}</h2>

                <div className="payment-details">
                  <div>
                    <CalendarDays size={18} />
                    <span>
                      <small>EVENT DATE</small>
                      <strong>{dateText(booking.bookingDate)}</strong>
                    </span>
                  </div>
                  <div>
                    <Clock3 size={18} />
                    <span>
                      <small>TIME WINDOW</small>
                      <strong>
                        {booking.startTime} – {booking.endTime}
                      </strong>
                    </span>
                  </div>
                  <div>
                    <DoorOpen size={18} />
                    <span>
                      <small>PURPOSE</small>
                      <strong>{booking.purpose}</strong>
                    </span>
                  </div>
                </div>

                <div className="price-breakdown">
                  <div>
                    <span>Hourly Venue Rate</span>
                    <span>{money(booking.auditorium?.basePrice)} / hr</span>
                  </div>
                  <div>
                    <span>Duration</span>
                    <span>{hoursBetween(booking.startTime, booking.endTime)} hours</span>
                  </div>
                  <div className="breakdown-total">
                    <strong>Total Amount Due</strong>
                    <strong>{money(booking.totalPrice)}</strong>
                  </div>
                </div>

                {error && (
                  <div className="form-error">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  className="button auth-submit"
                  disabled={busy || booking.status !== 'approved'}
                  onClick={start}
                >
                  {busy
                    ? 'Opening secure gateway…'
                    : booking.status === 'confirmed'
                    ? 'Already Confirmed'
                    : `Pay ${money(booking.totalPrice)}`}{' '}
                  <ArrowRight size={15} />
                </button>

                <div className="secure-note">
                  <ShieldCheck size={14} />
                  <span>Payments encrypted and processed via Razorpay. Card credentials are never stored.</span>
                </div>
              </section>

              <aside className="payment-aside">
                <div className="secure-mark">
                  <ShieldCheck size={20} />
                </div>
                <h3>Secure University Checkout</h3>
                <p>
                  You will complete payment through Razorpay’s encrypted gateway. Your reservation is
                  confirmed immediately once transaction verification finishes.
                </p>

                <div className="deadline-note">
                  <Clock3 size={16} />
                  <span>
                    Payment deadline
                    <strong>{dateText(booking.paymentDeadline)}</strong>
                  </span>
                </div>

                <Link className="text-link" to="/student/my-bookings">
                  <ArrowLeft size={14} /> Back to reservations
                </Link>
              </aside>
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

function Notifications({ auth }) {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get('/notifications', { params: { page: 1, limit: 50 } })).data.notifications || [],
  })

  const mark = useMutation({
    mutationFn: (id) => (id ? api.patch(`/notifications/${id}`) : api.patch('/notifications/read-all')),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread'] })
    },
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread'] })
    },
  })

  const items = q.data || []
  const unreadCount = items.filter((n) => !n.isRead).length
  const readCount = items.length - unreadCount
  const visibleItems = items.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const getNotifVisual = (title = '', message = '') => {
    const text = `${title} ${message}`.toLowerCase()
    if (text.includes('cancel') || text.includes('declin') || text.includes('reject') || text.includes('expir')) {
      return { cls: 'notif-danger', Icon: AlertCircle }
    }
    if (text.includes('confirm') || text.includes('paid') || text.includes('receipt') || text.includes('approv')) {
      return { cls: 'notif-success', Icon: CheckCircle2 }
    }
    if (text.includes('payment') || text.includes('deadline') || text.includes('pending')) {
      return { cls: 'notif-warning', Icon: Clock3 }
    }
    return { cls: '', Icon: Bell }
  }

  return (
    <RequireRole auth={auth}>
      <DashboardShell
        auth={auth}
        title="Notifications"
        subtitle="UPDATES & ALERTS"
        children={{
          actions: unreadCount > 0 ? (
            <button
              className="button button-secondary button-small"
              disabled={mark.isPending}
              onClick={() => mark.mutate()}
            >
              <Check size={14} /> Mark all read ({unreadCount})
            </button>
          ) : null,
          content: (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-with-badge">
                    <h2>Recent Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="count-chip">{unreadCount} unread</span>
                    )}
                  </div>
                  <p>Reservation updates, status notices, and payment receipts from campus admins.</p>
                </div>
              </div>

              {items.length > 0 && (
                <div className="tabs" style={{ marginBottom: '12px' }}>
                  {[
                    ['all', 'All updates', items.length],
                    ['unread', 'Unread', unreadCount],
                    ['read', 'Read', readCount],
                  ].map(([key, label, count]) => (
                    <button
                      key={key}
                      className={filter === key ? 'tab-active' : ''}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                      {count > 0 && <span className="tab-count">{count}</span>}
                    </button>
                  ))}
                </div>
              )}

              {q.isLoading ? (
                <LoadingRows />
              ) : q.isError ? (
                <PageState error={q.error} retry={q.refetch} />
              ) : visibleItems.length ? (
                <div className="notification-list">
                  {visibleItems.map((n) => {
                    const { cls, Icon } = getNotifVisual(n.title, n.message)
                    return (
                      <div className={`notification-row ${n.isRead ? 'read' : ''}`} key={n._id}>
                        <div className={`notification-symbol ${cls}`}>
                          <Icon size={16} />
                        </div>
                        <div className="notification-body">
                          <div className="notification-title-line">
                            {!n.isRead && <span className="notification-unread-dot" />}
                            <strong>{n.title}</strong>
                          </div>
                          <p>{n.message}</p>
                          <span>{timeAgo(n.createdAt)}</span>
                        </div>
                        <div className="notification-actions">
                          {!n.isRead && (
                            <button
                              className="mark-read"
                              disabled={mark.isPending}
                              onClick={() => mark.mutate(n._id)}
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            className="icon-button"
                            disabled={del.isPending}
                            onClick={() => del.mutate(n._id)}
                            aria-label="Delete notification"
                            title="Delete notification"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-panel">
                  <div className="state-icon">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3>{filter === 'unread' ? 'No unread notifications' : 'You’re all caught up'}</h3>
                    <p>
                      {filter === 'unread'
                        ? 'All your campus booking alerts have been reviewed.'
                        : 'New booking alerts and payment receipts will appear here.'}
                    </p>
                  </div>
                  {filter !== 'all' && (
                    <button className="button button-secondary button-small" onClick={() => setFilter('all')}>
                      View all notifications
                    </button>
                  )}
                </div>
              )}
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

// ============================================================================
// Admin Views
// ============================================================================

function AdminDashboard({ auth }) {
  const aq = useAuditoriums()
  const bq = useBookings('/bookings/all?limit=50')
  const list = bq.data || []
  const pending = list.filter((b) => b.status === 'pending')
  const revenue = list
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  const qc = useQueryClient()
  const action = useMutation({
    mutationFn: ({ id, status }) => api.put(`/bookings/status/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  return (
    <RequireRole auth={auth} role="admin">
      <DashboardShell
        auth={auth}
        title="Overview"
        subtitle="CAMPUS OPERATIONS"
        children={{
          actions: (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link className="button button-secondary" to="/admin/auditoriums">
                <DoorOpen size={14} /> Manage venues
              </Link>
              <Link className="button" to="/admin/auditoriums/new">
                <Plus size={14} /> Add auditorium
              </Link>
            </div>
          ),
          content: (
            <>
              {aq.isError || bq.isError ? (
                <PageState
                  error={aq.error || bq.error}
                  retry={() => {
                    aq.refetch()
                    bq.refetch()
                  }}
                />
              ) : (
                <>
                  <div className="stats-grid admin-stats">
                    <StatCard
                      title="Total Venues"
                      value={aq.data?.length ?? '—'}
                      icon="building"
                      note="Active campus venues"
                      to="/admin/auditoriums"
                    />
                    <StatCard
                      title="Total Bookings"
                      value={bq.data?.pagination?.totalItems ?? list.length}
                      icon="calendar"
                      note="All-time reservations"
                      to="/admin/bookings"
                    />
                    <StatCard
                      title="Pending Review"
                      value={pending.length}
                      icon="clock"
                      note={
                        pending.length > 0
                          ? `${pending.length} require administrative decision`
                          : 'All requests reviewed'
                      }
                      badge={pending.length > 0 ? `${pending.length} pending` : null}
                      highlight={pending.length > 0 ? 'warning' : null}
                      to="/admin/bookings"
                    />
                    <StatCard
                      title="Confirmed Revenue"
                      value={money(revenue)}
                      icon="rupee"
                      note="From confirmed bookings"
                      to="/admin/bookings"
                    />
                  </div>

                  <div className="panel review-panel">
                    <div className="panel-header">
                      <div className="panel-title-group">
                        <div className="panel-title-with-badge">
                          <h2>Awaiting Administrative Review</h2>
                          {pending.length > 0 ? (
                            <span className="count-badge warning">{pending.length} pending</span>
                          ) : (
                            <span className="count-badge success">All clear</span>
                          )}
                        </div>
                        <p>Pending student booking requests requiring approval or decline decisions.</p>
                      </div>
                      <Link className="text-link" to="/admin/bookings">
                        All bookings <ArrowRight size={14} />
                      </Link>
                    </div>

                    {pending.length ? (
                      <BookingTable
                        bookings={pending.slice(0, 5)}
                        onAction={(b) => (
                          <div className="action-group" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              className="table-action action-approve"
                              disabled={action.isPending}
                              onClick={() => action.mutate({ id: b._id, status: 'approved' })}
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              className="table-action subtle action-decline"
                              disabled={action.isPending}
                              onClick={() => action.mutate({ id: b._id, status: 'cancelled' })}
                            >
                              <X size={13} /> Decline
                            </button>
                          </div>
                        )}
                      />
                    ) : (
                      <div className="admin-all-clear">
                        <div className="all-clear-badge">
                          <CheckCircle2 size={24} />
                        </div>
                        <div className="all-clear-text">
                          <h3>No pending requests</h3>
                          <p>
                            All student reservation requests have been reviewed. Incoming booking requests
                            will appear here immediately for decision.
                          </p>
                        </div>
                        <Link to="/admin/bookings" className="button button-secondary button-small">
                          View all bookings <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ),
        }}
      />
    </RequireRole>
  )
}

function AdminBookings({ auth }) {
  const [status, setStatus] = useState('')
  const [venue, setVenue] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const aq = useAuditoriums()
  const query = `/bookings/all?limit=20&page=${page}${status ? `&status=${status}` : ''}${
    venue ? `&auditoriumId=${venue}` : ''
  }`
  const q = useBookings(query)

  const results = (q.data || []).filter((b) =>
    `${b.user?.name || ''} ${b.user?.email || ''} ${b.auditorium?.name || ''} ${b.purpose || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)

  const update = useMutation({
    mutationFn: ({ id, status }) => api.put(`/bookings/status/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      setSelected(null)
    },
  })

  return (
    <RequireRole auth={auth} role="admin">
      <DashboardShell
        auth={auth}
        title="Bookings"
        subtitle="RESERVATION LOGS"
        children={{
          content: (
            <>
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>All Campus Reservations</h2>
                    <p>Review booking requests, manage approvals, and monitor payments.</p>
                  </div>
                  <span className="count-chip">
                    {q.data?.pagination?.totalItems ?? results.length} records
                  </span>
                </div>

                <div className="admin-toolbar">
                  <label className="search-field compact">
                    <Search size={15} />
                    <input
                      placeholder="Search student, venue, or purpose"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    className="input select-compact"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    className="input select-compact"
                    value={venue}
                    onChange={(e) => {
                      setVenue(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="">All venues</option>
                    {(aq.data || []).map((a) => (
                      <option value={a._id} key={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {q.isLoading ? (
                  <LoadingRows />
                ) : q.isError ? (
                  <PageState error={q.error} retry={q.refetch} />
                ) : results.length ? (
                  <BookingTable
                    bookings={results}
                    onAction={(b) => (
                      <div className="action-group" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                        {b.status === 'pending' && (
                          <>
                            <button
                              className="table-action action-approve"
                              disabled={update.isPending}
                              onClick={() => update.mutate({ id: b._id, status: 'approved' })}
                              title="Approve booking"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              className="table-action subtle action-decline"
                              disabled={update.isPending}
                              onClick={() => update.mutate({ id: b._id, status: 'cancelled' })}
                              title="Decline booking"
                            >
                              <X size={13} /> Decline
                            </button>
                          </>
                        )}
                        <button className="table-action action-details" onClick={() => setSelected(b)}>
                          <Eye size={13} /> Inspect
                        </button>
                      </div>
                    )}
                  />
                ) : (
                  <div className="empty-panel">
                    <div className="state-icon">
                      <Search size={20} />
                    </div>
                    <div>
                      <h3>No reservations found</h3>
                      <p>Adjust your search query or filter parameters to display matching records.</p>
                    </div>
                    {(search || status || venue) && (
                      <button
                        className="button button-secondary button-small"
                        onClick={() => {
                          setSearch('')
                          setStatus('')
                          setVenue('')
                          setPage(1)
                        }}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                )}

                <Pagination pagination={q.data?.pagination} page={page} setPage={setPage} />
              </div>

              {selected && (
                <div className="drawer-scrim" onClick={() => setSelected(null)}>
                  <aside className="booking-drawer" onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-head">
                      <div>
                        <span className="eyebrow">BOOKING DETAILS</span>
                        <h2>{selected.auditorium?.name || 'Auditorium'}</h2>
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => setSelected(null)}
                        aria-label="Close details"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <Status value={selected.status} />

                    <div className="drawer-details">
                      <div>
                        <span>Student</span>
                        <strong>{selected.user?.name || '—'}</strong>
                        <small>{selected.user?.email || ''}</small>
                      </div>
                      <div>
                        <span>Event Date</span>
                        <strong>{dateText(selected.bookingDate)}</strong>
                      </div>
                      <div>
                        <span>Time Window</span>
                        <strong>
                          {selected.startTime} – {selected.endTime}
                        </strong>
                      </div>
                      <div>
                        <span>Event Purpose</span>
                        <strong>{selected.purpose || '—'}</strong>
                      </div>
                      <div>
                        <span>Calculated Total</span>
                        <strong>{money(selected.totalPrice)}</strong>
                      </div>
                      <div>
                        <span>Payment Deadline</span>
                        <strong>{dateText(selected.paymentDeadline)}</strong>
                      </div>
                    </div>

                    {selected.status === 'pending' && (
                      <div className="drawer-actions">
                        <button
                          className="button button-secondary"
                          disabled={update.isPending}
                          onClick={() => update.mutate({ id: selected._id, status: 'cancelled' })}
                        >
                          Decline request
                        </button>
                        <button
                          className="button"
                          disabled={update.isPending}
                          onClick={() => update.mutate({ id: selected._id, status: 'approved' })}
                        >
                          Approve booking <Check size={14} />
                        </button>
                      </div>
                    )}
                  </aside>
                </div>
              )}
            </>
          ),
        }}
      />
    </RequireRole>
  )
}

function Pagination({ pagination, page, setPage }) {
  if (!pagination || pagination.totalPages <= 1) return null
  return (
    <div className="pagination">
      <span>
        Page {page} of {pagination.totalPages} · {pagination.totalItems} total bookings
      </span>
      <div>
        <button
          className="button button-secondary"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <button
          className="button button-secondary"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function AdminAuditoriums({ auth }) {
  const q = useAuditoriums()
  const qc = useQueryClient()
  const [msg, setMsg] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const del = useMutation({
    mutationFn: (id) => api.delete(`/auditoriums/deleteAuditorium/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auditoriums'] })
      setDeleteTarget(null)
    },
    onError: (e) => {
      setMsg(getError(e))
      setDeleteTarget(null)
    },
  })

  return (
    <RequireRole auth={auth} role="admin">
      <DashboardShell
        auth={auth}
        title="Auditoriums"
        subtitle="VENUE MANAGEMENT"
        children={{
          actions: (
            <Link className="button" to="/admin/auditoriums/new">
              Add auditorium <ArrowRight size={14} />
            </Link>
          ),
          content: (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Campus Auditoriums</h2>
                  <p>Configure and manage venues available for student event reservations.</p>
                </div>
                <span className="count-chip">{q.data?.length || 0} venues</span>
              </div>

              {msg && (
                <div className="form-error" style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{msg}</span>
                </div>
              )}

              {q.isLoading ? (
                <LoadingCards count={2} />
              ) : q.isError ? (
                <PageState error={q.error} retry={q.refetch} />
              ) : q.data?.length ? (
                <div className="admin-venue-list">
                  {q.data.map((v) => (
                    <div className="admin-venue-row" key={v._id}>
                      <img src={imageFor(v)} alt="" />
                      <div className="admin-venue-info">
                        <strong>{v.name}</strong>
                        <span>
                          {v.capacity} seats · {money(v.basePrice)}/hr
                        </span>
                        <div className="amenities">
                          {v.amenities?.slice(0, 3).map((a) => (
                            <span className="amenity" key={a}>
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="venue-live">
                        <i /> Available
                      </span>
                      <div className="action-group">
                        <Link className="table-action" to={`/admin/auditoriums/edit/${v._id}`}>
                          Edit
                        </Link>
                        <button
                          className="table-action subtle action-decline"
                          disabled={del.isPending}
                          onClick={() => setDeleteTarget(v)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel">
                  <div className="state-icon">
                    <DoorOpen size={20} />
                  </div>
                  <div>
                    <h3>No auditoriums registered yet</h3>
                    <p>Add your first campus venue to make it available for booking.</p>
                  </div>
                  <Link className="button button-secondary" to="/admin/auditoriums/new">
                    Add auditorium
                  </Link>
                </div>
              )}

              {deleteTarget && (
                <div className="modal-backdrop" onClick={() => !del.isPending && setDeleteTarget(null)}>
                  <div className="modal-card modal-compact" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-icon-danger">
                      <AlertTriangle size={24} />
                    </div>
                    <h3>Delete {deleteTarget.name}?</h3>
                    <p>
                      This permanently removes the auditorium from campus listings. Deletion is only
                      permitted when there are no active reservations.
                    </p>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={del.isPending}
                        onClick={() => setDeleteTarget(null)}
                      >
                        Keep venue
                      </button>
                      <button
                        type="button"
                        className="button button-danger"
                        disabled={del.isPending}
                        onClick={() => del.mutate(deleteTarget._id)}
                      >
                        {del.isPending ? 'Deleting…' : 'Delete venue'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

function AuditoriumForm({ auth }) {
  const { id } = useParams()
  const edit = !!id
  const q = useQuery({
    queryKey: ['auditorium', id],
    queryFn: async () => (await api.get(`/auditoriums/viewAuditorium/${id}`)).data.auditorium,
    enabled: edit,
  })

  const [form, setForm] = useState({
    name: '',
    capacity: '',
    basePrice: '',
    description: '',
    amenities: '',
    images: [],
  })
  const [err, setErr] = useState('')

  useEffect(() => {
    if (q.data) {
      setForm({
        name: q.data.name,
        capacity: q.data.capacity,
        basePrice: q.data.basePrice,
        description: q.data.description,
        amenities: (q.data.amenities || []).join(', '),
        images: q.data.images || [],
      })
    }
  }, [q.data])

  const qc = useQueryClient()
  const nav = useNavigate()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!edit && (!form.images || form.images.length === 0)) {
        throw new Error('Please upload at least one image of the auditorium.')
      }
      const data = new FormData()
      ;['name', 'capacity', 'basePrice', 'description', 'amenities'].forEach((k) =>
        data.append(k, form[k])
      )
      form.images.filter((x) => x instanceof File).forEach((f) => data.append('images', f))
      return api.request({
        method: edit ? 'put' : 'post',
        url: edit ? `/auditoriums/updateAuditorium/${id}` : '/auditoriums/createAuditorium',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auditoriums'] })
      nav('/admin/auditoriums')
    },
    onError: (e) => setErr(getError(e)),
  })

  const addFiles = (files) => {
    const selected = Array.from(files)
    if (selected.length > 5) {
      setErr('A maximum of 5 images is allowed.')
      return
    }
    if (selected.some((f) => f.size > 5 * 1024 * 1024)) {
      setErr('Each image file must be 5 MB or smaller.')
      return
    }
    setErr('')
    setForm({ ...form, images: selected })
  }

  return (
    <RequireRole auth={auth} role="admin">
      <DashboardShell
        auth={auth}
        title={edit ? 'Edit auditorium' : 'Add auditorium'}
        subtitle="VENUE CONFIGURATION"
        children={{
          content: q.isLoading ? (
            <LoadingRows />
          ) : (
            <div className="form-layout">
              <section className="panel auditorium-edit-panel">
                <div className="panel-header">
                  <div>
                    <h2>{edit ? 'Update Venue Details' : 'Register New Campus Venue'}</h2>
                    <p>Accurate venue details help organizers identify the right space for their event.</p>
                  </div>
                </div>

                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setErr('')
                    mutation.mutate()
                  }}
                >
                  <label className="form-label">
                    Auditorium Name
                    <input
                      className="input"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Grand Assembly Hall"
                    />
                  </label>

                  <div className="time-row">
                    <label className="form-label">
                      Seating Capacity
                      <input
                        className="input"
                        type="number"
                        min="1"
                        required
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                        placeholder="Number of seats"
                      />
                    </label>
                    <label className="form-label">
                      Hourly Rate (INR)
                      <input
                        className="input"
                        type="number"
                        min="1"
                        required
                        value={form.basePrice}
                        onChange={(e) => setForm({ ...form, totalPrice: e.target.value, basePrice: e.target.value })}
                        placeholder="0"
                      />
                    </label>
                  </div>

                  <label className="form-label">
                    Description
                    <textarea
                      className="input textarea"
                      maxLength={500}
                      required
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe venue highlights, acoustics, staging, and recommended event types."
                    />
                    <span className="field-hint">{form.description.length}/500 characters</span>
                  </label>

                  <label className="form-label">
                    Included Amenities
                    <span className="field-hint">Separate items with commas</span>
                    <input
                      className="input"
                      value={form.amenities}
                      onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                      placeholder="Air conditioning, Dual 4K Projectors, Wireless Mic, Theater Stage"
                    />
                  </label>

                  <div className="form-label">
                    Venue Photographs
                    <span className="field-hint">
                      Up to 5 images, max 5 MB each. Selecting new files replaces existing images.
                    </span>
                    <label
                      className="upload-zone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        addFiles(e.dataTransfer.files)
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => addFiles(e.target.files)}
                      />
                      <span className="upload-plus">+</span>
                      <strong>Drop photos here or click to browse</strong>
                      <small>Supports JPG, PNG, WEBP · Up to 5 files</small>
                    </label>

                    <div className="image-previews">
                      {form.images.map((f, i) => (
                        <div key={`${f.name || f}-${i}`}>
                          <img
                            src={f instanceof File ? URL.createObjectURL(f) : f}
                            alt="Venue preview"
                          />
                          {f instanceof File && (
                            <button
                              type="button"
                              aria-label="Remove image"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  images: form.images.filter((_, j) => i !== j),
                                })
                              }
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {err && (
                    <div className="form-error">
                      <AlertCircle size={16} />
                      <span>{err}</span>
                    </div>
                  )}

                  <div className="form-actions">
                    <Link className="button button-secondary" to="/admin/auditoriums">
                      Cancel
                    </Link>
                    <button className="button" disabled={mutation.isPending}>
                      {mutation.isPending
                        ? 'Saving…'
                        : edit
                        ? 'Save changes'
                        : 'Register auditorium'}{' '}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              </section>

              <aside className="form-tip">
                <Settings2 size={20} />
                <strong>High Quality Venue Listings</strong>
                <p>
                  Include clear, well-lit photography and a descriptive inventory of stage and audio
                  equipment to reduce student inquiries and speed up reservation approvals.
                </p>
              </aside>
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

// ============================================================================
// Application Entry Point & Router
// ============================================================================

export default function App() {
  const auth = useUser()

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing auth={auth} />} />
        <Route path="/auditoriums" element={<Catalog auth={auth} />} />
        <Route path="/auditoriums/:id" element={<Detail auth={auth} />} />
        <Route path="/login" element={<AuthPage kind="login" />} />
        <Route path="/register" element={<AuthPage kind="register" />} />
        <Route path="/forgot-password" element={<AuthPage kind="forgot" />} />
        <Route path="/reset-password" element={<AuthPage kind="reset" />} />
        <Route path="/reset-password/:token" element={<AuthPage kind="reset" />} />
        <Route path="/verify-email" element={<VerifyPage />} />
        <Route path="/bookings" element={<Navigate to="/student/my-bookings" replace />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard user={auth.user} auth={auth} />} />
        <Route path="/student/book/:auditoriumId?" element={<BookPage auth={auth} />} />
        <Route path="/student/my-bookings" element={<MyBookings auth={auth} />} />
        <Route path="/student/payment/:bookingId" element={<PaymentPage auth={auth} />} />
        <Route path="/notifications" element={<Notifications auth={auth} />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard auth={auth} />} />
        <Route path="/admin/bookings" element={<AdminBookings auth={auth} />} />
        <Route path="/admin/auditoriums" element={<AdminAuditoriums auth={auth} />} />
        <Route path="/admin/auditoriums/new" element={<AuditoriumForm auth={auth} />} />
        <Route path="/admin/auditoriums/edit/:id" element={<AuditoriumForm auth={auth} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {auth.toast && (
        <div className="toast" role="alert">
          <CheckCircle2 size={18} />
          <span>{auth.toast}</span>
          <button onClick={() => auth.setToast('')} aria-label="Dismiss toast">
            <X size={15} />
          </button>
        </div>
      )}
    </>
  )
}
