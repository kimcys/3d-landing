/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

const VIDEO_URL =
  '/assets/aistudio/AiMan_no_watermark_muted_original_quality_a17018cb.mp4';
const SENSITIVITY = 0.8;
const TYPEWRITER_TEXT =
  'Glad you stopped in. Good taste tends to find us. Now, what are we building?';

/**
 * Custom hook to reveal text character by character with a blinking cursor.
 */
function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;
    let currentIndex = 0;

    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          currentIndex++;
          setDisplayed(text.slice(0, currentIndex));
        } else {
          setDone(true);
          clearInterval(intervalId);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef<number>(0);
  const prevXRef = useRef<number | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const pendingSeekRef = useRef<boolean>(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  // Typewriter hook
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, 38, 600);

  // Reveal pill buttons 400ms after page mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setButtonsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Seek coordinator to prevent seek flooding
  const dispatchSeek = () => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) return;

    if (!isSeekingRef.current) {
      isSeekingRef.current = true;
      try {
        video.currentTime = targetTimeRef.current;
      } catch {
        isSeekingRef.current = false;
      }
    } else {
      pendingSeekRef.current = true;
    }
  };

  const handleSeeked = () => {
    const video = videoRef.current;
    if (!video || !video.duration || Number.isNaN(video.duration)) {
      isSeekingRef.current = false;
      pendingSeekRef.current = false;
      return;
    }

    if (pendingSeekRef.current) {
      pendingSeekRef.current = false;
      try {
        video.currentTime = targetTimeRef.current;
      } catch {
        isSeekingRef.current = false;
      }
    } else {
      isSeekingRef.current = false;
    }
  };

  // Mouse scrub listener on window
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current;
      if (!video) return;

      const currentX = e.clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;

      const offset = (delta / window.innerWidth) * SENSITIVITY * duration;
      const nextTime = Math.max(0, Math.min(duration, targetTimeRef.current + offset));
      targetTimeRef.current = nextTime;
      dispatchSeek();
    };

    // Also support touch movements for mobile users
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const video = videoRef.current;
      if (!video) return;

      const currentX = e.touches[0].clientX;
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;

      const offset = (delta / window.innerWidth) * SENSITIVITY * duration;
      const nextTime = Math.max(0, Math.min(duration, targetTimeRef.current + offset));
      targetTimeRef.current = nextTime;
      dispatchSeek();
    };

    const handleTouchEnd = () => {
      prevXRef.current = null;
    };

    const handleMouseLeave = () => {
      prevXRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Handle copy to clipboard
  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText('hello@mainframe.co');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { label: 'Labs', href: '#labs' },
    { label: 'Studio', href: '#studio' },
    { label: 'Openings', href: '#openings' },
    { label: 'Shop', href: '#shop' },
  ];

  const whitePills = [
    { label: 'Pitch us an idea', href: 'mailto:hello@mainframe.co?subject=Project%20Pitch' },
    { label: 'Come work here', href: '#openings' },
    { label: 'Send a brief hello', href: 'mailto:hello@mainframe.co?subject=Brief%20Hello' },
    { label: 'See how we operate', href: '#studio' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-black text-white select-none overflow-x-hidden">
      {/* Full-screen background video */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        preload="auto"
        onSeeked={handleSeeked}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            targetTimeRef.current = videoRef.current.currentTime || 0;
          }
        }}
        className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none"
        style={{
          objectPosition: '70% center',
        }}
      />

      {/* FIXED NAVBAR (z-index: 10) */}
      <header className="fixed top-0 left-0 right-0 z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center">
        {/* Logo (left) */}
        <a
          href="#"
          className="flex flex-row items-center gap-3 group cursor-pointer"
        >
          <span
            style={{ fontFamily: 'var(--font-heading)' }}
            className="text-[21px] sm:text-[26px] tracking-tight text-white select-none"
          >
            Mainframe®
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-white select-none leading-none inline-block transform group-hover:rotate-45 transition-transform duration-300"
            style={{ letterSpacing: '-0.02em' }}
            aria-hidden="true"
          >
            ✳︎
          </span>
        </a>

        {/* Desktop nav links (center, hidden below md) */}
        <nav className="hidden md:flex flex-row items-center text-[23px] text-white select-none">
          {navLinks.map((link, idx) => (
            <React.Fragment key={link.label}>
              <a
                href={link.href}
                className="hover:opacity-60 transition-opacity"
              >
                {link.label}
              </a>
              {idx < navLinks.length - 1 && (
                <span className="select-none">,&nbsp;</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Desktop CTA (right, hidden below md) */}
        <div className="hidden md:block">
          <a
            href="mailto:hello@mainframe.co"
            className="text-[23px] text-white underline underline-offset-2 hover:opacity-60 transition-opacity"
          >
            Get in touch
          </a>
        </div>

        {/* Mobile hamburger (visible below md) */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center gap-[5px] p-2 focus:outline-none cursor-pointer z-20"
        >
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white transition-all duration-300 ${
              mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </header>

      {/* Mobile overlay (z-index: 9) */}
      <div
        className={`fixed inset-0 z-[9] bg-black/90 backdrop-blur-md flex flex-col justify-center px-8 gap-8 md:hidden transition-all duration-300 ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-[32px] font-medium text-white hover:opacity-60 transition-opacity"
            >
              {link.label}
            </a>
          ))}
          <a
            href="mailto:hello@mainframe.co"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[32px] font-medium text-white underline underline-offset-4 hover:opacity-60 transition-opacity pt-4"
          >
            Get in touch
          </a>
        </div>
      </div>

      {/* HERO SECTION (z-index: 1) */}
      <main className="relative z-[1] w-full h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden">
        <div className="max-w-xl relative z-10">
          {/* 1. Blurred intro label */}
          <div
            className="pointer-events-none select-none mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              color: '#fff',
              filter: 'blur(4px)',
            }}
          >
            Hey there, meet A.R.I.A,
            <br />
            Mainframe's Adaptive Response Interface Agent
          </div>

          {/* 2. Typewriter text */}
          <p
            className="text-white mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
              fontWeight: 400,
              minHeight: '54px',
            }}
          >
            <span>{displayed}</span>
            {!done && (
              <span
                className="inline-block w-[2px] h-[1.1em] bg-white align-middle ml-[2px] animate-blink"
                aria-hidden="true"
              />
            )}
          </p>

          {/* 3. Action pill buttons */}
          <div
            className="flex flex-wrap gap-y-1 transition-all duration-400 ease-out"
            style={{
              opacity: buttonsVisible ? 1 : 0,
              transform: buttonsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {whitePills.map((pill) => (
              <a
                key={pill.label}
                href={pill.href}
                className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
              >
                {pill.label}
              </a>
            ))}

            {/* Outline pill button with email & copy icon */}
            <button
              type="button"
              onClick={handleCopyEmail}
              title="Click to copy email address"
              className="text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer gap-2 sm:gap-3 group"
            >
              <span>
                Reach us:{' '}
                <span className="underline underline-offset-1">
                  hello@mainframe.co
                </span>
              </span>
              {copied ? (
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Copied!
                </span>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline-block shrink-0 transition-transform group-hover:scale-110"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
