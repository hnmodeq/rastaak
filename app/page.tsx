import { HeroSection } from '@/components/home/HeroSection';
import { FlowSteps } from '@/components/home/FlowSteps';
import { FeaturesGrid } from '@/components/home/FeaturesGrid';
import { StandardsSection } from '@/components/home/StandardsSection';
import { FaqSection } from '@/components/home/FaqSection';
import { CtaBanner } from '@/components/home/CtaBanner';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* 3D Hero Section */}
      <HeroSection />

      {/* 4-Step Process Flow (Scroll Synchronized) */}
      <FlowSteps />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Nuclear-Grade Standards Section */}
      <StandardsSection />

      {/* FAQ Accordion */}
      <FaqSection />

      {/* Bottom CTA Banner */}
      <CtaBanner />
    </div>
  );
}
