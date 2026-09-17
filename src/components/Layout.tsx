import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative grid-bg">
      {/* Background ambient orbs */}
      <div
        className="orb"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, #a855f7, transparent)',
          top: '-200px',
          right: '-200px',
        }}
      />
      <div
        className="orb"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #06b6d4, transparent)',
          bottom: '-150px',
          left: '-150px',
          animationDelay: '4s',
        }}
      />
      <div
        className="orb"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, #ec4899, transparent)',
          top: '50%',
          left: '50%',
          animationDelay: '2s',
          opacity: 0.08,
        }}
      />

      {/* Header / Navigation */}
      <header className="relative z-10 border-b border-purple-900/30">
        <div className="glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg opacity-20 animate-pulse" />
                  <div className="relative w-9 h-9 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <path d="M9 7h6M9 11h6M9 15h4" />
                      <circle cx="17" cy="17" r="3" fill="none" />
                      <path d="m19.5 19.5 1.5 1.5" />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="text-lg font-bold gradient-text">AgentPassport</span>
                  <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
                    Privacy Layer for AI Agents
                  </div>
                </div>
              </div>

              {/* Center nav */}
              <nav className="hidden md:flex items-center gap-6">
                <span className="text-sm text-slate-400 hover:text-purple-400 cursor-pointer transition-colors">
                  Dashboard
                </span>
                <span className="text-sm text-slate-400 hover:text-purple-400 cursor-pointer transition-colors">
                  Agents
                </span>
                <span className="text-sm text-slate-400 hover:text-purple-400 cursor-pointer transition-colors">
                  Docs
                </span>
              </nav>

              {/* Network badge */}
              <div className="flex items-center gap-3">
                <div className="badge proof-generating hidden sm:flex">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Preview Network
                </div>
                <a
                  href="https://github.com/ArchishmanS2005/midnight_Level-4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="GitHub Repository"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-900/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Built with{' '}
              <span className="text-purple-400">Midnight Network</span>{' '}
              &amp; Zero-Knowledge Proofs •{' '}
              <a
                href="https://midnight.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                midnight.network
              </a>
            </div>
            <div className="text-sm text-slate-500 font-mono">
              AgentPassport v1.0.0 • Midnight Builder Challenge Level 4
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
