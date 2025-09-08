import { useLocation } from "react-router-dom";
import { useLayoutEffect, useRef, useEffect } from "react";
import { Home, Sparkles } from "lucide-react";
import gsap from "gsap";

function Book404({ path }: { path: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rightPagesRef = useRef<HTMLDivElement[]>([]);
  const finalPageRef = useRef<HTMLDivElement | null>(null);
  const finalPageShadeRef = useRef<HTMLDivElement | null>(null);
  const revealPageRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      tlRef.current = tl;

      // initial state
      gsap.set(rightPagesRef.current, {
        transformOrigin: "left center",
        rotateY: 0,
        zIndex: (i) => 10 - i,
        backfaceVisibility: "hidden",
      });
      gsap.set(finalPageRef.current, { transformOrigin: "left center", rotateY: 0, zIndex: 20 });
      gsap.set(revealPageRef.current, { opacity: 0, y: 8 });
      gsap.set(finalPageShadeRef.current, { opacity: 0 });

      // small delay before flipping starts
      tl.to({}, { duration: 1.0 });

      // Flip 2-3 pages (we render 3)
      rightPagesRef.current.forEach((page, i) => {
        const shade = page.querySelector<HTMLElement>(".page-shade");
        tl.to(shade, { opacity: 0.35, duration: 0.4 }, "<");
        tl.to(page, { rotateY: -178, duration: 1.6, ease: "power3.inOut" }, "<");
        tl.to(shade, { opacity: 0.0, duration: 0.4 }, ">-0.25");
        // slight pause between flips
        if (i < rightPagesRef.current.length - 1) tl.to({}, { duration: 0.2 });
      });

      // Brief pause before tearing
      tl.to({}, { duration: 1.0 });

      // Subtle shade on the final page before tear
      tl.to(finalPageShadeRef.current, { opacity: 0.25, duration: 0.4 }, "<");

      // Tear indicator: animate a jagged mask width quickly
      const tearMask = finalPageRef.current?.querySelector<HTMLElement>(".tear-mask");
      if (tearMask) tl.fromTo(tearMask, { scaleX: 0 }, { scaleX: 1, transformOrigin: "right center", duration: 0.25, ease: "power1.out" }, "<");

      // Fly-off animation (page tears away)
      tl.to(finalPageRef.current, {
        x: 240,
        y: -140,
        rotate: -18,
        rotateY: -12,
        opacity: 0,
        filter: "blur(2px)",
        duration: 1.0,
        ease: "power2.out",
      }, ">-0.05");

      // Reveal underlying page
      tl.to(revealPageRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, ">-0.3");
      tl.to(finalPageShadeRef.current, { opacity: 0, duration: 0.2 }, "<");
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // helper to register right page refs
  const setRightPageRef = (el: HTMLDivElement | null, idx: number) => {
    if (!el) return;
    rightPagesRef.current[idx] = el;
  };

  const pageColor = "#faf7f2";

  return (
    <div ref={rootRef} className="relative mx-auto w-[320px] h-[220px] sm:w-[420px] sm:h-[280px] lg:w-[520px] lg:h-[340px]" style={{ perspective: 1200 }} aria-hidden>
      {/* table shadow */}
      <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(100% 100% at 50% 30%, rgba(0,0,0,0.08), rgba(0,0,0,0) 60%)" }} />

      {/* Book body */}
      <div className="relative h-full w-full rounded-xl shadow-2xl" style={{ transformStyle: "preserve-3d", background: "linear-gradient(135deg,#2a2a2a,#3a3a3a)" }}>
        {/* Spine and cover embellishment */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-white/5" />
        <div className="absolute left-0 top-0 h-full w-2 rounded-l-xl bg-white/10" />
        <div className="absolute inset-4 rounded-lg border border-white/10" />

        {/* Left static page with persistent 404 */}
        <div className="absolute inset-y-3 left-1/2 right-3 rounded-r-xl border border-zinc-200 shadow-sm grid place-items-center p-6 text-center" style={{ background: pageColor, transform: "translateZ(3px) translateX(-100%)", boxShadow: "inset -10px 0 20px rgba(0,0,0,0.06)" }}>
          <div>
            <div className="text-5xl font-serif font-extrabold tracking-tight">404</div>
            <div className="mt-1 text-xs text-muted-foreground">Page Not Found</div>
          </div>
        </div>

        {/* Right static base */}
        <div className="absolute inset-y-3 left-1/2 right-3 rounded-r-xl border border-zinc-200" style={{ background: pageColor, transform: "translateZ(0px)", boxShadow: "inset 10px 0 20px rgba(0,0,0,0.06)" }} />

        {/* Flipping pages (topmost first) */}
        {[0,1,2].map((i) => (
          <div key={i} ref={(el) => setRightPageRef(el, i)} className="absolute inset-y-3 left-1/2 right-3 rounded-r-xl border border-zinc-200 will-change-transform" style={{ background: pageColor, transformOrigin: "left center", transformStyle: "preserve-3d" }}>
            <div className="page-shade pointer-events-none absolute inset-0 rounded-r-xl" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0) 35%)", opacity: 0 }} />
          </div>
        ))}

        {/* Final right page (tears away) */}
        <div ref={finalPageRef} className="absolute inset-y-3 left-1/2 right-3 rounded-r-xl border border-zinc-200 will-change-transform overflow-hidden" style={{ background: pageColor, transformOrigin: "left center", transformStyle: "preserve-3d" }}>
          {/* tear mask visual along right edge */}
          <svg className="tear-mask absolute right-0 top-0 h-full w-6" viewBox="0 0 24 100" preserveAspectRatio="none">
            <path d="M0,0 C12,16 6,24 12,40 C6,56 12,64 8,80 C14,88 10,96 12,100 L24,100 L24,0 Z" fill="#e8e1d9" />
          </svg>
          <div className="absolute inset-0 p-6">
            <div className="h-full w-full rounded-md" style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.02), rgba(0,0,0,0.02) 2px, transparent 2px, transparent 6px)" }} />
          </div>
          <div ref={finalPageShadeRef} className="pointer-events-none absolute inset-0 rounded-r-xl" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0) 45%)", opacity: 0 }} />
        </div>

        {/* Revealed page underneath with message and CTA inside the book */}
        <div ref={revealPageRef} className="absolute inset-y-3 left-1/2 right-3 rounded-r-xl border border-zinc-200 p-6 text-center flex flex-col" style={{ background: pageColor }}>
          <div className="mx-auto max-w-md">
            <p className="font-serif text-2xl leading-8 text-foreground">
              The page doesn't exist or may have moved.
            </p>
          </div>
          <a
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-700 to-brand-600 px-6 text-sm font-medium text-slate-50 shadow-md shadow-brand-600/20 transition duration-150 hover:from-primary-800 hover:to-brand-700"
          >
            <Home className="h-4 w-4" /> Return to the Library
          </a>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      console.info("404 route:", location.pathname);
    }
    headingRef.current?.focus();
  }, [location.pathname]);

  return (
    <section aria-label="Page not found" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
          <span>A whimsical detour in our library</span>
        </div>

        <Book404 path={location.pathname} />

        <h1 ref={headingRef} tabIndex={-1} className="sr-only">404 Page Not Found</h1>

      </div>
    </section>
  );
}
