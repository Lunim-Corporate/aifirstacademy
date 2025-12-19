import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type TrustedByMarqueeProps = {
  logos?: string[];
  duration?: number; // fade/slide in duration
  delay?: number; // initial delay
  ease?: string; // gsap ease string
  slideFrom?: "bottom" | "left" | "right" | "none";
  className?: string;
  marqueeDuration?: number; // seconds for one full scroll of one set
  pauseOnHover?: boolean;
};

export default function TrustedByMarquee({
  logos = ["TechCorp", "ScaleUp", "GrowthCo", "DevWorks", "PixelLabs", "DataForge"],
  duration = 0.8,
  delay = 0,
  ease = "power3.out",
  slideFrom = "bottom",
  className,
  marqueeDuration = 24,
  pauseOnHover = true,
}: TrustedByMarqueeProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const introTlRef = useRef<gsap.core.Timeline | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const tickerAttached = useRef(false);
  const singleWidthRef = useRef(0);
  const xRef = useRef(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    // Intro fade/slide in
    const offset = slideFrom === "bottom" ? { y: 20 } : slideFrom === "left" ? { x: -20 } : slideFrom === "right" ? { x: 20 } : {};
    const intro = gsap.timeline({ defaults: { ease } });
    intro.fromTo(wrapper as any, { opacity: 0, ...(offset as any) }, { opacity: 1, x: 0, y: 0, duration, delay });
    introTlRef.current = intro;

    // Measure one set width (first half of [data-logo-item])
    const measure = () => {
      const items = Array.from(track.querySelectorAll<HTMLElement>("[data-logo-item]"));
      const half = Math.floor(items.length / 2);
      let w = 0;
      for (let i = 0; i < half; i++) w += items[i].offsetWidth + 40; // 40 ~ gap-x-10
      singleWidthRef.current = w;
      xRef.current = 0;
      gsap.set(track, { x: 0 });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);

    // Seamless ticker loop
    const speedPxPerSec = () => (singleWidthRef.current > 0 ? singleWidthRef.current / marqueeDuration : 100 / marqueeDuration);
    const tick = () => {
      const dtSeconds = gsap.ticker.deltaRatio() / 60; // seconds since last tick at 60fps baseline
      xRef.current -= speedPxPerSec() * dtSeconds;
      if (xRef.current <= -singleWidthRef.current) xRef.current += singleWidthRef.current;
      gsap.set(track, { x: xRef.current });
    };

    const attachTicker = () => {
      if (tickerAttached.current) return;
      gsap.ticker.add(tick);
      tickerAttached.current = true;
    };
    const detachTicker = () => {
      if (!tickerAttached.current) return;
      gsap.ticker.remove(tick);
      tickerAttached.current = false;
    };

    // Start immediately when in view; pause when out of view
    stRef.current = ScrollTrigger.create({ trigger: wrapper, start: "top 95%", onEnter: attachTicker, onLeave: detachTicker, onEnterBack: attachTicker, onLeaveBack: detachTicker });

    // Pause on hover (optional)
    const onEnter = () => detachTicker();
    const onLeave = () => attachTicker();
    if (pauseOnHover) {
      wrapper.addEventListener("mouseenter", onEnter);
      wrapper.addEventListener("mouseleave", onLeave);
    }

    return () => {
      detachTicker();
      introTlRef.current?.kill();
      stRef.current?.kill();
      ro.disconnect();
    };
  }, [duration, delay, ease, slideFrom, marqueeDuration, pauseOnHover]);

  const list = [...logos, ...logos];

  return (
    <section className={`py-10 border-b border-gray-200 dark:border-gray-700/40 ${className || ""}`} aria-label="Trusted by teams section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={wrapperRef} className="relative overflow-hidden text-muted-foreground">
          <div className="flex items-center gap-x-6 mb-4">
            <span className="text-xs uppercase tracking-widest shrink-0">Trusted by marketers at</span>
          </div>
          <div className="relative">
            <div
              ref={trackRef}
              className="flex items-center gap-x-10 will-change-transform"
              style={{ maskImage: "linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0, black 60px, black calc(100% - 60px), transparent 100%)" }}
            >
              {list.map((logo, idx) => (
                <span key={`${logo}-${idx}`} data-logo-item className="text-sm md:text-base font-medium opacity-70 shrink-0">
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

