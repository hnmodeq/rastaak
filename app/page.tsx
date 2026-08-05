import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Trust from "@/components/Trust";
import Features from "@/components/Features";
import AiSection from "@/components/AiSection";
import Platform from "@/components/Platform";
import UseCases from "@/components/UseCases";
import CaseStudies from "@/components/CaseStudies";
import Industries from "@/components/Industries";
import Partners from "@/components/Partners";
import Support from "@/components/Support";
import Stats from "@/components/Stats";
import Resources from "@/components/Resources";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import SiteEffects from "@/components/SiteEffects";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Trust />
        <Features />
        <AiSection />
        <Platform />
        <UseCases />
        <CaseStudies />
        <Industries />
        <Partners />
        <Support />
        <Stats />
        <Resources />
        <FinalCta />
      </main>
      <Footer />
      <SiteEffects />
    </>
  );
}
