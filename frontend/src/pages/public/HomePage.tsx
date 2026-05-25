import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
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
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.1 },
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

const glowOrbs = [
  { top: "-120px", left: "-80px", size: "300px", color: "rgba(124,115,230,0.12)" },
  { bottom: "-100px", right: "-60px", size: "250px", color: "rgba(79,70,229,0.08)" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const containerVariantsSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.15 },
  }),
};

const processCardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export function HomePage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="landing-page">
      <motion.section
        id="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "relative",
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          margin: "-116px calc(-50vw + 50%) 0",
          width: "100vw",
          padding: "196px calc(50vw - 50%) 80px",
        }}
      >
        {/* Subtle background glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: `
              radial-gradient(ellipse 70% 60% at 70% 50%, rgba(124,115,230,0.08), transparent 70%),
              radial-gradient(ellipse 60% 50% at 30% 50%, rgba(124,115,230,0.04), transparent 60%)
            `,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(1280px, calc(100% - 40px))",
            margin: "0 auto",
          }}
        >
          <motion.div
            custom={0}
            variants={heroItem}
            initial="hidden"
            animate="visible"
            style={{ width: "100%", textAlign: "center" }}
          >
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>
              <motion.p
                custom={0}
                variants={heroItem}
                initial="hidden"
                animate="visible"
                className="eyebrow"
                style={{ color: "#a78bfa" }}
              >
                Campus auditorium booking
              </motion.p>
              <motion.h1
                custom={1}
                variants={heroItem}
                initial="hidden"
                animate="visible"
                style={{
                  fontSize: "clamp(56px, 8vw, 100px)",
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  marginBottom: "22px",
                  color: "#fff",
                }}
              >
                Venue booking,{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #a78bfa 0%, #7c73e6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  simplified.
                </span>
              </motion.h1>
              <motion.p
                custom={2}
                variants={heroItem}
                initial="hidden"
                animate="visible"
                style={{
                  fontSize: "20px",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.7)",
                  maxWidth: "640px",
                  margin: "0 auto",
                }}
              >
                A streamlined workspace for students and admins to discover venues, submit requests, and track approvals — all in one place.
              </motion.p>
              <motion.div
                custom={3}
                variants={heroItem}
                initial="hidden"
                animate="visible"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "14px",
                  marginTop: "34px",
                  justifyContent: "center",
                }}
              >
                <Link
                  className="button primary hero-button"
                  to="/auditoriums"
                  style={{ minHeight: "54px", paddingInline: "28px" }}
                >
                  View auditoriums
                  <ArrowRight size={18} />
                </Link>
                <a
                  className="button ghost hero-button"
                  href="#about"
                  style={{
                    minHeight: "54px",
                    paddingInline: "28px",
                    background: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                >
                  Explore platform
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="landing-section"
        id="about"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariantsSlow}
      >
        <div className="about-split">
          <motion.div
            variants={slideRight}
            style={{ position: "relative", zIndex: 1 }}
          >
            <p className="eyebrow">About the platform</p>
            <h2
              style={{
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              Built for university venue operations,{" "}
              <span style={{ color: "var(--accent)" }}>not just browsing.</span>
            </h2>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.8",
                color: "var(--text-muted)",
                marginBottom: "28px",
                maxWidth: "500px",
              }}
            >
              Auditorium booking often slows down when venue information, request details,
              and approval decisions live in different messages. This system brings the
              entire workflow into a single, dependable product experience.
            </p>
            <Link
              to="/auditoriums"
              className="button primary"
              style={{ minHeight: "48px", paddingInline: "28px" }}
            >
              Explore auditoriums <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            className="about-value-grid"
            variants={slideLeft}
          >
            {/* Floating glow orb behind cards */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "280px",
                height: "280px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,115,230,0.1), transparent 70%)",
                pointerEvents: "none",
              }}
            />

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
                <motion.article
                  key={item.title}
                  custom={i}
                  variants={cardItemVariants}
                  whileHover={{
                    y: -6,
                    borderColor: "rgba(124,115,230,0.3)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "24px",
                    borderRadius: "20px",
                    border: "1px solid var(--border)",
                    background: "rgba(19, 19, 26, 0.35)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <motion.span
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "grid",
                      width: "40px",
                      height: "40px",
                      placeItems: "center",
                      borderRadius: "12px",
                      border: "1px solid rgba(124,115,230,0.15)",
                      background: "linear-gradient(135deg, rgba(124,115,230,0.1), transparent)",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </motion.span>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                    {item.text}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="landing-section"
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariantsSlow}
      >
        {/* Background orbs */}
        {glowOrbs.map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              [orb.top ? "top" : "bottom"]: orb.top || orb.bottom,
              [orb.left ? "left" : "right"]: orb.left || orb.right,
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ))}

        <motion.div
          className="section-heading-block center"
          variants={fadeIn}
          style={{ position: "relative", zIndex: 1 }}
        >
          <p className="eyebrow">Features</p>
          <h2>Everything needed to move from request to approval.</h2>
          <p>
            A focused product surface for students, admins, and venue operations teams.
          </p>
        </motion.div>

        <motion.div
          className="feature-grid"
          style={{ position: "relative", zIndex: 1 }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((item, i) => {
            const Icon = item.icon;
            const isHovered = hoveredIdx === i;

            return (
              <motion.article
                key={item.title}
                variants={cardVariants}
                whileHover={{
                  y: -8,
                  borderColor: "rgba(124, 115, 230, 0.35)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.4), 0 0 60px rgba(124,115,230,0.06)",
                  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                }}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  padding: "32px",
                  borderRadius: "24px",
                  border: "1px solid var(--border)",
                  background: isHovered
                    ? "linear-gradient(145deg, rgba(19,19,26,0.95), rgba(30,26,58,0.6))"
                    : "rgba(19, 19, 26, 0.4)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  cursor: "default",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Card glow */}
                <motion.div
                  animate={{ opacity: isHovered ? 1 : 0.4 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    position: "absolute",
                    top: "-80px",
                    right: "-80px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(124,115,230,0.12), transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />

                {/* Icon */}
                <motion.span
                  animate={{
                    scale: isHovered ? 1.08 : 1,
                    rotate: isHovered ? -3 : 0,
                    borderColor: isHovered
                      ? "rgba(124, 115, 230, 0.3)"
                      : "rgba(124, 115, 230, 0.12)",
                    color: isHovered ? "var(--accent)" : "var(--text-muted)",
                  }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    display: "grid",
                    width: "52px",
                    height: "52px",
                    placeItems: "center",
                    borderRadius: "16px",
                    marginBottom: "20px",
                    border: "1px solid rgba(124, 115, 230, 0.12)",
                    background: isHovered
                      ? "linear-gradient(135deg, rgba(124,115,230,0.2), rgba(79,70,229,0.08))"
                      : "linear-gradient(135deg, rgba(124,115,230,0.08), transparent)",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </motion.span>

                {/* Index */}
                <span
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "20px",
                    fontSize: "40px",
                    fontWeight: 850,
                    color: isHovered
                      ? "rgba(124,115,230,0.1)"
                      : "rgba(255,255,255,0.03)",
                    lineHeight: 1,
                    transition: "color 0.4s ease",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.7",
                    color: "var(--text-muted)",
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {item.text}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.section
        className="landing-section"
        id="process"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariantsSlow}
      >
        <motion.div
          className="section-heading-block center"
          variants={fadeIn}
        >
          <p className="eyebrow">Simple process</p>
          <h2>From venue discovery to approval tracking.</h2>
          <p>
            The workflow stays intentionally direct: find a space, submit the right
            information, and follow the decision trail from one dashboard.
          </p>
        </motion.div>

        <div className="process-grid">
          {/* Connecting line */}
          <div className="process-grid-line" />

          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.title}
                variants={processCardVariants}
                custom={index}
                whileHover={{
                  y: -6,
                  borderColor: "rgba(124, 115, 230, 0.3)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "24px",
                  padding: "32px 24px",
                  borderRadius: "24px",
                  border: "1px solid var(--border)",
                  background: "rgba(19, 19, 26, 0.5)",
                  position: "relative",
                }}
              >
                {/* Step number badge */}
                <motion.div
                  whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    width: "80px",
                    height: "80px",
                    placeItems: "center",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(124,115,230,0.15), rgba(79,70,229,0.05))",
                    border: "2px solid rgba(124,115,230,0.25)",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={34} style={{ color: "var(--accent)" }} />
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c73e6, #4f46e5)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 800,
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 4px 12px rgba(79,70,229,0.4)",
                    }}
                  >
                    {index + 1}
                  </span>
                </motion.div>

                <div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--accent)",
                      marginBottom: "8px",
                      padding: "2px 10px",
                      borderRadius: "99px",
                      background: "rgba(124,115,230,0.1)",
                      border: "1px solid rgba(124,115,230,0.15)",
                    }}
                  >
                    {step.highlight}
                  </span>
                  <h3 style={{ fontSize: "19px", marginBottom: "10px" }}>{step.title}</h3>
                  <p style={{ fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        className="landing-section contact-section"
        id="contact"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={scaleIn}
      >
        <motion.div
          className="contact-card"
          whileHover={{ boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeIn} className="eyebrow">Contact</motion.p>
            <motion.h2 variants={slideUp}>Have questions or need help with a booking?</motion.h2>
            <motion.p variants={fadeIn}>
              Reach the campus booking desk directly for venue inquiries, scheduling assistance, and event support.
            </motion.p>
            <motion.div variants={fadeIn} className="contact-points">
              <span>
                <Mail size={16} />
                University account access
              </span>
              <span>
                <MapPin size={16} />
                Campus facility workflows
              </span>
              <span>
                <Users size={16} />
                Student and admin dashboards
              </span>
            </motion.div>
          </motion.div>
          <motion.a
            className="phone-pill"
            href="tel:+919876543210"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <PhoneCall size={18} />
            <span>
              <strong>+91 98765 43210</strong>
              <em>Call the booking desk</em>
            </span>
          </motion.a>
        </motion.div>
      </motion.section>
    </div>
  );
}

export default HomePage;
