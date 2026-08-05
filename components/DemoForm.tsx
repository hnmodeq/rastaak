"use client";

import { useState, type FormEvent } from "react";

type Status = { kind: "ok" | "err"; message: string } | null;

export default function DemoForm() {
  const [status, setStatus] = useState<Status>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          message: data.get("message"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ kind: "ok", message: "سپاسگزاریم! حداکثر تا یک روز کاری با شما تماس می‌گیریم." });
        form.reset();
      } else {
        setStatus({
          kind: "err",
          message: json.message || "خطایی رخ داد. دوباره تلاش کنید.",
        });
      }
    } catch {
      setStatus({ kind: "err", message: "خطای شبکه. دوباره تلاش کنید." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="demo-card" onSubmit={onSubmit}>
      <h3>درخواست دموی محصول</h3>
      <p className="sub">
        پلتفرم را با بارهای کاری خود ببینید؛ بدون تعهد.
      </p>

      <div className="form-field">
        <label htmlFor="df-name">نام و نام خانوادگی</label>
        <input id="df-name" name="name" className="form-input" required placeholder="نام شما" />
      </div>
      <div className="form-field">
        <label htmlFor="df-email">ایمیل کاری</label>
        <input id="df-email" name="email" type="email" className="form-input" required placeholder="jane@company.com" />
      </div>
      <div className="form-field">
        <label htmlFor="df-company">شرکت</label>
        <input id="df-company" name="company" className="form-input" placeholder="نام شرکت" />
      </div>
      <div className="form-field">
        <label htmlFor="df-message">چه مسئله‌ای را می‌خواهید حل کنید؟</label>
        <textarea id="df-message" name="message" className="form-input" placeholder="درباره بارهای کاری داده خود بنویسید…" />
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={sending} style={{ width: "100%" }}>
        {sending ? "در حال ارسال…" : "درخواست دمو"}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      {status && (
        <div className={`form-status show ${status.kind}`} role="status">
          {status.message}
        </div>
      )}
      <p className="form-note">
        اطلاعات از طریق Prisma در پایگاه داده Neon ذخیره می‌شود.
      </p>
    </form>
  );
}
