import React, { useState, useEffect, useRef } from 'react'
import { useTypewriter } from '../hooks/useTypewriter'

interface MainframeHeroProps {
  onActionClick?: (action: string) => void
  contractAddress?: string
}

export default function MainframeHero({ onActionClick, contractAddress }: MainframeHeroProps) {
  // Video mouse scrubbing refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevXRef = useRef<number | null>(null)
  const isSeekingRef = useRef(false)
  const targetTimeRef = useRef(0)

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Copy feedback state
  const [copied, setCopied] = useState(false)

  // Action pills animation
  const [pillsVisible, setPillsVisible] = useState(false)

  // Typewriter hook - concise, project-specific statement
  const { displayed, done: typewritingDone } = useTypewriter(
    'Autonomous AI agents execute actions. We make their permissions private using Zero-Knowledge Proofs on Midnight.',
    { speed: 32, startDelay: 500 }
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

  // Handle address copy
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation()
    const addr = contractAddress || 'PENDING_DEPLOYMENT'
    navigator.clipboard.writeText(addr)
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

      {/* UNIFIED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-20 w-full px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10">
        {/* Logo (left) */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span
            className="text-[20px] sm:text-[25px] tracking-tight text-white font-normal"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            AgentPassport®
          </span>
          <span
            className="text-[22px] sm:text-[28px] text-white select-none"
            style={{ letterSpacing: '-0.02em' }}
          >
            ✳︎
          </span>
          <span className="hidden lg:inline-block text-xs text-neutral-400 font-mono ml-2 border-l border-white/20 pl-3">
            Midnight Privacy Layer
          </span>
        </div>

        {/* Desktop Nav Links (center, hidden below md) */}
        <div className="hidden md:flex items-center text-[20px] text-white font-normal">
          <button
            onClick={() => handleNavClick('register-tab-btn')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Register
          </button>
          <span className="select-none text-white/40">,&nbsp;</span>
          <button
            onClick={() => handleNavClick('authorize-tab-btn')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Authorize
          </button>
          <span className="select-none text-white/40">,&nbsp;</span>
          <button
            onClick={() => handleNavClick('revoke-tab-btn')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Revoke
          </button>
          <span className="select-none text-white/40">,&nbsp;</span>
          <button
            onClick={() => handleNavClick('privacy-architecture-section')}
            className="hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit"
          >
            Privacy Model
          </button>
        </div>

        {/* Desktop CTA (right, hidden below md) */}
        <div className="hidden md:block">
          <button
            onClick={() => handleNavClick('wallet-connect-section')}
            className="text-[20px] text-white underline underline-offset-2 hover:opacity-60 transition-opacity cursor-pointer bg-transparent border-none p-0 font-inherit"
          >
            Connect Wallet
          </button>
        </div>

        {/* Mobile Hamburger Button (visible below md) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] z-30 cursor-pointer bg-transparent border-none focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <span
            className={`w-6 h-[2px] bg-white duration-300 transition-all ${
              mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white duration-300 transition-all ${
              mobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`w-6 h-[2px] bg-white duration-300 transition-all ${
              mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            }`}
          />
        </button>
      </nav>

      {/* MOBILE OVERLAY MENU */}
      <div
        className={`fixed inset-0 z-20 bg-black/95 backdrop-blur-xl flex flex-col justify-center px-8 gap-8 transition-all duration-300 md:hidden ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => handleNavClick('register-tab-btn')}
          className="text-[32px] font-medium text-white text-left bg-transparent border-none p-0"
        >
          Register Agent
        </button>
        <button
          onClick={() => handleNavClick('authorize-tab-btn')}
          className="text-[32px] font-medium text-white text-left bg-transparent border-none p-0"
        >
          Authorize Action
        </button>
        <button
          onClick={() => handleNavClick('revoke-tab-btn')}
          className="text-[32px] font-medium text-white text-left bg-transparent border-none p-0"
        >
          Revoke Agent
        </button>
        <button
          onClick={() => handleNavClick('privacy-architecture-section')}
          className="text-[32px] font-medium text-white text-left bg-transparent border-none p-0"
        >
          Zero-Knowledge Model
        </button>
        <button
          onClick={() => handleNavClick('wallet-connect-section')}
          className="text-[32px] font-medium text-white underline text-left bg-transparent border-none p-0"
        >
          Connect Lace Wallet
        </button>
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 h-screen flex flex-col justify-end pb-16 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 overflow-hidden">
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
            AgentPassport's Autonomous Privacy Interface Agent
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

          {/* 3. Action pill buttons - PROJECT USEFUL & SPECIFIC */}
          <div
            className={`flex flex-wrap gap-y-1 transition-all duration-400 ease-out ${
              pillsVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-[8px]'
            }`}
          >
            {/* White pill 1 */}
            <button
              onClick={() => handleNavClick('register-tab-btn')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Register Agent
            </button>

            {/* White pill 2 */}
            <button
              onClick={() => handleNavClick('authorize-tab-btn')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Authorize Action
            </button>

            {/* White pill 3 */}
            <button
              onClick={() => handleNavClick('revoke-tab-btn')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Revoke Agent
            </button>

            {/* White pill 4 */}
            <button
              onClick={() => handleNavClick('privacy-architecture-section')}
              className="inline-flex items-center justify-center bg-white text-black border border-black/10 rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap cursor-pointer hover:bg-black hover:text-white transition-colors duration-200"
            >
              Zero-Knowledge Model
            </button>

            {/* Outline pill 5 with copy icon */}
            <button
              onClick={handleCopyAddress}
              className="inline-flex items-center justify-center text-white bg-transparent border border-white rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap gap-2 sm:gap-3 cursor-pointer hover:bg-white hover:text-black transition-colors duration-200 relative"
              title="Click to copy Midnight Preview Contract Address"
            >
              <span>
                Midnight Preview:{' '}
                <span className="underline underline-offset-1 font-mono">
                  {contractAddress && contractAddress !== 'PENDING_DEPLOYMENT' ? `${contractAddress.slice(0, 10)}...` : 'Contract Active'}
                </span>
              </span>
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
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[11px] px-2 py-0.5 rounded shadow border border-white/20">
                  Copied Address!
                </span>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
