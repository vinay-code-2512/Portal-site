
"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";

import {
  hiddenReveal,
  transitionRevealShort,
  viewportReveal,
  visibleReveal,
} from "@/lib/motion";

const images = [
  { src: "/new1.webp", alt: "National Education Excellence Award" },
  { src: "/new2.webp", alt: "Best Institute Recognition Certificate" },
  { src: "/new3.webp", alt: "Outstanding Contribution in Education" },
  { src: "/awards/e4.webp", alt: "Award of Excellence" },
  { src: "/awards/e8.webp", alt: "Digital Marketing Excellence Award" },
  { src: "/awards/e5.webp", alt: "Top Educator Recognition" },
  { src: "/awards/e7.webp", alt: "Outstanding Leadership Award" },
  { src: "/awards/e6.webp", alt: "Education Innovation Award" },
];

const carouselImages = [...images, ...images];

export default function AwardsGallery() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const titleId = useId();

  return (
    <section
      id="awards"
      className="relative !pt-2 section-spacing !pb-4 sm:!pb-6 lg:!pb-8 overflow-hidden"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 -z-10 bg-[#0a0b1a]" />

      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[min(90vw,800px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--neon-purple)]/5 blur-[150px] pointer-events-none" />

      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="mb-4 text-center md:mb-5">
          <h2 id={titleId} className="heading-lg mb-1 text-white">
            <span className="gradient-text">Awards</span>
          </h2>

          <p className="text-body mx-auto max-w-2xl text-gray-300">
            Swipe or tap an award to explore it in full size.
          </p>
        </div>

        <motion.div
          initial={hiddenReveal}
          whileInView={visibleReveal}
          viewport={viewportReveal}
          transition={transitionRevealShort}
        >
          <Swiper
            modules={[EffectCoverflow, Autoplay]}
            effect="coverflow"
            centeredSlides
            loop
            loopAdditionalSlides={6}
            grabCursor
            speed={1000}
            slidesPerView="auto"
            autoplay={{
              delay: 1500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}

            
            coverflowEffect={{
              rotate: 18,
              stretch: 0,
              depth: 180,
              modifier: 1.4,
              scale: 0.9,
              slideShadows: false,
            }}
            className="awards-swiper"
          >
            {carouselImages.map((img, i) => (
              <SwiperSlide
                key={`${img.src}-${i}`}
                className="!w-[280px] sm:!w-[320px] md:!w-[360px]"
              >
                <motion.button
                  type="button"
                  onClick={() => setOpenIdx(i % images.length)}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full rounded-3xl p-[2px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-blue)]"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--neon-blue)]/50 to-[var(--neon-purple)]/50 opacity-80 blur-xl transition-all duration-500 group-hover:opacity-100 group-hover:blur-2xl" />

                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#08081a]/90 shadow-[0_0_0_1px_rgba(0,240,255,0.12),0_0_32px_rgba(0,240,255,0.18)] transition-all duration-500 group-hover:border-[var(--neon-blue)]/50">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 280px, 360px"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    <div className="border-t border-white/10 px-4 py-4">
                      <h3 className="truncate text-sm font-semibold text-white">
                        {img.alt}
                      </h3>
                    </div>
                  </div>
                </motion.button>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>

      <style jsx global>{`
        .awards-swiper {
          padding: 20px 0 40px;
          overflow: visible;
        }

        .awards-swiper .swiper-slide {
          opacity: 0.45;
          filter: blur(2px);
          transition: all 0.5s ease;
        }

        .awards-swiper .swiper-slide-active {
          opacity: 1;
          filter: blur(0);
        }

        .awards-swiper .swiper-slide-active button {
          transform: scale(1.05);
        }
      `}</style>

      <AnimatePresence>
        {openIdx !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="awards-modal-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              aria-label="Close"
              onClick={() => setOpenIdx(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
              }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-[#0a0a16]/95 p-3 shadow-[0_0_60px_rgba(0,240,255,0.25),0_0_100px_rgba(181,0,255,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Close"
                onClick={() => setOpenIdx(null)}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#05050f]">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={images[openIdx].src}
                    alt={images[openIdx].alt}
                    fill
                    priority
                    className="object-contain"
                    sizes="480px"
                  />
                </div>
              </div>

              <h3
                id="awards-modal-title"
                className="mt-4 px-2 text-center text-xl font-bold text-white"
              >
                {images[openIdx].alt}
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

