const PARTNERS = [
  { name: "NEXORA", icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" },
  { name: "GRIDFORGE", icon: "M3 8h18v12H3zM8 4h8" },
  { name: "VELOCE", icon: "M12 2l9 5v10l-9 5-9-5V7l9-5z" },
  { name: "AEROCLOUD", icon: "M5 12a3 3 0 1 1 0-6 5 5 0 0 1 9.6-1.5A4 4 0 0 1 19 9a3 3 0 1 1 0 6H5z" },
  { name: "TESSERA", icon: "M4 4h16v16H4zM4 4l16 16M20 4L4 20" },
  { name: "STOREFLEX", icon: "M3 21V3l18 18H3z" },
  { name: "HALCYON", icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" },
  { name: "ORBITWORKS", icon: "M12 2l7 3v8l-7 3-7-3V5l7-3z" },
];

export default function شرکا() {
  return (
    <section className="section partners on-light" id="partners">
      <div className="container">
        <p className="eyebrow reveal" style={{ justifyContent: "center", display: "flex" }}>
          شرکا
        </p>
        <h2 className="h2 reveal reveal-d1">
          همراه با برترین
          <br />
          ارائه‌دهندگان فناوری جهان
        </h2>
        <p className="lede reveal reveal-d2">
          برای کار یکپارچه با پلتفرم‌های سازمانی ساخته شده؛ تجربه‌ای قابل اعتماد و یکپارچه.
        </p>
        <div className="partner-grid">
          {PARTNERS.map((p, i) => (
            <div key={p.name} className={`partner-tile reveal reveal-d${i % 4}`}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d={p.icon} />
              </svg>
              {p.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
