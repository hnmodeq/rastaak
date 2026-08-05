const RESOURCES = [
  {
    tag: "اخبار",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M9 13h6M9 17h4",
    title: "راستاک NeuralShield را برای شناسایی بلادرنگ باج‌افزار معرفی می‌کند",
    body: "بازرسی عمیق فایل هنگام نوشتن، حمله را پیش از رمزنگاری داده متوقف می‌کند",
    link: "بیشتر بخوانید",
    orange: false,
  },
  {
    tag: "وبینار",
    icon: "M2 5h20v14H2zM10 9l5 3-5 3z",
    title: "تماشای درخواستی: حذف فاصله میان شناسایی و بازیابی باج‌افزار",
    body: "چگونه شناسایی هوشمند و سوییچ خودکار حملات را از مبدأ متوقف می‌کنند",
    link: "تماشا کنید",
    orange: true,
  },
  {
    tag: "وبلاگ",
    icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2",
    title: "چرا چالش سخت‌افزار فرصتی برای ذخیره‌سازی است",
    body: "راهکاری بومی ابر برای بحران زنجیره تأمین سخت‌افزار سازمانی.",
    link: "بیشتر بخوانید",
    orange: false,
  },
];

export default function منابع() {
  return (
    <section className="section resources" id="resources">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">منابع</p>
          <h2 className="h2 reveal reveal-d1">
            آخرین مطالب <span className="grad">RASTAAK</span>
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
