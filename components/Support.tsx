const ITEMS = ["پشتیبانی واقعی ۲۴/۷", "بدون صف تیکت", "پاسخ‌گویی کمتر از ۱۵ دقیقه"];

export default function پشتیبانی() {
  return (
    <section className="section support">
      <div className="container">
        <div className="support-inner">
          <p className="eyebrow reveal" style={{ justifyContent: "center", display: "flex" }}>
            پشتیبانی
          </p>
          <h2 className="h2 reveal reveal-d1">
            یک پلتفرم؛ یک شریک.
            <br />
            <span className="grad">متخصصان همیشه آماده‌اند.</span>
          </h2>
          <p className="lede reveal reveal-d2">
            بدون صف تیکت؛ پشتیبانی ۲۴/۷ از مهندسانی که دسترسی توزیع‌شده به داده، ابر و محاسبات لبه را می‌شناسند. انسان‌های واقعی، پاسخ‌های واقعی.
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
            گفت‌وگو با متخصص
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
