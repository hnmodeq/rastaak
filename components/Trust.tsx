const BRANDS = [
  { name: "NEXORA", icon: "M12 12a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" },
  { name: "STOREFLEX", icon: "M3 21V3l18 18H3z" },
  { name: "VELOCE", icon: "M12 2l9 5v10l-9 5-9-5V7l9-5z" },
  { name: "HALCYON", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
  { name: "ORBITWORKS", icon: "M12 2l7 3v8l-7 3-7-3V5l7-3z" },
  { name: "GRIDFORGE", icon: "M3 8h18v12H3zM8 4h8" },
  { name: "TESSERA", icon: "M4 4h16v16H4zM4 4l16 16M20 4L4 20" },
  { name: "AEROCLOUD", icon: "M5 12a3 3 0 1 1 0-6 5 5 0 0 1 9.6-1.5A4 4 0 0 1 19 9a3 3 0 1 1 0 6H5z" },
];

export default function Trust() {
  const track = [...BRANDS, ...BRANDS]; // duplicated for seamless loop
  return (
    <section className="trust">
      <div className="container">
        <h4 className="reveal">Trusted by over 1,100 enterprise companies globally</h4>
        <div className="marquee reveal reveal-d1">
          <div className="marquee-track">
            {track.map((b, i) => (
              <span className="wordmark" key={`${b.name}-${i}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d={b.icon} />
                </svg>
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
