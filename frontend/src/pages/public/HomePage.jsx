import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Compass,
  Gauge,
  LockKeyhole,
  Mail,
  MapPin,
  PhoneCall,
  Search,
  SendHorizonal,
  ShieldCheck,
  Users,
  UsersRound,
  Waypoints,
} from "lucide-react";
import { fadeIn, scaleIn, slideLeft, slideRight, slideUp, staggerContainer as defaultStagger } from "../../lib/animations";

const staggerContainer = defaultStagger;
const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
};

const features = [
  {
    icon: Search,
    title: "Venue discovery",
    text: "Compare capacity, amenities, images, and booking context before students submit a request.",
  },
  {
    icon: CalendarCheck,
    title: "Structured booking flow",
    text: "Capture date, time, event purpose, and organizer details in one approval-ready workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Admin approvals",
    text: "Review requests, manage venue records, and keep operational decisions traceable.",
  },
  {
    icon: LockKeyhole,
    title: "Role-based access",
    text: "Separate student booking actions from administrative controls with clear protected routes.",
  },
  {
    icon: Gauge,
    title: "Faster decisions",
    text: "Reduce back-and-forth by showing the essential booking and auditorium data together.",
  },
  {
    icon: BarChart3,
    title: "Operational clarity",
    text: "Keep request status, venue details, and upcoming activity easy to scan across dashboards.",
  },
];

const processSteps = [
  {
    icon: Compass,
    title: "Discover the right space",
    text: "Browse auditoriums with detailed specs on capacity, amenities, pricing, and images — all in one place.",
    highlight: "Browse & compare",
  },
  {
    icon: SendHorizonal,
    title: "Submit a complete request",
    text: "Fill in your event date, time, purpose, and organizer details. A structured form ensures nothing gets missed.",
    highlight: "Fill & submit",
  },
  {
    icon: Waypoints,
    title: "Track admin decisions",
    text: "Get real-time status updates. Admins review, approve, or cancel — you'll always know where things stand.",
    highlight: "Monitor & act",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const containerVariantsSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 25 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 },
  }),
};

export function HomePage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <motion.p custom={0} variants={heroItem} initial="hidden" animate="visible" className="eyebrow">
            Campus auditorium booking
          </motion.p>
          <motion.h1 custom={1} variants={heroItem} initial="hidden" animate="visible" className="hero-title">
            Venue booking, <span className="hero-title-gradient">simplified.</span>
          </motion.h1>
          <motion.p custom={2} variants={heroItem} initial="hidden" animate="visible" className="hero-subtitle">
            A streamlined workspace for students and admins to discover venues, submit requests, and track approvals — all in one place.
          </motion.p>
          <motion.div custom={3} variants={heroItem} initial="hidden" animate="visible" className="hero-actions">
            <Link className="button primary hero-button" to="/auditoriums">
              View auditoriums <ArrowRight size={18} />
            </Link>
            <a className="button ghost hero-button" href="#about">
              Explore platform
            </a>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <motion.section
        className="landing-section"
        id="about"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={containerVariantsSlow}
      >
        <div className="about-split">
          <motion.div variants={slideRight}>
            <p className="eyebrow">About the platform</p>
            <h2>
              Built for university venue operations, <span style={{ color: "var(--primary)" }}>not just browsing.</span>
            </h2>
            <p>
              Auditorium booking often slows down when venue information, request details,
              and approval decisions live in different messages. This system brings the
              entire workflow into a single, dependable product experience.
            </p>
            <Link to="/auditoriums" className="button primary">
              Explore auditoriums <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div className="about-value-grid" variants={slideLeft}>
            {[
              {
                icon: BadgeCheck,
                title: "Verified users",
                text: "University email based access keeps the booking workflow accountable.",
              },
              {
                icon: UsersRound,
                title: "Two clear roles",
                text: "Students request spaces while admins manage auditoriums and approvals.",
              },
              {
                icon: CheckCircle2,
                title: "Operational clarity",
                text: "Capacity, timing, venue details, and request status stay visible where decisions happen.",
              },
              {
                icon: BarChart3,
                title: "Track everything",
                text: "Dashboard analytics give admins full visibility into venue utilization.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.article key={item.title} custom={i} variants={cardItemVariants} className="value-card">
                  <span className="value-card-icon">
                    <Icon size={20} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="landing-section"
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={containerVariantsSlow}
      >
        <motion.div className="section-heading-block center" variants={fadeIn}>
          <p className="eyebrow">Features</p>
          <h2>Everything needed to move from request to approval.</h2>
          <p>A focused product surface for students, admins, and venue operations teams.</p>
        </motion.div>

        <motion.div
          className="feature-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                variants={cardVariants}
                className="feature-card"
              >
                <span className="feature-card-icon">
                  <Icon size={22} />
                </span>
                <span className="feature-card-index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Process Section */}
      <motion.section
        className="landing-section"
        id="process"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={containerVariantsSlow}
      >
        <motion.div className="section-heading-block center" variants={fadeIn}>
          <p className="eyebrow">Simple process</p>
          <h2>From venue discovery to approval tracking.</h2>
          <p>
            The workflow stays intentionally direct: find a space, submit the right
            information, and follow the decision trail from one dashboard.
          </p>
        </motion.div>

        <div className="process-grid">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article key={step.title} variants={cardVariants} custom={index} className="process-card">
                <div className="process-node">
                  <Icon size={32} />
                  <span className="process-badge">{index + 1}</span>
                </div>
                <div>
                  <span className="process-highlight">{step.highlight}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        className="landing-section"
        id="contact"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={scaleIn}
      >
        <div className="contact-card">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.p variants={fadeIn} className="eyebrow">Contact</motion.p>
            <motion.h2 variants={slideUp}>Have questions or need help with a booking?</motion.h2>
            <motion.p variants={fadeIn}>
              Reach the campus booking desk directly for venue inquiries, scheduling assistance, and event support.
            </motion.p>
            <motion.div variants={fadeIn} className="contact-points">
              <span>
                <Mail size={16} /> University account access
              </span>
              <span>
                <MapPin size={16} /> Campus facility workflows
              </span>
              <span>
                <Users size={16} /> Student and admin dashboards
              </span>
            </motion.div>
          </motion.div>
          <a className="phone-pill" href="tel:+919876543210">
            <PhoneCall size={20} style={{ color: "var(--primary)" }} />
            <span>
              <strong>+91 98765 43210</strong>
              <em>Call the booking desk</em>
            </span>
          </a>
        </div>
      </motion.section>
    </div>
  );
}

export default HomePage;
