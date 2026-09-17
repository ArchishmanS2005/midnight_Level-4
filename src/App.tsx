import Layout from './components/Layout'
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

  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center mb-12 py-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 badge proof-generating mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Midnight Builder Challenge — Level 4
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
          <span className="gradient-text text-glow-purple">Agent</span>
          <span className="text-white">Passport</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
          The <span className="text-purple-400 font-semibold">Privacy Layer</span> for Autonomous AI Agents.{' '}
          Prove permissions with{' '}
          <span className="text-cyan-400 font-semibold">Zero-Knowledge Proofs</span>{' '}
          — without revealing identity, credentials, or budget.
        </p>

        {/* Contract address display */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-purple-500/20 text-xs font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="text-slate-400">Contract:</span>
          <span className="text-purple-300">
            {CONTRACT_CONFIG.address === 'PENDING_DEPLOYMENT'
              ? 'Awaiting deployment to Preview'
              : CONTRACT_CONFIG.address}
          </span>
        </div>
      </section>

      {/* Privacy Model Banner */}
      <section className="mb-8">
        <div className="glass card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Privacy Model — What Gets Proved vs. What Stays Private
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PrivacyCard
              title="PUBLIC On-Chain"
              color="cyan"
              items={[
                'Agent count (total registered)',
                'Total authorized actions',
                'Total rejected actions',
                'ZK proof verification result',
              ]}
            />
            <PrivacyCard
              title="PRIVATE (Off-Chain Only)"
              color="purple"
              items={[
                'Agent secret key / identity',
                'Permission budget amount',
                'Credential hash',
                'Action type details',
              ]}
            />
            <PrivacyCard
              title="PROVEN Without Revealing"
              color="green"
              items={[
                '"Budget ≥ requested amount"',
                '"Agent key is valid & registered"',
                '"Credentials are authentic"',
                '"Caller owns this agent"',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Wallet */}
        <div className="lg:col-span-1 space-y-6">
          <WalletConnect
            wallet={wallet}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />

          {/* Tech Stack Card */}
          <div className="glass card">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Tech Stack
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Smart Contract', value: 'Midnight Compact', color: 'purple' },
                { label: 'Privacy', value: 'Zero-Knowledge Proofs', color: 'cyan' },
                { label: 'Network', value: 'Midnight Preview', color: 'pink' },
                { label: 'Frontend', value: 'React + Vite + TypeScript', color: 'purple' },
                { label: 'Wallet', value: 'Lace (Midnight)', color: 'cyan' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={`font-mono text-neon-${item.color} font-medium`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="glass card">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              How It Works
            </h3>
            <ol className="space-y-3">
              {[
                { step: '1', text: 'Create an AI agent with private permissions' },
                { step: '2', text: 'Agent requests an action (e.g., buy a product)' },
                { step: '3', text: 'AgentPassport generates a ZK proof locally' },
                { step: '4', text: 'Midnight contract verifies the proof on-chain' },
                { step: '5', text: 'Action approved or rejected — identity stays private' },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {item.step}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: Agent Authorization Panel */}
        <div className="lg:col-span-2">
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

      {/* Links Row */}
      <section className="mt-12 flex flex-wrap justify-center gap-4">
        <a
          href="https://docs.midnight.network"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-purple-500/20 text-sm text-slate-300 hover:text-white hover:border-purple-400/40 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Midnight Docs
        </a>
        <a
          href="https://github.com/ArchishmanS2005/midnight_Level-4"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-purple-500/20 text-sm text-slate-300 hover:text-white hover:border-purple-400/40 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub Repo
        </a>
        <a
          href="/docs/USAGE.md"
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-purple-500/20 text-sm text-slate-300 hover:text-white hover:border-purple-400/40 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Usage Guide
        </a>
      </section>
    </Layout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    purple: 'border-purple-500/30 bg-purple-900/10 text-purple-400',
    cyan: 'border-cyan-500/30 bg-cyan-900/10 text-cyan-400',
    green: 'border-green-500/30 bg-green-900/10 text-green-400',
  }

  const icons = {
    purple: '🔒',
    cyan: '📡',
    green: '✅',
  }

  return (
    <div className={`rounded-lg p-4 border ${colors[color]}`}>
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
