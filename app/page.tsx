import { HomeContent } from '@/components/home/HomeContent';
import { HeroSceneBoot } from '@/components/canvas/HeroSceneBoot';
import { HeroCanvasWrapper } from '@/components/canvas/HeroCanvasWrapper';

export default function HomePage() {
  return (
    <>
      {/* Must render before HomeContent so a <canvas> exists in the first
          paint — that suppresses the legacy nuclear-facility WebGL scene
          while leaving the rest of the legacy bundle untouched. */}
      <HeroSceneBoot />
      <HeroCanvasWrapper />
      <HomeContent />
    </>
  );
}
