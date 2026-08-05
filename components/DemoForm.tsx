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
        setStatus({ kind: "ok", message: "Thanks! We'll be in touch within one business day." });
        form.reset();
      } else {
        setStatus({
          kind: "err",
          message: json.message || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setStatus({ kind: "err", message: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="demo-card" onSubmit={onSubmit}>
      <h3>Request a demo</h3>
      <p className="sub">
        See the platform in action with your own workloads. No commitment.
      </p>

      <div className="form-field">
        <label htmlFor="df-name">Full name</label>
        <input id="df-name" name="name" className="form-input" required placeholder="Jane Doe" />
      </div>
      <div className="form-field">
        <label htmlFor="df-email">Work email</label>
        <input id="df-email" name="email" type="email" className="form-input" required placeholder="jane@company.com" />
      </div>
      <div className="form-field">
        <label htmlFor="df-company">Company</label>
        <input id="df-company" name="company" className="form-input" placeholder="Acme Inc." />
      </div>
      <div className="form-field">
        <label htmlFor="df-message">What are you trying to solve?</label>
        <textarea id="df-message" name="message" className="form-input" placeholder="Tell us about your data workloads…" />
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={sending} style={{ width: "100%" }}>
        {sending ? "Sending…" : "Request demo"}
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
        Saved to your Neon Postgres database via Prisma. If the database isn&rsquo;t
        configured yet, this endpoint returns a friendly notice instead.
      </p>
    </form>
  );
}
