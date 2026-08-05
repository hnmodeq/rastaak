import { assetUrl } from "@/lib/images";

const FEATS = ["SMB, NFS, S3 & more", "Global namespace", "Real-time analytics", "Zero-downtime upgrades"];

export default function Platform() {
  return (
    <section className="section platform on-light" id="platform">
      <div className="container">
        <div className="platform-grid">
          <div className="platform-copy">
            <p className="eyebrow reveal">The platform</p>
            <h2 className="h2 reveal reveal-d1">
              One file system.
              <br />
              Every environment.
              <br />
              <span className="grad">Infinite scale.</span>
            </h2>
            <p className="lede reveal reveal-d2">
              A single, multi-protocol platform that spans on-premises, edge, and
              cloud infrastructure — without replication overhead, vendor lock-in,
              or performance trade-offs. Consolidate your storage stack and
              eliminate data silos.
            </p>
            <ul className="platform-feats reveal reveal-d3">
              {FEATS.map((f) => (
                <li key={f}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <a href="#" className="btn btn-grad reveal reveal-d4">
              View solution brief
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16" />
              </svg>
            </a>
          </div>
          <div className="platform-visual reveal reveal-d2">
            <div className="frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl("platform.jpg")} alt="Global data network connecting locations worldwide" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
