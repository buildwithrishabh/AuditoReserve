import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import {
  AlertCircle,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clock3,
  DoorOpen,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Music,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
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

        <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
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
            aria-label="Toggle navigation"
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

  return (
    <div className={`stat-card ${highlight ? `stat-card-${highlight}` : ''}`}>
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
}

// ============================================================================
// Landing Page
// ============================================================================

function Landing({ auth }) {
  const q = useAuditoriums()
  const navigate = useNavigate()

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
      <main>
        {/* Clean Centered Hero Section */}
        <div className="hero-section-wrap">
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
                <strong>{q.data?.length ? `${q.data.length} Campus Venues` : 'Campus Auditoriums'}</strong>
                <span>Audited seating & AV equipment</span>
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
          ) : q.data?.length ? (
            <div className="card-grid">
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
            {q.data?.length ?? '—'} <span>spaces available</span>
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
          <span className="chips-title">Quick capacity:</span>
          {[
            { label: 'All Spaces', val: '' },
            { label: 'Small (<150)', val: '1' },
            { label: 'Medium (150-400)', val: '150' },
            { label: 'Grand (400+)', val: '400' },
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
            ) : venues.length ? (
              <div className="card-grid">
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

function Detail({ auth }) {
  const user = auth?.user
  const { id } = useParams()
  const q = useQuery({
    queryKey: ['auditorium', id],
    queryFn: async () => (await api.get(`/auditoriums/viewAuditorium/${id}`)).data.auditorium,
  })

  const [month, setMonth] = useState(new Date())
  const [range, setRange] = useState({ start: '09:00', end: '11:00' })
  const cal = useQuery({
    queryKey: ['calendar', id, month.toISOString().slice(0, 7)],
    queryFn: async () =>
      (
        await api.get('/bookings/calendar', {
          params: { auditoriumId: id, month: month.toISOString().slice(0, 7) },
        })
      ).data.bookings || [],
  })

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const firstDayOffset = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())

  const selectedDateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(selectedDay).padStart(2, '0')}`
  const hours = hoursBetween(range.start, range.end)

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

  return (
    <>
      <Header auth={auth} />
      <main className="page-container detail-page">
        <div className="breadcrumbs">
          <Link to="/auditoriums">Auditoriums</Link>
          <ChevronRight size={13} />
          <strong>{v.name}</strong>
        </div>

        <div className="detail-gallery">
          <img className="gallery-main" src={imageFor(v, 0)} alt={v.name} />
          <div className="gallery-side">
            <img src={imageFor(v, 1)} alt={`${v.name} seating`} />
            <img src={imageFor(v, 2)} alt={`${v.name} stage`} />
          </div>
          <span className="gallery-count">{(v.images || []).length || 3} photos</span>
        </div>

        <div className="detail-layout">
          <section className="detail-info">
            <span className="eyebrow">CAMPUS VENUE</span>
            <h1>{v.name}</h1>
            <p className="detail-description">{v.description}</p>

            <div className="detail-facts">
              <div>
                <Users size={18} />
                <span>
                  <small>CAPACITY</small>
                  <strong>{v.capacity} seats</strong>
                </span>
              </div>
              <div>
                <Clock3 size={18} />
                <span>
                  <small>HOURLY RATE</small>
                  <strong>
                    {money(v.basePrice)} <small>/ hour</small>
                  </strong>
                </span>
              </div>
              <div>
                <ShieldCheck size={18} />
                <span>
                  <small>BOOKING POLICY</small>
                  <strong>Admin review required</strong>
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h2>Included Amenities</h2>
              <div className="amenity-list">
                {(v.amenities || []).map((a) => (
                  <span key={a}>
                    <Check size={14} />
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-section availability-section">
              <div className="section-inline">
                <div>
                  <h2>Availability Calendar</h2>
                  <p>Check the schedule to find an open date for your event.</p>
                </div>
                <div className="calendar-month">
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

              {user ? (
                <>
                  <div className="calendar-grid calendar-weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {Array.from({ length: firstDayOffset }, (_, i) => (
                      <span key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const dayNumber = i + 1
                      const dateKey = `${month.getFullYear()}-${String(
                        month.getMonth() + 1
                      ).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                      const isPast =
                        new Date(dateKey + 'T00:00:00') <
                        new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                      const hasBookings = (cal.data || []).some(
                        (b) =>
                          new Date(b.bookingDate).toDateString() ===
                          new Date(dateKey + 'T00:00:00').toDateString()
                      )

                      return (
                        <button
                          key={dayNumber}
                          aria-label={`${dateKey}${hasBookings ? ', has bookings' : ''}`}
                          className={`calendar-day ${
                            selectedDay === dayNumber ? 'selected' : ''
                          } ${isPast ? 'disabled' : ''} ${
                            hasBookings ? 'day-has-bookings' : ''
                          }`}
                          disabled={isPast}
                          onClick={() => setSelectedDay(dayNumber)}
                        >
                          {dayNumber}
                        </button>
                      )
                    })}
                  </div>
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
                  </div>
                  {cal.isError && (
                    <div className="inline-error">
                      Unable to load calendar availability.{' '}
                      <button onClick={() => cal.refetch()}>Retry</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="sign-in-note">
                  <span>Sign in with your university account to view live availability and pick a date.</span>
                  <Link to="/login">
                    Sign in <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </section>

          <aside className="booking-card">
            <span className="booking-card-label">RESERVATION REQUEST</span>
            <h2>Request this space</h2>
            <p>Select your preferred date and time. Your request will be reviewed by campus administrators.</p>

            <label className="form-label">
              Date
              <input
                className="input"
                type="date"
                value={selectedDateStr}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const d = new Date(e.target.value + 'T00:00:00')
                  setMonth(d)
                  setSelectedDay(d.getDate())
                }}
              />
            </label>

            <div className="time-row" style={{ marginTop: '12px' }}>
              <label className="form-label">
                From
                <input
                  className="input"
                  type="time"
                  value={range.start}
                  onChange={(e) => setRange({ ...range, start: e.target.value })}
                />
              </label>
              <label className="form-label">
                Until
                <input
                  className="input"
                  type="time"
                  value={range.end}
                  onChange={(e) => setRange({ ...range, end: e.target.value })}
                />
              </label>
            </div>

            <div className="estimate">
              <span>
                Estimated Total
                <small>
                  {hours > 0 ? `${hours} hours reservation` : 'Select a valid time range'}
                </small>
              </span>
              <strong>{hours > 0 ? money(Math.round(hours * v.basePrice)) : '—'}</strong>
            </div>

            <Link
              className={`button booking-submit ${hours <= 0 ? 'disabled-link' : ''}`}
              to={
                user && hours > 0
                  ? `/student/book/${id}?date=${selectedDateStr}&start=${range.start}&end=${range.end}`
                  : '/login'
              }
            >
              Continue to booking <ArrowRight size={15} />
            </Link>

            <div className="secure-note">
              <ShieldCheck size={14} />
              <span>No payment is taken until your request is approved.</span>
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
        nav(d.user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard')
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
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
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
          <h2>{titles[kind][0]}</h2>
          <p>{titles[kind][1]}</p>
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
                  placeholder="e.g. Eleanor Vance"
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
      <aside className={`sidebar ${menu ? 'sidebar-open' : ''}`}>
        <Brand />
        <div className="side-org">
          <div className="org-avatar">AR</div>
          <div>
            <strong>Campus Operations</strong>
            <span>{isAdmin ? 'Administrator' : 'Student Workspace'}</span>
          </div>
          <ChevronDown size={14} />
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
      {menu && (
        <div
          className="sidebar-scrim"
          onClick={() => setMenu(false)}
          aria-hidden="true"
        />
      )}

      <main className="dash-main">
        <header className="dash-topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
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
// Student Views
// ============================================================================

function StudentDashboard({ user, auth }) {
  const q = useBookings()
  const data = q.data || []
  const pending = data.filter((b) => b.status === 'pending').length
  const approved = data.filter((b) => b.status === 'approved').length
  const confirmed = data.filter((b) => b.status === 'confirmed').length
  const payable = data.find((b) => b.status === 'approved')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}.`}
        subtitle="STUDENT WORKSPACE"
        children={{
          actions: (
            <Link className="button" to="/auditoriums">
              <DoorOpen size={14} /> Browse auditoriums
            </Link>
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
                    {[
                      ['Total reservations', data.length, 'calendar'],
                      ['Pending review', pending, 'clock'],
                      ['Approved (payment due)', approved, 'check'],
                      ['Confirmed bookings', confirmed, 'confirmed'],
                    ].map(([a, b, c]) => (
                      <StatCard key={a} title={a} value={b} icon={c} />
                    ))}
                  </div>

                  {payable && (
                    <div className="payment-alert">
                      <div className="alert-icon">
                        <Clock3 size={18} />
                      </div>
                      <div className="alert-copy">
                        <strong>Action required: Payment pending confirmation</strong>
                        <span>
                          {payable.auditorium?.name} · {dateText(payable.bookingDate)} · Payment due by{' '}
                          {dateText(payable.paymentDeadline)}
                        </span>
                      </div>
                      <Link className="button button-small" to={`/student/payment/${payable._id}`}>
                        Pay {money(payable.totalPrice)} <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}

                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <h2>Recent Reservations</h2>
                        <p>Track statuses and upcoming bookings across campus spaces.</p>
                      </div>
                      <Link className="text-link" to="/student/my-bookings">
                        View all reservations <ArrowRight size={14} />
                      </Link>
                    </div>

                    {data.length ? (
                      <BookingTable bookings={data.slice(0, 5)} student />
                    ) : (
                      <EmptyBookings />
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

function BookingTable({ bookings, student = false, onAction }) {
  return (
    <div className="table-scroll">
      <table>
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
            <tr key={b._id}>
              <td>
                <strong>{b.auditorium?.name || 'Auditorium'}</strong>
                <span className="cell-sub">{b.purpose || 'Campus reservation'}</span>
              </td>
              <td>
                <strong>{dateText(b.bookingDate)}</strong>
                <span className="cell-sub">
                  {b.startTime} – {b.endTime}
                </span>
              </td>
              {!student && (
                <td>
                  <strong>{b.user?.name || 'Student'}</strong>
                  <span className="cell-sub">{b.user?.email}</span>
                </td>
              )}
              <td>
                <Status value={b.status} />
              </td>
              <td className="amount-cell">{money(b.totalPrice)}</td>
              <td style={{ textAlign: 'right' }}>
                {onAction ? (
                  onAction(b)
                ) : student && b.status === 'approved' ? (
                  <Link className="table-action" to={`/student/payment/${b._id}`}>
                    Pay now
                  </Link>
                ) : student && b.status === 'confirmed' ? (
                  <Link className="table-action" to={`/student/payment/${b._id}`}>
                    Receipt
                  </Link>
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
  const [tab, setTab] = useState('all')
  const url =
    tab === 'all'
      ? '/bookings/my-bookings?limit=50'
      : `/bookings/my-bookings?limit=50&status=${tab}`
  const q = useBookings(url)
  const qc = useQueryClient()

  const cancel = useMutation({
    mutationFn: (id) => api.put(`/bookings/cancel/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title="My bookings"
        subtitle="RESERVATION HISTORY"
        children={{
          content: (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Your Reservations</h2>
                  <p>Track request statuses, payment deadlines, and confirmed venue bookings.</p>
                </div>
              </div>

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
                    onClick={() => setTab(k)}
                    key={k}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {q.isLoading ? (
                <LoadingRows />
              ) : q.isError ? (
                <PageState error={q.error} retry={q.refetch} />
              ) : q.data?.length ? (
                <BookingTable
                  bookings={q.data}
                  student
                  onAction={(b) => (
                    <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                      {b.status === 'approved' && (
                        <Link className="table-action" to={`/student/payment/${b._id}`}>
                          Pay now
                        </Link>
                      )}
                      {b.status === 'confirmed' && (
                        <a
                          className="table-action"
                          href={`${api.defaults.baseURL}/payments/${b._id}/receipt/download`}
                          onClick={async (e) => {
                            e.preventDefault()
                            const r = await api.get(`/payments/${b._id}/receipt/download`, {
                              responseType: 'blob',
                            })
                            const u = URL.createObjectURL(r.data)
                            const a = document.createElement('a')
                            a.href = u
                            a.download = `auditoreserve-receipt-${b._id}.pdf`
                            a.click()
                            URL.revokeObjectURL(u)
                          }}
                        >
                          Receipt
                        </a>
                      )}
                      {['pending', 'approved'].includes(b.status) && (
                        <button
                          className="table-action subtle"
                          onClick={() => {
                            if (window.confirm('Cancel this booking request?')) {
                              cancel.mutate(b._id)
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                />
              ) : (
                <EmptyBookings />
              )}
            </div>
          ),
        }}
      />
    </RequireRole>
  )
}

function BookPage({ auth }) {
  const { auditoriumId } = useParams()
  const [search] = useSearchParams()
  const [form, setForm] = useState({
    auditoriumId: auditoriumId || '',
    bookingDate: search.get('date') || '',
    startTime: search.get('start') || '09:00',
    endTime: search.get('end') || '11:00',
    purpose: '',
  })
  const [error, setError] = useState('')
  const aq = useAuditoriums()
  const venue = aq.data?.find((v) => v._id === form.auditoriumId)
  const duration = hoursBetween(form.startTime, form.endTime)
  const qc = useQueryClient()
  const nav = useNavigate()

  const mutation = useMutation({
    mutationFn: () => api.post('/bookings/createBooking', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] })
      nav('/student/my-bookings')
    },
    onError: (e) => setError(getError(e)),
  })

  return (
    <RequireRole auth={auth} role="student">
      <DashboardShell
        auth={auth}
        title="Request a booking"
        subtitle="NEW RESERVATION"
        children={{
          content: (
            <div className="booking-flow">
              <section className="panel booking-form-panel">
                <div className="panel-header">
                  <div>
                    <h2>Reservation Details</h2>
                    <p>Provide the details of your upcoming event for review.</p>
                  </div>
                  <span className="step-chip">
                    Step 1 <span>of</span> 2
                  </span>
                </div>

                <div className="progress-steps">
                  <span className="current">
                    <i>1</i> Details & Schedule
                  </span>
                  <span>
                    <i>2</i> Admin Approval
                  </span>
                  <span>
                    <i>3</i> Confirmation
                  </span>
                </div>

                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setError('')
                    mutation.mutate()
                  }}
                >
                  <label className="form-label">
                    Auditorium
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

                  <label className="form-label">
                    Event Date
                    <input
                      className="input"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={form.bookingDate}
                      onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
                      required
                    />
                  </label>

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

                  <label className="form-label">
                    Purpose of Booking
                    <textarea
                      className="input textarea"
                      maxLength={500}
                      placeholder="Outline your event purpose, expected attendance, and special equipment requirements."
                      value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                      required
                    />
                    <span className="field-hint">{form.purpose.length}/500 characters</span>
                  </label>

                  {error && (
                    <div className="form-error">
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button className="button auth-submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Submitting request…' : 'Submit booking request'}{' '}
                    <ArrowRight size={15} />
                  </button>

                  <p className="submission-note">
                    <ShieldCheck size={14} />
                    <span>No advance payment is taken. Fees are due only after administrative review.</span>
                  </p>
                </form>
              </section>

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
                    <span>Select an auditorium to view its details and pricing.</span>
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
                      <Clock3 size={14} /> Time Slot
                    </span>
                    <strong>
                      {form.startTime} – {form.endTime}
                    </strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{duration > 0 ? `${duration} hours` : '—'}</strong>
                  </div>
                  <div className="summary-total">
                    <span>Estimated Total</span>
                    <strong>
                      {venue && duration > 0 ? money(Math.round(duration * venue.basePrice)) : '—'}
                    </strong>
                  </div>
                </div>

                <div className="summary-note">
                  Once submitted, the venue remains provisionally held while campus administrators review
                  your request.
                </div>
              </aside>
            </div>
          ),
        }}
      />
    </RequireRole>
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
        theme: { color: '#1b4332' },
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
          ) : success ? (
            <div className="success-panel">
              <div className="success-large">
                <Check size={32} />
              </div>
              <span className="eyebrow">RESERVATION CONFIRMED</span>
              <h2>Your booking is secured.</h2>
              <p>Payment has been verified and your auditorium reservation is confirmed on the campus schedule.</p>

              <div className="receipt-card">
                <div>
                  <span>Venue</span>
                  <strong>{booking?.auditorium?.name}</strong>
                </div>
                <div>
                  <span>Event Date</span>
                  <strong>{dateText(booking?.bookingDate)}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>
                    {booking?.startTime} – {booking?.endTime}
                  </strong>
                </div>
                <div>
                  <span>Transaction ID</span>
                  <strong>{success.gatewayPaymentId || success._id}</strong>
                </div>
                <div>
                  <span>Total Amount Paid</span>
                  <strong>{money(success.amount || booking?.totalPrice)}</strong>
                </div>
              </div>

              <a
                className="button"
                href={`${api.defaults.baseURL}/payments/${bookingId}/receipt/download`}
                onClick={async (e) => {
                  e.preventDefault()
                  const r = await api.get(`/payments/${bookingId}/receipt/download`, {
                    responseType: 'blob',
                  })
                  const u = URL.createObjectURL(r.data)
                  const a = document.createElement('a')
                  a.href = u
                  a.download = `receipt-${bookingId}.pdf`
                  a.click()
                  URL.revokeObjectURL(u)
                }}
              >
                Download Receipt PDF <ArrowRight size={14} />
              </a>
              <Link className="text-link" to="/student/my-bookings">
                Return to my reservations
              </Link>
            </div>
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

  return (
    <RequireRole auth={auth}>
      <DashboardShell
        auth={auth}
        title="Notifications"
        subtitle="UPDATES & ALERTS"
        children={{
          content: (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Recent Notifications</h2>
                  <p>Reservation updates, status notices, and payment receipts from campus admins.</p>
                </div>
                <button className="text-link" onClick={() => mark.mutate()}>
                  Mark all as read <Check size={14} />
                </button>
              </div>

              {q.isLoading ? (
                <LoadingRows />
              ) : q.isError ? (
                <PageState error={q.error} retry={q.refetch} />
              ) : q.data?.length ? (
                <div className="notification-list">
                  {q.data.map((n) => (
                    <div className={`notification-row ${n.isRead ? 'read' : ''}`} key={n._id}>
                      <div className="notification-symbol">
                        <Bell size={16} />
                      </div>
                      <div className="notification-body">
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>
                      {!n.isRead && (
                        <button className="mark-read" onClick={() => mark.mutate(n._id)}>
                          Mark read
                        </button>
                      )}
                      <button
                        className="icon-button"
                        onClick={() => del.mutate(n._id)}
                        aria-label="Delete notification"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel">
                  <div className="state-icon">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3>You’re all caught up</h3>
                    <p>New booking alerts and payment receipts will appear here.</p>
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
            <Link className="button" to="/admin/auditoriums/new">
              <Plus size={14} /> Add auditorium
            </Link>
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
                    />
                    <StatCard
                      title="Total Bookings"
                      value={bq.data?.pagination?.totalItems ?? list.length}
                      icon="calendar"
                      note="All-time reservations"
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
                    />
                    <StatCard
                      title="Confirmed Revenue"
                      value={money(revenue)}
                      icon="rupee"
                      note="From confirmed bookings"
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
                      <button className="table-action" onClick={() => setSelected(b)}>
                        Inspect details
                      </button>
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

  const del = useMutation({
    mutationFn: (id) => api.delete(`/auditoriums/deleteAuditorium/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auditoriums'] }),
    onError: (e) => setMsg(getError(e)),
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
                          className="table-action subtle"
                          disabled={del.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete ${v.name}? This is only allowed if there are no active bookings.`
                              )
                            ) {
                              del.mutate(v._id)
                            }
                          }}
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
