"use client";

import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/images";

const LINKS = [
  { href: "#platform", label: "محصولات" },
  { href: "#usecases", label: "راهکارها" },
  { href: "#resources", label: "منابع" },
  { href: "#partners", label: "شرکا" },
  { href: "#cases", label: "شرکت" },
  { href: "#contact", label: "تماس با ما" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className={`nav${scrolled ? " scrolled" : ""}`} id="nav">
        <div className="nav-inner">
          <a href="#top" className="logo" aria-label="RASTAAK home">
            <span className="logo-chip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl("logo/rastaak-full.png")} alt="RASTAAK logo" />
            </span>
          </a>
          <div className="nav-links">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="nav-right">
            <button className="lang" type="button" aria-label="Language">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              فارسی
            </button>
            <a href="#demo" className="btn btn-primary btn-sm">
              امتحان رایگان راستاک
            </a>
            <button
              className="hamburger"
              id="burger"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu${open ? " open" : ""}`} id="mmenu">
        <div className="mmenu-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetUrl("logo/rastaak-short.png")} alt="RASTAAK" />
        </div>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href="#demo" className="btn btn-primary btn-lg" onClick={() => setOpen(false)}>
          امتحان رایگان راستاک
        </a>
      </div>
    </>
  );
}
