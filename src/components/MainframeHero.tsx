import React, { useState, useEffect, useRef } from 'react'
import { useTypewriter } from '../hooks/useTypewriter'

interface MainframeHeroProps {
  onActionClick?: (action: string) => void
}

export default function MainframeHero({ onActionClick }: MainframeHeroProps) {
  // Video mouse scrubbing refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevXRef = useRef<number | null>(null)
  const isSeekingRef = useRef(false)
  const targetTimeRef = useRef(0)

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Copy email feedback
  const [copied, setCopied] = useState(false)

  // Action pills animation
  const [pillsVisible, setPillsVisible] = useState(false)

  // Typewriter hook
  const { displayed, done: typewritingDone } = useTypewriter(
    'Glad you stopped in. Good taste tends to find us. Now, what are we building?',
    { speed: 38, startDelay: 600 }
  )

  // Trigger pill visibility 400ms after load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPillsVisible(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  // Video mouse scrubbing effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const video = videoRef.current
      if (!video || !video.duration || Number.isNaN(video.duration)) return

      if (prevXRef.current === null) {
        prevXRef.current = e.clientX
        return
      }

      const delta = e.clientX - prevXRef.current
      prevXRef.current = e.clientX

      const sensitivity = 0.8
      const timeOffset = (delta / window.innerWidth) * sensitivity * video.duration
      const newTarget = Math.max(0, Math.min(video.duration, targetTimeRef.current + timeOffset))
      targetTimeRef.current = newTarget

      if (!isSeekingRef.current) {
        isSeekingRef.current = true
        video.currentTime = newTarget
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Video seeked handler to prevent seek-flooding
  const handleSeeked = () => {
    const video = videoRef.current
    if (!video) return
    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.05) {
      video.currentTime = targetTimeRef.current
    } else {
      isSeekingRef.current = false
    }
  }

  // Handle email copy
  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText('hello@mainframe.co')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false)
    if (onActionClick) {
      onActionClick(sectionId)
    }
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      {/* Background Video (mouse scrubbed) */}
      <video
        ref={videoRef}
        onSeeked={handleSeeked}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4"
        muted
        playsInline
        preload="auto"
        className="fixed inset-0 z-0 w-full h-full object-cover object-[70%_center] pointer-events-none"
      />

      {/* FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-10 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
        {/* Logo (left) */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span
            className="text-[21px] sm:text-[26px] tracking-tight text-black font-normal"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Mainframe®
          </span>
          <span
            className="text-[25px] sm:text-[30px] text-black select-none"
            style={{ letterSpacing: '-0.02em' }}
          >
            ✳︎
          </span>
        </div>

        {/* Desktop Nav Links (center, hidden below md) */}
        <div className="hidden md:flex items-center text-[23px] text-black font-normal">
          <button
            onClick={() => handleNavClick('labs')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Labs
          </button>
          <span className="select-none">,&nbsp;</span>
          <button
            onClick={() => handleNavClick('studio')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Studio
          </button>
          <span className="select-none">,&nbsp;</span>
          <button
            onClick={() => handleNavClick('openings')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Openings
          </button>
          <span className="select-none">,&nbsp;</span>
          <button
            onClick={() => handleNavClick('shop')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Shop
          </button>
        </div>

        {/* Desktop CTA (right, hidden below md) */}
        <div className="hidden md:block">
          <button
            onClick={() => handleNavClick('agent-passport-app')}
            className="text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 font-inherit"
          >
            Get in touch
          </button>
        </div>

        {/* Mobile Hamburger Button (visible below md) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] z-20 cursor-pointer bg-transparent border-none focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <span
            className={`w-6 h-[2px] bg-black duration-300 transition-all ${
              mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black duration-300 transition-all ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-black duration-300 transition-all ${
              mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </nav>

      {/* MOBILE OVERLAY MENU */}
      <div
        className={`fixed inset-0 z-9 bg-white/95 backdrop-blur-sm flex flex-col justify-center px-8 gap-8 transition-all duration-300 md:hidden ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => handleNavClick('labs')}
          className="text-[32px] font-medium text-black text-left bg-transparent border-none p-0"
        >
          Labs
        </button>
        <button
          onClick={() => handleNavClick('studio')}
          className="text-[32px] font-medium text-black text-left bg-transparent border-none p-0"
        >
          Studio
        </button>
        <button
          onClick={() => handleNavClick('openings')}
          className="text-[32px] font-medium text-black text-left bg-transparent border-none p-0"
        >
          Openings
        </button>
        <button
          onClick={() => handleNavClick('shop')}
          className="text-[32px] font-medium text-black text-left bg-transparent border-none p-0"
        >
          Shop
        </button>
        <button
          onClick={() => handleNavClick('agent-passport-app')}
          className="text-[32px] font-medium text-black underline text-left bg-transparent border-none p-0"
        >
          Get in touch
        </button>
      </div>

      {/* HERO SECTION */}
      <section className="relative z-1 h-screen flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden">
        <div className="max-w-xl relative z-10">
          {/* 1. Blurred intro label */}
          <div
            className="pointer-events-none select-none mb-5 sm:mb-6 text-black blur-[4px]"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
            }}
          >
            Hey there, meet A.R.I.A,
            <br />
            Mainframe's Adaptive Response Interface Agent
          </div>

          {/* 2. Typewriter text */}
          <p
            className="text-black mb-5 sm:mb-6 font-normal min-h-[54px]"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.35,
            }}
          >
            {displayed}
            {!typewritingDone && (
              <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-blink" />
            )}
          </p>

          {/* 3. Action pill buttons */}
          <div
            className={`flex flex-wrap gap-y-1 transition-all duration-400 ease-out ${
              pillsVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-[8px]'
            }`}
          >
            {/* White pill 1 */}
            <button
              onClick={() => handleNavClick('register-agent')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Pitch us an idea
            </button>

            {/* White pill 2 */}
            <button
              onClick={() => handleNavClick('openings')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Come work here
            </button>

            {/* White pill 3 */}
            <button
              onClick={() => handleNavClick('authorize-action')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Send a brief hello
            </button>

            {/* White pill 4 */}
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              See how we operate
            </button>

            {/* Outline pill 5 with copy icon */}
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap gap-2 sm:gap-3 cursor-pointer hover:bg-white hover:text-black transition-colors duration-200 relative"
              title="Click to copy email address"
            >
              <span>
                Reach us:{' '}
                <span className="underline underline-offset-1">
                  hello@mainframe.co
                </span>
              </span>
              {/* Inline SVG 12x12 copy icon */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <rect
                  x="4"
                  y="4"
                  width="9"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M3 10.5H2.5C1.94772 10.5 1.5 10.0523 1.5 9.5V3.5C1.5 2.94772 1.94772 2.5 2.5 2.5H8.5C9.05228 2.5 9.5 2.94772 9.5 3.5V4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>

              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[11px] px-2 py-0.5 rounded shadow">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
