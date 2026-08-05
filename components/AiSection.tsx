import { assetUrl } from "@/lib/images";

const POINTS = [
  "از هوش مصنوعی ابری تا تحلیل ویدیویی بلادرنگ",
  "تصویربرداری پزشکی، ژنومیک و سامانه‌های رانندگی خودران",
  "پلتفرم سازمانی برای کاربران، ماشین‌ها، دستگاه‌ها و هوش مصنوعی",
];

export default function AiSection() {
  return (
    <section className="section ai">
      <div className="container">
        <div className="ai-grid">
          <div className="ai-visual reveal">
            <div className="frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl("ai.jpg")} alt="تصویر انتزاعی شبکه عصبی هوش مصنوعی" />
            </div>
            <div className="ai-badge">
              <div>
                <div className="num">3.2x</div>
                <div className="lbl">آموزش سریع‌تر هوش مصنوعی</div>
              </div>
              <div className="sep" />
              <div>
                <div className="num">100k</div>
                <div className="lbl">ساعت GPU در هفته</div>
              </div>
              <div className="sep" />
              <div>
                <div className="num">&lt;1ms</div>
                <div className="lbl">تأخیر ثبت وضعیت</div>
              </div>
            </div>
          </div>
          <div className="ai-copy">
            <p className="eyebrow reveal">هوش مصنوعی سازمانی</p>
            <h2 className="h2 reveal reveal-d1">
              Fueling the future of <span className="grad">هوش مصنوعی سازمانی</span>
            </h2>
            <p className="lede reveal reveal-d2">
              Turn enterprise data into a foundation for AI reasoning — unifying
              files, objects, and every workload across edge, core, and cloud to
              deliver complete data freedom and control.
            </p>
            <ul className="reveal reveal-d3">
              {POINTS.map((p) => (
                <li key={p}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
            <a href="#demo" className="btn btn-primary reveal reveal-d4">
              Learn more
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
