const STATS = [
  { target: 7, suffix: "EB", label: "ظرفیت ارائه‌شده" },
  { target: 56, suffix: "", label: "کشورها" },
  { target: 95, suffix: "", label: "امتیاز رضایت مشتری" },
];

export default function Stats() {
  return (
    <section className="section stats on-light">
      <div className="container">
        <div className="stats-head">
          <p className="eyebrow reveal" style={{ justifyContent: "center", display: "flex" }}>
            اثبات‌شده در مقیاس جهانی
          </p>
          <h2 className="h2 reveal reveal-d1">
            پشتیبانیing thousands of data-intensive
            <br />
            teams worldwide
          </h2>
        </div>
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={s.label} className={`stat-card reveal${i === 1 ? " reveal-d1" : i === 2 ? " reveal-d2" : ""}`}>
              <div className="num">
                <span className="count" data-target={s.target} data-suffix={s.suffix}>
                  0
                </span>
              </div>
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
