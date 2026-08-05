const RESOURCES = [
  {
    tag: "Press Release",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M9 13h6M9 17h4",
    title: "RASTAAK launches NeuralShield&trade; to deliver real-time AI-driven ransomware detection",
    body: "Deep file inspection at the point of write stops attacks before data is encrypted.",
    link: "Read more",
    orange: false,
  },
  {
    tag: "Webinar",
    icon: "M2 5h20v14H2zM10 9l5 3-5 3z",
    title: "On-demand: eliminating the gap between ransomware detection and recovery",
    body: "How AI-driven detection and smart switching stop attacks at the source.",
    link: "Watch now",
    orange: true,
  },
  {
    tag: "Blog",
    icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2",
    title: "Why the hardware crunch is really a storage opportunity",
    body: "Cloud-native relief for the enterprise hardware supply chain crisis.",
    link: "Read more",
    orange: false,
  },
];

export default function Resources() {
  return (
    <section className="section resources" id="resources">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">Resources</p>
          <h2 className="h2 reveal reveal-d1">
            Latest from <span className="grad">RASTAAK</span>
          </h2>
        </div>
        <div className="res-grid">
          {RESOURCES.map((r, i) => (
            <a key={r.title} href="#" className={`res-card reveal reveal-d${i}`}>
              <span className={`rtag${r.orange ? " orange" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "1.6rem", height: "1.6rem" }}>
                  <path d={r.icon} />
                </svg>
                {r.tag}
              </span>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
              <span className="link">{r.link} &rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
