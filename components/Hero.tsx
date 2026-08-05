"use client";

import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/images";

const SLIDES = ["hero.jpg", "hero-slide-2.jpg", "hero-slide-3.jpg"];
const AUTOPLAY_MS = 6500;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      stop();
      timer = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), AUTOPLAY_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    // drag to switch
    let dragStartX: number | null = null;
    let moved = 0;
    const onPointerDown = (e: PointerEvent) => {
      dragStartX = e.clientX;
      moved = 0;
      slider.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragStartX !== null) moved = e.clientX - dragStartX;
    };
    const endDrag = () => {
      if (dragStartX === null) return;
      dragStartX = null;
      if (moved < -40) setCurrent((c) => (c + 1) % SLIDES.length);
      else if (moved > 40) setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
      start();
    };

    slider.addEventListener("pointerdown", onPointerDown);
    slider.addEventListener("pointermove", onPointerMove);
    slider.addEventListener("pointerup", endDrag);
    slider.addEventListener("pointercancel", endDrag);
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);

    start();

    return () => {
      stop();
      slider.removeEventListener("pointerdown", onPointerDown);
      slider.removeEventListener("pointermove", onPointerMove);
      slider.removeEventListener("pointerup", endDrag);
      slider.removeEventListener("pointercancel", endDrag);
      slider.removeEventListener("mouseenter", stop);
      slider.removeEventListener("mouseleave", start);
    };
  }, []);

  return (
    <header className="hero" id="top">
      {/* drifting gradient orbs */}
      <div className="orb orb-b orb-a" style={{ width: "64rem", height: "64rem", top: "-24rem", left: "-16rem" }} aria-hidden="true" />
      <div className="orb orb-c orb-b" style={{ width: "52rem", height: "52rem", bottom: "-14rem", right: "-12rem" }} aria-hidden="true" />
      <div className="orb orb-o orb-c" style={{ width: "44rem", height: "44rem", top: "38%", left: "38%" }} aria-hidden="true" />

      {/* hero image slider */}
      <div className="hero-slider" ref={sliderRef} aria-label="Featured imagery">
        {SLIDES.map((src, i) => (
          <div key={src} className={`hero-slide${i === current ? " active" : ""}`}>
            <div className="slide-img" style={{ backgroundImage: `url(${assetUrl(src)})` }} />
          </div>
        ))}
      </div>
      <div className="hero-dots" role="tablist" aria-label="Slides">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={i === current ? "active" : ""}
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === current}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>

      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow reveal">The data platform for the AI era</p>
            <h1 className="h1 reveal reveal-d1">
              Every Byte.
              <br />
              <span className="grad">Every Workload.</span>
              <br />
              One Platform.
            </h1>
            <p className="hero-sub reveal reveal-d2">
              A unified global file platform built for the most demanding
              enterprise workloads — across data centers, edge, and cloud. Move
              faster, scale further, and work without limits.
            </p>
            <div className="hero-cta reveal reveal-d3">
              <a href="#demo" className="btn btn-primary btn-lg">
                Try RASTAAK
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a href="#contact" className="btn btn-ghost btn-lg">
                Talk to sales
              </a>
            </div>
            <div className="hero-meta reveal reveal-d4">
              <span className="item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
                </svg>
                SOC 2 Type II
              </span>
              <span className="item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
                99.99% uptime SLA
              </span>
              <span className="item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
                </svg>
                56 countries
              </span>
            </div>
          </div>

          <div className="hero-visual reveal reveal-d2">
            <div className="frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl("hero.jpg")} alt="Modern data center with blue and orange lighting" />
            </div>
            <div className="float-card fc1">
              <span className="dot" />
              <div>
                <b>12 PB</b>
                <small>single namespace, live</small>
              </div>
            </div>
            <div className="float-card fc2">
              <span className="dot blue" />
              <div>
                <b>1.2M IOPS</b>
                <small>mixed workloads</small>
              </div>
            </div>
          </div>
        </div>

        <div className="press-row">
          <a href="#" className="press-card reveal reveal-d3">
            <span className="tag">Press Release</span>
            <div>
              <b>RASTAAK and NorthGrid deliver a cloud-bridge architecture that bypasses the hardware crunch</b>
              <span>Industry-first architecture to eliminate the 4x &ldquo;flash tax&rdquo; on enterprise storage.</span>
            </div>
          </a>
          <a href="#" className="press-card reveal reveal-d4">
            <span className="tag">Press Release</span>
            <div>
              <b>RASTAAK announces NeuralShield&trade; and an ISV partnership with DataSphere</b>
              <span>AI-driven ransomware detection and native integration for the modern data stack.</span>
            </div>
          </a>
        </div>
      </div>
    </header>
  );
}
