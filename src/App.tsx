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

  const handleHeroActionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-body">
      {/* FULL SCREEN HERO LANDING PAGE */}
      <MainframeHero onActionClick={handleHeroActionClick} />

      {/* DAPP TOTAL SYSTEM CONTROL CENTER */}
      <div id="agent-passport-app" className="relative z-10 bg-neutral-950/95 border-t border-white/10 pt-20 pb-28 backdrop-blur-2xl">
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

            {/* Contract Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900 border border-white/15 text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-neutral-400">Contract Address:</span>
              <span className="text-white font-medium">
                {CONTRACT_CONFIG.address === 'PENDING_DEPLOYMENT'
                  ? 'Awaiting deployment to Preview'
                  : CONTRACT_CONFIG.address}
              </span>
            </div>
          </div>

          {/* Privacy Architecture Cards */}
          <section id="how-it-works" className="mb-12">
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
              <div id="studio">
                <WalletConnect
                  wallet={wallet}
                  onConnect={connectWallet}
                  onDisconnect={disconnectWallet}
                />
              </div>

              {/* System Details */}
              <div id="labs" className="glass-card">
                <h4 className="text-xs font-heading font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  System Architecture
                </h4>
                <div className="space-y-3 font-body">
                  {[
                    { label: 'Smart Contract', value: 'Midnight Compact' },
                    { label: 'Privacy Engine', value: 'Zero-Knowledge Proofs' },
                    { label: 'Target Chain', value: 'Midnight Preview' },
                    { label: 'Interface Agent', value: 'A.R.I.A (Mainframe)' },
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
              <div id="openings" className="glass-card">
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
            <div id="register-agent" className="lg:col-span-2">
              <div id="authorize-action">
                <AgentAuthorization
                  isWalletConnected={wallet.status === 'connected'}
                  proof={proof}
                  stats={stats}
                  onRegister={registerAgent}
                  onAuthorize={authorizeAction}
                  onRevoke={revokeAgent}
                  onResetProof={resetProof}
                />
              </div>
            </div>
          </div>

          {/* Total System Footer */}
          <footer id="shop" className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-body">
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
