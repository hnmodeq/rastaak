const ITEMS = ["24/7 real engineers", "No ticket queue", "Sub-15 min response"];

export default function Support() {
  return (
    <section className="section support">
      <div className="container">
        <div className="support-inner">
          <p className="eyebrow reveal" style={{ justifyContent: "center", display: "flex" }}>
            Support
          </p>
          <h2 className="h2 reveal reveal-d1">
            One Platform. One Partner.
            <br />
            <span className="grad">Experts on standby.</span>
          </h2>
          <p className="lede reveal reveal-d2">
            No ticket queue. 24/7 support from engineers who understand
            distributed data access, cloud and edge compute, and high-performance
            workloads. Real humans. Real answers.
          </p>
          <ul className="support-list reveal reveal-d3">
            {ITEMS.map((item) => (
              <li key={item}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <a href="#contact" className="btn btn-primary btn-lg reveal reveal-d4">
            Talk to an expert
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
