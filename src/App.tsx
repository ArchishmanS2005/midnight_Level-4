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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-black selection:text-white">
      {/* FULL SCREEN HERO LANDING PAGE */}
      <MainframeHero onActionClick={handleHeroActionClick} />

      {/* DAPP INTERACTIVE APPLICATION CONTAINER */}
      <div id="agent-passport-app" className="relative z-10 bg-slate-950 border-t border-slate-800/80 pt-16 pb-24">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 badge proof-generating mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Midnight Preview Network • Privacy Engine
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              <span className="gradient-text">AgentPassport</span> Control Center
            </h2>

            <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
              Cryptographic permissions for autonomous AI agents on Midnight Network.
              Execute private transactions with zero-knowledge proofs without exposing secrets.
            </p>

            {/* Contract Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20 text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-slate-400">Contract Address:</span>
              <span className="text-purple-300 font-medium">
                {CONTRACT_CONFIG.address === 'PENDING_DEPLOYMENT'
                  ? 'Awaiting deployment to Preview'
                  : CONTRACT_CONFIG.address}
              </span>
            </div>
          </div>

          {/* Privacy Model Section */}
          <section id="how-it-works" className="mb-12">
            <div className="glass card">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Zero-Knowledge Privacy Architecture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PrivacyCard
                  title="PUBLIC On-Chain"
                  color="cyan"
                  items={[
                    'Agent count (total registered)',
                    'Total authorized actions',
                    'Total rejected actions',
                    'ZK proof verification status',
                  ]}
                />
                <PrivacyCard
                  title="PRIVATE (Off-Chain Only)"
                  color="purple"
                  items={[
                    'Agent secret key / identity',
                    'Permission budget amount',
                    'Credential hash',
                    'Action parameters',
                  ]}
                />
                <PrivacyCard
                  title="PROVEN Without Revealing"
                  color="green"
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

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Wallet & Architecture */}
            <div className="lg:col-span-1 space-y-6">
              <div id="studio">
                <WalletConnect
                  wallet={wallet}
                  onConnect={connectWallet}
                  onDisconnect={disconnectWallet}
                />
              </div>

              {/* Stack Details */}
              <div id="labs" className="glass card">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  System Architecture
                </h4>
                <div className="space-y-2.5">
                  {[
                    { label: 'Smart Contract', value: 'Midnight Compact', color: 'purple' },
                    { label: 'Privacy Engine', value: 'Zero-Knowledge Proofs', color: 'cyan' },
                    { label: 'Target Chain', value: 'Midnight Preview', color: 'pink' },
                    { label: 'Interface Agent', value: 'A.R.I.A (Mainframe)', color: 'purple' },
                    { label: 'Wallet API', value: 'Lace (Midnight)', color: 'cyan' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-mono text-cyan-300 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Flow */}
              <div id="openings" className="glass card">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Proof Execution Pipeline
                </h4>
                <ol className="space-y-3">
                  {[
                    { step: '1', text: 'Generate private key & budget off-chain' },
                    { step: '2', text: 'Commit agent state to Compact ledger' },
                    { step: '3', text: 'Build client-side ZK proof in browser/node' },
                    { step: '4', text: 'Verify proof on Midnight consensus node' },
                    { step: '5', text: 'Update public counters without revealing secrets' },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-2.5 text-xs text-slate-400">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {item.step}
                      </span>
                      <span className="leading-snug">{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Right Column: Agent Passport Operations */}
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

          {/* Footer & Links */}
          <footer id="shop" className="mt-16 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              AgentPassport v1.0.0 • Midnight Builder Challenge Level 4
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.midnight.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Midnight Docs
              </a>
              <a
                href="https://github.com/ArchishmanS2005/midnight_Level-4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white transition-colors"
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
  color,
  items,
}: {
  title: string
  color: 'purple' | 'cyan' | 'green'
  items: string[]
}) {
  const colors = {
    purple: 'border-purple-500/30 bg-purple-950/40 text-purple-400',
    cyan: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400',
    green: 'border-green-500/30 bg-green-950/40 text-green-400',
  }

  const icons = {
    purple: '🔒',
    cyan: '📡',
    green: '✅',
  }

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="text-xs font-bold mb-3 flex items-center gap-1.5">
        <span>{icons[color]}</span>
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
            <span className="text-current/60 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
