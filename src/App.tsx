/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Slide } from './types';
import ParticleBackground from './components/ParticleBackground';
import VideoBackground from './components/VideoBackground';
import Header from './components/Header';
import SlideController from './components/SlideController';
import ContentModal from './components/ContentModal';

export default function App() {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [activeModal, setActiveModal] = useState<'about' | 'contacts' | 'join' | null>(null);

  // Fictional custom high-concept interactive slides array
  const slides: Slide[] = [
    {
      id: 1,
      title: 'EDUCATION',
      subtitle: 'More reach More trust More income',
      blobType: 'clay',
      accentColor: '#3f3f46',
      buttonText: 'JOIN US',
    },
    {
      id: 2,
      title: 'CHROME',
      subtitle: 'LIQUID REFLECTIVE MERCURY',
      blobType: 'chrome',
      accentColor: '#71717a',
      buttonText: 'EXPLORE METALLICS',
    },
    {
      id: 3,
      title: 'ENERGY',
      subtitle: 'STELLAR ELECTROMAGNETIC FIELD',
      blobType: 'energy',
      accentColor: '#38bdf8',
      buttonText: 'MONITOR EMISSION',
    },
    {
      id: 4,
      title: 'PEARL',
      subtitle: 'MINIMAL SATIN MATTE SPHERE',
      blobType: 'pearl',
      accentColor: '#e4e4e7',
      buttonText: 'OBSERVE FORM',
    }
  ];

  const handleNext = () => {
    setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlideIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentSlideIdx];

  return (
    <main
      id="root-viewport-canvas"
      className="w-screen h-screen overflow-hidden relative flex flex-col justify-between bg-[#020305] text-white font-sans antialiased select-none"
    >
      {/* 1. Cinematic dynamic background video */}
      <VideoBackground />

      {/* 2. Starry dust dynamic particles overlay environment */}
      <ParticleBackground />

      {/* 2. Top layout bar: brand emblem and navigation links */}
      <Header onMenuClick={(type) => setActiveModal(type)} />

      {/* 3. Center Screen: Foreground typography with layered details */}
      <section
        id="hero-scene-stage"
        className="flex-1 w-full flex flex-col items-center justify-center relative px-4"
      >
        {/* Layer 2: Center Interactive Content (Centered overlay text matching layout precisely) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIdx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center text-center z-20 pointer-events-none select-none max-w-4xl"
          >
            {/* Title heading with extremely wide tracking */}
            <h1
              id="hero-main-title"
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[0.25em] sm:tracking-[0.3em] md:tracking-[0.38em] text-white leading-none pl-[0.25em] select-none text-center font-sans drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            >
              {currentSlide.title}
            </h1>

            {/* Subtle Horizontal Divider line below TITLE (As represented in picture) */}
            <hr
              id="title-underline-separator"
              className="w-24 md:w-36 border-t border-zinc-500/60 mt-4 md:mt-6 mb-3 md:mb-5 opacity-80"
            />

            {/* Subtitle with tracked-widest monospace typeface */}
            <p
              id="hero-main-subtitle"
              className="text-[10px] md:text-xs font-mono tracking-super-widest text-zinc-300 uppercase leading-relaxed max-w-lg px-2"
            >
              {currentSlide.subtitle}
            </p>

            {/* Pill "JOIN US" interactive Button styled like the Liquid Glass Kit mockup */}
            <div className="mt-8 md:mt-10 pointer-events-auto">
              <button
                id="cta-enroll-button"
                onClick={() => setActiveModal(currentSlide.blobType === 'clay' ? 'join' : 'contacts')}
                className="btn-liquid-base btn-liquid-glass px-10 py-3.5 text-xs sm:text-sm tracking-widest shadow-lg"
              >
                {currentSlide.buttonText}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* 4. Carousel interface triggers (arrows on sides and indicators on bottom center) */}
      <SlideController
        currentSlide={currentSlideIdx}
        totalSlides={slides.length}
        onPrev={handlePrev}
        onNext={handleNext}
        onSetSlide={(index) => setCurrentSlideIdx(index)}
      />

      {/* 5. Minimalist Ambient Footer Info (Keeping with strict Anti-AI-Slop guidance, very clean, no logs) */}
      <footer
        id="minimal-page-footer"
        className="w-full px-6 py-4 md:px-12 flex justify-between items-center text-[10px] text-zinc-600 font-mono select-none z-30"
      >
        <div>
          DESIGN © {new Date().getFullYear()} STUDIO.
        </div>
        <div>
          TOUCH INTERACTION ACTIVE.
        </div>
      </footer>

      {/* 6. High-end Frosted Overlay Content Modal */}
      <ContentModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        type={activeModal || 'about'}
      />
    </main>
  );
}
