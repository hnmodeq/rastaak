import DemoForm from "./DemoForm";

const FEATS = [
  {
    icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM9 12l2 2 4-4",
    title: "Secure by default",
    body: "SOC 2 Type II, end-to-end encryption, and granular governance everywhere your data lives.",
  },
  {
    icon: "M3 17l6-6 4 4 8-8M14 7h7v7",
    title: "Deploy in minutes",
    body: "Cloud-native on AWS, Azure, GCP or your own data center — no forklift migrations.",
  },
  {
    icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z",
    title: "Global by default",
    body: "One namespace across 56 countries with real-time visibility and control.",
  },
];

export default function FinalCta() {
  return (
    <section className="section final-cta">
      <div className="container">
        <div className="cta-inner">
          <h1 className="h1 reveal">
            Give your data
            <br />
            <span className="grad">the freedom to flow</span>
          </h1>
          <p className="lede reveal reveal-d1">
            One Platform. Any Data. Any Location. Total Control.
          </p>
          <div className="cta-btns reveal reveal-d2">
            <a href="#demo" className="btn btn-primary btn-lg glow-ring">
              Get started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#contact" className="btn btn-ghost btn-lg">
              Talk to sales
            </a>
          </div>
        </div>

        <div className="demo-wrap" id="demo">
          <div className="cta-feats reveal">
            <div>
              <p className="eyebrow" style={{ color: "var(--text-gray2)" }}>
                Why RASTAAK
              </p>
              <h2 className="h2" style={{ fontSize: "clamp(2.2rem,3vw,3.6rem)" }}>
                Built for the workloads
                <br />
                <span className="grad">that can&rsquo;t wait</span>
              </h2>
            </div>
            {FEATS.map((f, i) => (
              <div key={f.title} className="cta-feat reveal reveal-d1">
                <div className="icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <div>
                  <b>{f.title}</b>
                  <p>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal reveal-d2">
            <DemoForm />
          </div>
        </div>
      </div>
    </section>
  );
}
