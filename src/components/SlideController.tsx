/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface SlideControllerProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onSetSlide: (index: number) => void;
}

export default function SlideController({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onSetSlide,
}: SlideControllerProps) {
  return (
    <>
      {/* Bottom Slider indicators (exactly matching the picture dots layout) */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 select-none pointer-events-auto">
        {Array.from({ length: totalSlides }).map((_, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={idx}
              id={`carousel-dot-${idx}`}
              onClick={() => onSetSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                isActive
                  ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                  : 'bg-zinc-650 hover:bg-zinc-400'
              }`}
            />
          );
        })}
      </div>
    </>
  );
}
