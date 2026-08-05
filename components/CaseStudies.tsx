import { assetUrl } from "@/lib/images";

const CASES = [
  {
    img: "case-vfx.jpg",
    brand: "BlurLine Studio",
    mark: "BL",
    stat: "500+",
    statLabel: "rendering systems kept online with zero downtime",
    quote:
      "RASTAAK's support is the best I've experienced in the industry — responsive, collaborative, and genuinely invested in keeping our pipelines running, even on the unconventional stuff.",
    person: "Alex Rivera",
    role: "Studio Director, BlurLine",
  },
  {
    img: "case-research.jpg",
    brand: "Institute for Cancer Care",
    mark: "IC",
    stat: "250TB+",
    statLabel: "of imaging & genomics data — and growing rapidly",
    quote:
      "We now have a solution that is scalable, secure, flexible, and will grow with us as our researchers continue to innovate.",
    person: "Dr. Maya Chen",
    role: "Research Director",
  },
  {
    img: "case-auto.jpg",
    brand: "StratDrive",
    mark: "SD",
    stat: "2PB",
    statLabel: "of sensor data across two clusters",
    quote:
      "RASTAAK delivered immediate results — stable performance, simplified operations, and the ability to monitor and analyze data in real time. It was a game-changer.",
    person: "Insu Park",
    role: "CTO, StratDrive",
  },
  {
    img: "case-city.jpg",
    brand: "Metro Real-Time Crime Center",
    mark: "RC",
    stat: "1,000+",
    statLabel: "public safety cameras streaming petabytes of video",
    quote:
      "Whether it's 20 minutes to find a lost child or 90 seconds to get an ambulance to a cardiac patient — we are here when seconds count.",
    person: "Jordan Blake",
    role: "Program Director",
  },
];

export default function CaseStudies() {
  return (
    <section className="section cases" id="cases">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">داستان مشتریان</p>
          <h2 className="h2 reveal reveal-d1">
            Real teams. Real results,
            <br />
            <span className="grad">با راستاک.</span>
          </h2>
        </div>
        <div className="case-grid">
          {CASES.map((c, i) => (
            <article key={c.brand} className={`case-card reveal${i % 2 === 1 ? " reveal-d1" : ""}`}>
              <div className="case-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(c.img)} alt={c.brand} />
                <div className="case-brand">
                  <span className="bmark">{c.mark}</span>
                  {c.brand}
                </div>
              </div>
              <div className="case-body">
                <p className="case-stat">
                  {c.stat}
                  <small>{c.statLabel}</small>
                </p>
                <p className="case-quote">&ldquo;{c.quote}&rdquo;</p>
                <div className="case-person">
                  <span className="avatar">
                    {c.person.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <div>
                    <b>{c.person}</b>
                    <small>{c.role}</small>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
