import { assetUrl } from "@/lib/images";

const COLUMNS = [
  {
    title: "محصول",
    links: ["پلتفرم", "قیمت‌گذاری", "امتحان رایگان", "تازه‌ها", "امنیت"],
  },
  {
    title: "راهکارها",
    links: ["هوش مصنوعی و یادگیری ماشین", "پشتیبان‌گیری و بازیابی", "عملکرد بالا", "نظارت تصویری", "دسکتاپ مجازی"],
  },
  {
    title: "منابع",
    links: ["مستندات", "وبلاگ", "مطالعات موردی", "رویدادها و وبینارها", "مرجع API"],
  },
  {
    title: "شرکت",
    links: ["درباره ما", "فرصت‌های شغلی", "رسانه", "تماس با ما", "شرکا"],
  },
];

const SOCIALS = [
  {
    label: "X",
    icon: "M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1.6 2H8l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.7H5.3L17.8 20z",
  },
  {
    label: "LinkedIn",
    icon: "M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.5 8.2h4.9V24H.5zM8.4 8.2h4.7v2.2h.1c.7-1.2 2.3-2.5 4.8-2.5 5.1 0 6 3.4 6 7.8V24h-4.9v-7.3c0-1.7 0-4-2.4-4s-2.8 1.9-2.8 3.9V24H8.4z",
  },
  {
    label: "GitHub",
    icon: "M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.3 4.9 18.3 5.2 18.3 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z",
  },
  {
    label: "YouTube",
    icon: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z",
  },
];

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#top" className="logo" aria-label="RASTAAK home">
              <span className="logo-chip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl("logo/rastaak-full.png")} alt="RASTAAK logo" />
              </span>
            </a>
            <p>
              داده‌ها را در هر مکان و هر مقیاسی ساده مدیریت کنید؛ پلتفرمی یکپارچه در دیتاسنتر، لبه و ابر.
            </p>
            <div className="footer-social">
              {SOCIALS.map((s) => (
                <a key={s.label} href="#" aria-label={s.label}>
                  <svg viewBox="0 0 24 24">
                    <path d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="footer-col">
              <h5>{col.title}</h5>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} RASTAAK, Inc. All rights reserved.</p>
          <div className="legal">
            <a href="#">حریم خصوصی</a>
            <a href="#">قوانین</a>
            <a href="#">کوکی‌ها</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
