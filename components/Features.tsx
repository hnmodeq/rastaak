const FEATURES = [
  {
    icon: "M12 20a8 8 0 1 1 8-8M12 12l5-3",
    title: "ظرفیت و عملکرد انعطاف‌پذیر",
    body: "ظرفیت نامحدود برای بزرگ‌ترین داده‌ها و عملکرد پایدار برای سخت‌ترین بارها؛ در یک پلتفرم مقیاس‌پذیر.",
  },
  {
    icon: "M13 2L3 14h7l-1 8 11-13h-7l1-8z",
    title: "دسترسی فوری؛ بدون تأخیر.",
    body: "یک فضای نام جهانی و قابل مشاهده برای کاربران و بارهای کاری؛ بدون کپی، تأخیر همگام‌سازی یا انتظار.",
  },
  {
    icon: "M3 3v18h18M7 14l4-6 4 4 6-8",
    title: "کنترل قابل پیش‌بینی هزینه",
    body: "با تغییر بارهای کاری، ظرفیت و عملکرد را کم‌وزیاد کنید و فقط برای نیاز واقعی هزینه بپردازید.",
  },
  {
    icon: "M12 3l9 5v8l-9 5-9-5V8l9-5zM12 12l9-4M12 12L3 8M12 12v9",
    title: "کنترل یکپارچه همه داده‌ها",
    body: "تمام دارایی داده خود را از یک پلتفرم کنترل کنید؛ با دید و حاکمیت لحظه‌ای در همه‌جا.",
  },
  {
    icon: "M9 8a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zM17 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 15c2.8.3 5 2 5 5",
    title: "همکاری جهانی واقعی",
    body: "تیم‌های سراسر جهان را قادر کنید هم‌زمان روی داده‌های عظیم مشترک کار کنند.",
  },
  {
    icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4zM9 12l2 2 4-4",
    title: "حاکمیت متمرکز داده",
    body: "تمام داده‌های فایل را با سیاست‌های یکسان، پایش، مدیریت و ایمن کنید.",
  },
];

export default function Features() {
  return (
    <section className="section features">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">چرا راستاک</p>
          <h2 className="h2 reveal reveal-d1">
            مقیاس بدون محدودیت.
            <br />
            <span className="grad">بدون مصالحه، عملکرد داشته باشید.</span>
          </h2>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`fcard reveal${i % 3 === 1 ? " reveal-d1" : i % 3 === 2 ? " reveal-d2" : ""}`}>
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                  {f.title === "ظرفیت و عملکرد انعطاف‌پذیر" && <circle cx="12" cy="12" r="9" />}
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
