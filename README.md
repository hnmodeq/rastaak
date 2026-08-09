# Rastaak — Next.js App Router Edition

A pixel-perfect, modular, and component-driven clone of [Rastaak](https://www.rastaak.com/), built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Three.js (WebGL + Draco WASM)**, and **Framer Motion**.

---

## 🌟 Highlights & Architecture

- **Next.js App Router**: Full App Router structure with React Server Components & Client Components.
- **3D WebGL / Three.js Hero Scene**:
  - Interactive dark-mode blueprint of the nuclear power generation facility.
  - Decompressed with Google Draco WebAssembly decoders (`draco_decoder.wasm`).
  - Animated industrial turbines, rigged craft workers, and dynamic camera scroll interpolation.
  - Client-side isolated with dynamic hydration to prevent SSR mismatch.
- **Design Token System (`tokens/design-tokens.ts`)**:
  - Centralized tokens for Colors, Typography, Border Radii, Spacing, Transitions, and Shadows.
  - Deeply integrated into Tailwind CSS and CSS Custom Properties.
- **Componentized & Modular**:
  - `components/layout/`: Header, MobileNav, Footer, NavigationContext.
  - `components/canvas/`: HeroCanvas3D, HeroCanvasWrapper, LoaderOverlay.
  - `components/home/`: HeroSection, FlowSteps, FeaturesGrid, StandardsSection, FaqSection, CtaBanner.
  - `components/industries/`: IndustryCard (Sticky stack).
  - `components/mission/`: MissionAccordion.
  - `components/forms/`: RequestCrewForm, ApplyModal (Multi-step application).
  - `components/ui/`: Logo, PillButton.
- **API Route Handlers (`app/api/`)**:
  - `POST /api/request-crew`: Outage mobilization dispatch requests.
  - `POST /api/apply`: Multi-part career application submissions.

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 📁 Directory Structure

```text
├── app/
│   ├── layout.tsx                # Root layout with 3D canvas, Header, Footer & Modals
│   ├── page.tsx                  # Home route (Hero, 4-step Flow, Features, FAQ, CTA)
│   ├── globals.css               # Design tokens & core styles
│   ├── apply/page.tsx            # Career application & features
│   ├── industries/page.tsx       # Industries sticky stack showcase
│   ├── our-mission/page.tsx      # Mission, Middleman model & Outcomes
│   ├── request-crew/page.tsx     # 24/7 Outage mobilization form
│   ├── privacy/page.tsx          # Privacy Policy
│   ├── privacy-request/page.tsx  # CCPA/CPRA Request
│   ├── terms/page.tsx            # Terms of Service
│   └── api/
│       ├── apply/route.ts        # Next.js Route Handler for applications
│       └── request-crew/route.ts # Next.js Route Handler for crew requests
├── components/
│   ├── canvas/                   # 3D Three.js scene & loaders
│   ├── forms/                    # RequestCrewForm & ApplyModal
│   ├── home/                     # Home page section modules
│   ├── industries/               # Industry cards
│   ├── layout/                   # Header, MobileNav, Footer, NavigationContext
│   ├── mission/                  # Mission accordion
│   └── ui/                       # Logo, PillButton primitives
├── tokens/
│   └── design-tokens.ts          # Centralized Design Tokens
├── public/                       # 3D GLB models, Draco decoders, icons & media
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── next.config.mjs
```
