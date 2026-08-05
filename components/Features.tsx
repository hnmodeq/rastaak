const FEATURES = [
  {
    icon: "M12 20a8 8 0 1 1 8-8M12 12l5-3",
    title: "Elastic capacity & performance",
    body: "Unlimited capacity for your largest datasets, and unlimited performance for your most demanding workloads — in a single scale-out platform.",
  },
  {
    icon: "M13 2L3 14h7l-1 8 11-13h-7l1-8z",
    title: "Instant access. Zero delays.",
    body: "One globally visible namespace available in real time to users and workloads anywhere — no replicas, no sync lag, no waiting.",
  },
  {
    icon: "M3 3v18h18M7 14l4-6 4 4 6-8",
    title: "Predictable cost control",
    body: "Optimize total cost of ownership by scaling capacity and performance up or down as your workloads change — pay for what you need.",
  },
  {
    icon: "M12 3l9 5v8l-9 5-9-5V8l9-5zM12 12l9-4M12 12L3 8M12 12v9",
    title: "Unified control across all data",
    body: "Control your entire data estate from a single platform. No migration, no consolidation — instant visibility and governance everywhere.",
  },
  {
    icon: "M9 8a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zM17 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 15c2.8.3 5 2 5 5",
    title: "True global collaboration",
    body: "Enable teams worldwide to work on the same massive datasets simultaneously — eliminating data-copy costs and sync delays.",
  },
  {
    icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4zM9 12l2 2 4-4",
    title: "Centralized data governance",
    body: "Monitor, manage, and secure all your file data with consistent policies enforced everywhere your data resides.",
  },
];

export default function Features() {
  return (
    <section className="section features">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">Why RASTAAK</p>
          <h2 className="h2 reveal reveal-d1">
            Scale without limits.
            <br />
            <span className="grad">Perform without compromise.</span>
          </h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`fcard reveal${i % 3 === 1 ? " reveal-d1" : i % 3 === 2 ? " reveal-d2" : ""}`}>
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                  {f.title === "Elastic capacity & performance" && <circle cx="12" cy="12" r="9" />}
                </svg>
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <a href="#" className="link">
                Learn more
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: "1.5rem", height: "1.5rem" }}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
