import { assetUrl } from "@/lib/images";

const FEATS = ["SMB, NFS, S3 & more", "فضای نام جهانی", "تحلیل بلادرنگ", "ارتقا بدون قطعی"];

export default function پلتفرم() {
  return (
    <section className="section platform on-light" id="platform">
      <div className="container">
        <div className="platform-grid">
          <div className="platform-copy">
            <p className="eyebrow reveal">پلتفرم</p>
            <h2 className="h2 reveal reveal-d1">
              یک فایل‌سیستم.
              <br />
              هر محیط.
              <br />
              <span className="grad">مقیاس بی‌نهایت.</span>
            </h2>
            <p className="lede reveal reveal-d2">
              یک پلتفرم چندپروتکلی برای زیرساخت داخلی، لبه و ابر؛ بدون سربار کپی، وابستگی به فروشنده یا افت عملکرد. زیرساخت ذخیره‌سازی خود را یکپارچه و جزیره‌های داده را حذف کنید.
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
              مشاهده معرفی راهکار
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16" />
              </svg>
            </a>
          </div>
          <div className="platform-visual reveal reveal-d2">
            <div className="frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl("platform.jpg")} alt="شبکه جهانی داده برای اتصال همه مکان‌ها" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
