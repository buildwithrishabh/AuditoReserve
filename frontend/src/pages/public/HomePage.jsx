import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  HelpCircle,
  LockKeyhole,
  Mail,
  MapPin,
  PhoneCall,
  Search,
  SendHorizonal,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const heroVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 },
  }),
};

const features = [
  {
    icon: Search,
    color: "blue",
    title: "Venue discovery",
    text: "Compare seating capacity, stage dimensions, AV amenities, and high-res photography before submitting.",
  },
  {
    icon: CalendarCheck,
    color: "teal",
    title: "Slot conflict engine",
    text: "Interactive monthly calendars highlight scheduled bookings to prevent double-booking university facilities.",
  },
  {
    icon: ShieldCheck,
    color: "amber",
    title: "Admin authorization",
    text: "Facilities coordinators review requests, track organizer credentials, and issue time-bound approvals.",
  },
  {
    icon: CreditCard,
    color: "green",
    title: "12-hour payment window",
    text: "Approved bookings trigger an automated payment window with verified Razorpay checkout.",
  },
  {
    icon: FileCheck,
    color: "indigo",
    title: "Instant PDF receipts",
    text: "Download server-certified electronic transaction receipts with QR codes for campus security checks.",
  },
  {
    icon: LockKeyhole,
    color: "slate",
    title: "Role-based portals",
    text: "Protected student and administrative interfaces with dual-token authentication and instant silent refresh.",
  },
];

