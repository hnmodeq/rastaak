import UseCaseChips from "./UseCaseChips";

const CARDS = [
  {
    icon: "M4 4h16v16H4zM9 4v16M4 9h16",
    title: "هوش مصنوعی و محاسبات شتاب‌یافته",
    body: "Checkpoint, resume, and serve models at scale with high-throughput file access across thousands of GPUs — on-prem or in the cloud.",
  },
  {
    icon: "M4 6h16M4 12h16M4 18h10",
    title: "پشتیبان‌گیری",
    body: "Reclaim your backup estate with an immutable, ransomware-resistant target that keeps recovery fast, simple, and predictable.",
  },
  {
    icon: "M13 2L3 14h7l-1 8 11-13h-7l1-8z",
    title: "بارهای کاری پُربازده",
    body: "Sustained bandwidth and low latency for EDA, rendering, seismic processing, and every I/O-hungry workload you run.",
  },
  {
    icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6zM9 12l2 2 4-4",
    title: "محافظت در برابر باج‌افزار",
    body: "شناسایی بلادرنگ و هوشمند هنگام نوشتن، حمله را پیش از رمزنگاری داده متوقف می‌کند",
  },
  {
    icon: "M12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z",
    title: "نظارت تصویری",
    body: "Absorb petabytes of continuous camera feeds and search them in real time with deep file inspection and analytics.",
  },
  {
    icon: "M2 5h20v14H2zM2 10h20",
    title: "دسکتاپ مجازی",
    body: "Deliver a lag-free desktop experience for thousands of concurrent users with a storage tier built for VDI storms.",
  },
];

export default function UseCases() {
  return (
    <section className="section usecases" id="usecases">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">موارد استفاده</p>
          <h2 className="h2 reveal reveal-d1">
            مدیریت ذخیره‌سازی را متوقف کنید.
            <br />
            <span className="grad">از داده‌ها بهره بگیرید.</span>
          </h2>
          <p className="lede reveal reveal-d2" style={{ marginTop: "2.4rem" }}>
            Build a data strategy that moves as fast as your business, across
            real-world, high-impact use cases.
          </p>
        </div>

        <UseCaseChips />

        <div className="use-grid">
          {CARDS.map((c, i) => (
            <div key={c.title} className={`usecard reveal${i % 3 === 1 ? " reveal-d1" : i % 3 === 2 ? " reveal-d2" : ""}`}>
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                  <path d={c.icon} />
                </svg>
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
