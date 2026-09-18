import { useState } from 'react'
import MainframeHero from './components/MainframeHero'
import WalletConnect from './components/WalletConnect'
import AgentAuthorization from './components/AgentAuthorization'
import { useMidnight } from './hooks/useMidnight'
import { CONTRACT_CONFIG } from './utils/contract'

export default function App() {
  const {
    wallet,
    proof,
    stats,
    connectWallet,
    disconnectWallet,
    registerAgent,
    authorizeAction,
    revokeAgent,
    resetProof,
  } = useMidnight()

  const [activeTab, setActiveTab] = useState<'register' | 'authorize' | 'revoke'>('register')

  const handleHeroActionClick = (targetId: string) => {
    if (targetId === 'register-tab-btn') {
      setActiveTab('register')
    } else if (targetId === 'authorize-tab-btn') {
      setActiveTab('authorize')
    } else if (targetId === 'revoke-tab-btn') {
      setActiveTab('revoke')
    }

    const element = document.getElementById(targetId) || document.getElementById('operations-panel')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-body">
      {/* FULL SCREEN HERO LANDING PAGE */}
      <MainframeHero
        onActionClick={handleHeroActionClick}
        contractAddress={CONTRACT_CONFIG.address}
      />

      {/* DAPP UNIFIED CONTROL CENTER CONTAINER */}
      <div
        id="agent-passport-app"
        className="relative z-10 bg-black/80 backdrop-blur-2xl border-t border-white/10 pt-20 pb-28"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10">
          {/* Header Banner */}
          <div className="text-center mb-14 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-heading font-medium tracking-wide text-white mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Midnight Preview Network • ZK Privacy Engine
            </div>

            <h2 className="text-3xl sm:text-5xl font-heading font-normal text-white mb-4 tracking-tight">
              AgentPassport Control Center
            </h2>

            <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto mb-6 leading-relaxed font-body">
              Cryptographic permissions for autonomous AI agents on Midnight Network. Execute private transactions with zero-knowledge proofs without exposing secrets.
            </p>

            {/* Permanent Verified Contract Deployment Banner */}
            <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-neutral-900/90 border border-emerald-500/40 text-left backdrop-blur-md shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div>
                    <div className="text-xs font-heading font-semibold uppercase tracking-wider text-emerald-400">
                      Real Verified Contract Deployment (Midnight Preview Network)
                    </div>
                    <div className="text-xs font-mono text-neutral-200 break-all mt-0.5">
                      {CONTRACT_CONFIG.address}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://explorer.preview.midnight.network/contracts/${CONTRACT_CONFIG.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono text-emerald-300 transition-colors"
                >
                  View Contract on Explorer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Privacy Architecture Cards */}
          <section id="privacy-architecture-section" className="mb-12">
            <div className="glass-card">
              <h3 className="text-sm font-heading font-medium text-white mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Zero-Knowledge Privacy Architecture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PrivacyCard
                  title="PUBLIC On-Chain"
                  type="cyan"
                  items={[
                    'Agent count (total registered)',
                    'Total authorized actions',
                    'Total rejected actions',
                    'ZK proof verification status',
                  ]}
                />
                <PrivacyCard
                  title="PRIVATE (Off-Chain Only)"
                  type="purple"
                  items={[
                    'Agent secret key / identity',
                    'Permission budget amount',
                    'Credential hash',
                    'Action parameters',
                  ]}
                />
                <PrivacyCard
                  title="PROVEN Without Revealing"
                  type="green"
                  items={[
                    '"Budget ≥ requested amount"',
                    '"Agent key is valid & registered"',
                    '"Credentials match Compact ledger"',
                    '"Caller holds valid authorization"',
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Main Interactive Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Wallet & System Architecture */}
            <div className="lg:col-span-1 space-y-6">
              <div id="wallet-connect-section">
                <WalletConnect
                  wallet={wallet}
                  onConnect={connectWallet}
                  onDisconnect={disconnectWallet}
                />
              </div>

              {/* System Details */}
              <div id="system-architecture-section" className="glass-card">
                <h4 className="text-xs font-heading font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  System Architecture
                </h4>
                <div className="space-y-3 font-body">
                  {[
                    { label: 'Smart Contract', value: 'Midnight Compact' },
                    { label: 'Privacy Engine', value: 'Zero-Knowledge Proofs' },
                    { label: 'Target Chain', value: 'Midnight Preview' },
                    { label: 'Interface Agent', value: 'A.R.I.A (AgentPassport)' },
                    { label: 'Wallet API', value: 'Lace (Midnight)' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400">{item.label}</span>
                      <span className="font-heading text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Pipeline */}
              <div id="execution-pipeline-section" className="glass-card">
                <h4 className="text-xs font-heading font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  Proof Execution Pipeline
                </h4>
                <ol className="space-y-3 font-body">
                  {[
                    { step: '1', text: 'Generate private key & budget off-chain' },
                    { step: '2', text: 'Commit agent state to Compact ledger' },
                    { step: '3', text: 'Build client-side ZK proof in browser/node' },
                    { step: '4', text: 'Verify proof on Midnight consensus node' },
                    { step: '5', text: 'Update public counters without revealing secrets' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3 text-xs text-neutral-300">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-white text-black font-heading font-semibold flex items-center justify-center text-[10px]">
                        {item.step}
                      </span>
                      <span className="leading-snug">{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right Column: Operations Panel */}
            <div id="operations-panel" className="lg:col-span-2">
              <AgentAuthorization
                isWalletConnected={wallet.status === 'connected'}
                proof={proof}
                stats={stats}
                selectedTab={activeTab}
                onTabChange={setActiveTab}
                onRegister={registerAgent}
                onAuthorize={authorizeAction}
                onRevoke={revokeAgent}
                onResetProof={resetProof}
              />
            </div>
          </div>

          {/* Total System Footer */}
          <footer className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-body">
            <div className="text-xs text-neutral-400">
              AgentPassport v1.0.0 • Midnight Builder Challenge Level 4
            </div>
            <div className="flex items-center gap-6 text-xs text-neutral-400">
              <a
                href="https://docs.midnight.network"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Midnight Docs
              </a>
              <a
                href="https://github.com/ArchishmanS2005/midnight_Level-4"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub Codebase
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

function PrivacyCard({
  title,
  type,
  items,
}: {
  title: string
  type: 'cyan' | 'purple' | 'green'
  items: string[]
}) {
  const styles = {
    cyan: 'border-white/15 bg-neutral-900/50 text-white',
    purple: 'border-white/15 bg-neutral-900/50 text-white',
    green: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
  }

  const icons = {
    cyan: '📡',
    purple: '🔒',
    green: '✅',
  }

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-md ${styles[type]}`}>
      <div className="text-xs font-heading font-medium mb-3 flex items-center gap-1.5">
        <span>{icons[type]}</span>
        {title}
      </div>
      <ul className="space-y-1.5 font-body">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-neutral-400 flex items-start gap-1.5">
            <span className="text-white/40 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
