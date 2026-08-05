const INDUSTRIES = [
  { icon: "M13 2L3 14h7l-1 8 11-13h-7l1-8z", title: "انرژی", body: "Unify distributed datasets for subsurface modeling and well optimization from the edge to the cloud.", link: "مشاهده راهکار انرژی" },
  { icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6", title: "خدمات مالی", body: "Low-latency performance and high security for risk models and fraud detection on historical data.", link: "مشاهده راهکار مالی" },
  { icon: "M12 21s-7-4.5-9-9c-1-2.5.5-6 3.5-6 2 0 3.5 1.5 5.5 4 2-2.5 3.5-4 5.5-4 3 0 4.5 3.5 3.5 6-2 4.5-9 9-9 9z", title: "سلامت", body: "Consolidate PACS and EHRs into one secure namespace for instant image access at the point of care.", link: "مشاهده راهکار سلامت" },
  { icon: "M12 3l9 4.5-9 4.5-9-4.5L12 3zM5 10.5V16c0 1.7 3 3.5 7 3.5s7-1.8 7-3.5v-5.5", title: "آموزش عالی", body: "یک زیرساخت امن برای پیوند انطباق سازمانی و نیازهای پژوهشی HPC.", link: "مشاهده راهکار آموزش" },
  { icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18zM3.5 9h17M3.5 15h17", title: "علوم زیستی", body: "Industrial-scale genomics and proteomics on a single global fabric for collaborative research.", link: "مشاهده علوم زیستی" },
  { icon: "M3 4h18v16H3zM7 4v-1M17 4v-1M3 9h18M8 14h3M8 17h5", title: "رسانه و سرگرمی", body: "خطوط تولید پس از فیلم‌برداری و همکاری جهانی روی داده‌های عظیم و باکیفیت را شتاب دهید", link: "مشاهده راهکار رسانه" },
  { icon: "M3 21h18M4 21V10l8-6 8 6v11M10 21v-6h4v6", title: "بخش عمومی", body: "بارهای کاری سازمان‌ها را با پلتفرم‌های داده شهری مقاوم و امن یکپارچه کنید", link: "مشاهده بخش عمومی" },
  { icon: "M4 8h16v12H4zM8 8V6a4 4 0 0 1 8 0v2", title: "Retail & E-commerce", body: "Handle peak-season demand spikes with elastic storage for catalogs, media, and analytics.", link: "مشاهده راهکار خرده‌فروشی" },
];

export default function صنایع() {
  return (
    <section className="section industries">
      <div className="container">
        <div className="features-head">
          <p className="eyebrow reveal">صنایع</p>
          <h2 className="h2 reveal reveal-d1">
            Designed for industries
            <br />
            <span className="grad">جایی که داده هرگز متوقف نمی‌شود</span>
          </h2>
        </div>
        <div className="ind-grid">
          {INDUSTRIES.map((ind, i) => (
            <div key={ind.title} className={`ind-card reveal reveal-d${i % 4}`}>
              <div className="icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                  <path d={ind.icon} />
                </svg>
              </div>
              <h3>{ind.title}</h3>
              <p>{ind.body}</p>
              <a href="#" className="link">
                {ind.link} &rarr;
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