const timelineSteps = [
  {
    step: "01",
    icon: Search,
    title: "Browse venues",
    desc: "Explore auditorium specs, capacity limits, hourly rates, and photos.",
  },
  {
    step: "02",
    icon: SendHorizonal,
    title: "Request a slot",
    desc: "Pick your event date, enter start and end times, and specify the purpose.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Admin approves",
    desc: "Campus administrators review the request and lock the schedule.",
  },
  {
    step: "04",
    icon: CreditCard,
    title: "Pay & get receipt",
    desc: "Complete checkout within 12 hours and download your official PDF receipt.",
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* ─── 1. HERO SECTION ────────────────────────────────────────────── */}
      <section className="hero-section" id="home">
        <div className="hero-grid">
          {/* Left Hero Content */}
          <div className="hero-content">
            <motion.div custom={0} variants={heroVariants} initial="hidden" animate="visible">
              <span className="eyebrow">
                <Sparkles size={13} aria-hidden="true" />
                Campus Facility Management
              </span>
            </motion.div>

            <motion.h1 custom={1} variants={heroVariants} initial="hidden" animate="visible" className="hero-title">
              Book campus venues <span className="highlight-amber">without the back-and-forth.</span>
            </motion.h1>

            <motion.p custom={2} variants={heroVariants} initial="hidden" animate="visible" className="hero-lead">
              A unified platform for university departments, student societies, and event coordinators to discover available spaces, verify slot availability, and secure approved bookings.
            </motion.p>

            <motion.div custom={3} variants={heroVariants} initial="hidden" animate="visible" className="hero-actions">
              <Link className="button primary lg" to="/auditoriums">
                Browse auditoriums <ArrowRight size={18} />
              </Link>
              <a className="button ghost lg" href="#how-it-works">
                How it works
              </a>
            </motion.div>

            <motion.div custom={4} variants={heroVariants} initial="hidden" animate="visible" className="hero-trust-row">
              <div className="trust-item">
                <Check size={16} className="trust-check" />
                <span>University email sign-in</span>
              </div>
              <div className="trust-item">
                <Check size={16} className="trust-check" />
                <span>12-hour payment window</span>
              </div>
              <div className="trust-item">
                <Check size={16} className="trust-check" />
                <span>Instant PDF receipts</span>
              </div>
            </motion.div>
          </div>

          {/* Right Product Mockup (Pure CSS/JSX) */}
          <div className="hero-mockup-wrapper" aria-hidden="true">
            <div className="hero-glow-underlay" />
            
            <motion.div
              className="product-mock-stage"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              {/* Layer 1: Mini Month Calendar Card */}
              <div className="mock-card mock-calendar-card">
                <div className="mock-card-header">
                  <div className="mock-calendar-title">
                    <Calendar size={16} />
                    <span>November 2026</span>
                  </div>
                  <span className="mock-badge">Available</span>
                </div>
                <div className="mock-calendar-weekdays">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
                <div className="mock-calendar-grid">
                  <span className="dim">27</span><span className="dim">28</span><span className="dim">29</span><span className="dim">30</span>
                  <span>1</span><span>2</span><span>3</span>
                  <span>4</span><span>5</span><span className="has-dot">6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                  <span>11</span><span className="has-dot">12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span>
                  <span className="selected">18</span><span>19</span><span>20</span><span>21</span><span className="has-dot">22</span><span>23</span><span>24</span>
                  <span>25</span><span>26</span><span>27</span><span>28</span><span>29</span><span>30</span><span className="dim">1</span>
                </div>
              </div>

              {/* Layer 2: Main Booking Item Card */}
              <div className="mock-card mock-booking-card">
                <div className="mock-booking-top">
                  <div>
                    <h3 className="mock-venue-name">Main University Auditorium</h3>
                    <p className="mock-meta">Capacity: 450 seats &middot; AC &middot; Projector</p>
                  </div>
                  <span className="status approved">Approved</span>
                </div>
                <div className="mock-booking-details">
                  <div className="mock-detail-cell">
                    <span className="label">Date</span>
                    <strong className="value">Wed, 18 Nov 2026</strong>
                  </div>
                  <div className="mock-detail-cell">
                    <span className="label">Slot Time</span>
                    <strong className="value tabular-nums">14:00 &ndash; 17:00</strong>
                  </div>
                  <div className="mock-detail-cell">
                    <span className="label">Total Fee</span>
                    <strong className="value price tabular-nums">&#8377;4,500</strong>
                  </div>
                </div>
              </div>

              {/* Layer 3: Floating Real-time Toast Chip */}
              <div className="mock-toast-chip">
                <CheckCircle2 size={18} className="toast-chip-icon" />
                <div>
                  <strong>Payment verified</strong>
                  <span>Official receipt ready for download</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST STATS STRIP ────────────────────────────────────────── */}
      <section className="stats-strip">
        <div className="stats-container">
          <div className="stat-box">
            <Clock size={24} className="stat-icon" />
            <div>
              <strong className="stat-val tabular-nums">12-Hour</strong>
              <span className="stat-label">Payment guarantee window</span>
            </div>
          </div>
          <div className="stat-box">
            <Bell size={24} className="stat-icon" />
            <div>
              <strong className="stat-val tabular-nums">Real-Time</strong>
              <span className="stat-label">Instant approval alerts</span>
            </div>
          </div>
          <div className="stat-box">
            <FileCheck size={24} className="stat-icon" />
            <div>
              <strong className="stat-val tabular-nums">Instant PDF</strong>
              <span className="stat-label">Downloadable booking receipts</span>
            </div>
          </div>
          <div className="stat-box">
            <ShieldCheck size={24} className="stat-icon" />
            <div>
              <strong className="stat-val tabular-nums">Role-Based</strong>
              <span className="stat-label">Student & admin isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. ABOUT SECTION ───────────────────────────────────────────── */}
      <section className="landing-section" id="about">
        <div className="about-grid">
          {/* Left: About Text & Checkpoints */}
          <div className="about-text-col">
            <span className="eyebrow">Institutional Reliability</span>
            <h2>Designed for university events, not just casual browsing.</h2>
            <p className="lead">
              Campus venue scheduling slows down when booking requests, slot availability, and security compliance live in disparate emails and paper forms.
            </p>
            <p>
              AuditoReserve centralizes campus venue inventory into an accountable system with clear audit trails, calendar conflict locks, and automated payment deadlines.
            </p>

            <ul className="about-checklist">
              <li>
                <CheckCircle2 size={18} className="check-bullet" />
                <span>Automated slot conflict prevention prevents duplicate event bookings</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="check-bullet" />
                <span>Transparent hourly rates with automatic duration calculation</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="check-bullet" />
                <span>Verified university email authentication for accountable requests</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="check-bullet" />
                <span>Instant Google Calendar and .ics export for all confirmed events</span>
              </li>
            </ul>

            <div style={{ marginTop: "28px" }}>
              <Link to="/auditoriums" className="button primary">
                Explore campus venues <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right: Single Large Product Visual Panel */}
          <div className="about-visual-panel">
            <div className="panel-header">
              <div>
                <h4 style={{ margin: 0, fontSize: "1rem" }}>Slot Availability Engine</h4>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Live schedule for Tagore Memorial Auditorium
                </p>
              </div>
              <span className="status confirmed">Engine Active</span>
            </div>

            <div className="timeline-schedule-preview">
              <div className="preview-slot preview-slot--booked">
                <div className="slot-time tabular-nums">09:00 &ndash; 12:30</div>
                <div className="slot-info">
                  <strong>Annual Convocation Rehearsal</strong>
                  <span>Academic Council &middot; Confirmed</span>
                </div>
              </div>

              <div className="preview-slot preview-slot--free">
                <div className="slot-time tabular-nums">13:00 &ndash; 17:00</div>
                <div className="slot-info">
                  <strong style={{ color: "var(--primary)" }}>Available for Booking</strong>
                  <span>Standard student society rate applied</span>
                </div>
                <Link to="/auditoriums" className="button ghost sm" style={{ marginLeft: "auto" }}>
                  Select slot
                </Link>
              </div>

              <div className="preview-slot preview-slot--booked">
                <div className="slot-time tabular-nums">18:00 &ndash; 21:00</div>
                <div className="slot-info">
                  <strong>Robotics Society Annual Symposium</strong>
                  <span>Faculty of Engineering &middot; Confirmed</span>
                </div>
              </div>
            </div>

            <div className="panel-footer-note">
              <HelpCircle size={15} style={{ color: "var(--primary)" }} />
              <span>Slots are dynamically locked during checkout to prevent duplicate submissions.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. FEATURES SECTION (3x2 Grid) ─────────────────────────────── */}
      <section className="landing-section features-band" id="features">
        <div className="section-head text-center">
          <span className="eyebrow">Platform Capabilities</span>
          <h2>Everything required from slot request to event day.</h2>
          <p className="lead" style={{ maxWidth: "600px", margin: "0 auto" }}>
            A comprehensive, transparent operations workflow built specifically for university venues.
          </p>
        </div>

        <div className="features-grid">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card card--interactive feature-card-item">
                <div className={`feature-icon-tile feature-icon-tile--${item.color}`}>
                  <Icon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS (Dark Ink Band) ─────────────────────────────── */}
      <section className="how-it-works-band" id="how-it-works">
        <div className="how-it-works-container">
          <div className="section-head text-center light-text">
            <span className="eyebrow eyebrow--ink">Workflow Steps</span>
            <h2>How booking works at AuditoReserve</h2>
            <p className="lead" style={{ color: "var(--ink-muted)", maxWidth: "560px", margin: "0 auto" }}>
              Four simple, verified steps to secure your university event venue.
            </p>
          </div>

          <div className="timeline-track">
            {timelineSteps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="timeline-step">
                  <div className="step-circle">
                    <span className="step-number">{s.step}</span>
                  </div>
                  <div className="step-body">
                    <div className="step-icon-wrap">
                      <Icon size={20} />
                    </div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. CONTACT SECTION ─────────────────────────────────────────── */}
      <section className="landing-section" id="contact">
        <div className="contact-box">
          <div className="contact-info-col">
            <span className="eyebrow">Support & Desk</span>
            <h2>Need assistance with venue scheduling?</h2>
            <p>
              The university facilities booking desk provides support for slot conflicts, special technical requirements, VIP seating layouts, and guest coordination.
            </p>

            <div className="contact-points-list">
              <div className="point-item">
                <Mail size={18} className="point-icon" />
                <span>facilities@university.edu &middot; 24-hour response time</span>
              </div>
              <div className="point-item">
                <MapPin size={18} className="point-icon" />
                <span>Main Administration Block, Ground Floor, Room 104</span>
              </div>
              <div className="point-item">
                <Users size={18} className="point-icon" />
                <span>Open Monday to Saturday, 9:00 AM &ndash; 5:00 PM</span>
              </div>
            </div>
          </div>

          <div className="contact-cta-col">
            <div className="phone-card">
              <span className="phone-card-label">Direct Facilities Hotline</span>
              <a href="tel:+912267283000" className="phone-number tabular-nums">
                +91 22 6728 3000
              </a>
              <p className="phone-card-hint">
                Call during office hours for emergency scheduling and urgent venue access.
              </p>
              <a href="tel:+912267283000" className="button primary sm" style={{ width: "100%" }}>
                <PhoneCall size={16} /> Call booking desk
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FINAL ACTION BANNER ─────────────────────────────────────── */}
      <section className="final-cta-section">
        <div className="final-cta-card">
          <h2>Ready to schedule your campus event?</h2>
          <p>
            Explore verified auditoriums, check open slots in real-time, and submit your booking request in minutes.
          </p>

          <div className="final-cta-actions">
            {!user && (
              <>
                <Link to="/register" className="button primary lg">
                  Create university account
                </Link>
                <Link to="/auditoriums" className="button ghost lg">
                  Browse auditoriums
                </Link>
              </>
            )}
            {user?.role === "student" && (
              <>
                <Link to="/auditoriums" className="button primary lg">
                  Browse auditoriums
                </Link>
                <Link to="/bookings" className="button ghost lg">
                  View my bookings
                </Link>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <Link to="/admin" className="button primary lg">
                  Open admin console
                </Link>
                <Link to="/auditoriums" className="button ghost lg">
                  View public catalog
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
