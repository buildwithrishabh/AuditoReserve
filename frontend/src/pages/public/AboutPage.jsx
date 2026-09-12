import { Link } from "react-router-dom";
import { BadgeCheck, CalendarDays, Gauge, LockKeyhole, UsersRound } from "lucide-react";

const values = [
  {
    icon: Gauge,
    title: "Fast decisions",
    text: "Students get a clear path to request a venue, and admins get the information needed to approve or cancel quickly.",
  },
  {
    icon: LockKeyhole,
    title: "Secure access",
    text: "Role-based navigation keeps student workflows and admin controls separated.",
  },
  {
    icon: CalendarDays,
    title: "Operational clarity",
    text: "Booking date, time, purpose, status, and venue details stay visible across the workflow.",
  },
];

export function AboutPage() {
  return (
    <div className="public-page">
      <section className="about-hero">
        <p className="eyebrow">About the platform</p>
        <h1>Built for university venue operations, not just browsing.</h1>
        <p>
          AuditoReserve helps students discover campus venues and
          request bookings while giving administrators a dependable place to
          maintain auditoriums and process requests.
        </p>
      </section>

      <section className="about-split">
        <div>
          <h2>Why this system matters</h2>
          <p>
            Auditorium booking often becomes slow when venue information,
            request details, and approval decisions are scattered across
            messages. This application brings those steps into a single digital
            workflow.
          </p>
          <p>
            Students can focus on finding the right venue for an event. Admins
            can focus on availability, capacity, approvals, and maintaining
            accurate auditorium records.
          </p>
          <Link className="button primary" to="/auditoriums">
            Explore auditoriums
          </Link>
        </div>
        <div className="about-proof">
          <div>
            <BadgeCheck size={26} />
            <strong>Verified users</strong>
            <span>University email based access</span>
          </div>
          <div>
            <UsersRound size={26} />
            <strong>Two clear roles</strong>
            <span>Student booking and admin management</span>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {values.map((item) => {
          const Icon = item.icon;
          return (
            <article className="feature-card" key={item.title}>
              <span className="feature-icon">
                <Icon size={22} />
              </span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default AboutPage;
