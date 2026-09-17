import { useState } from 'react'
import { ProofState, ContractStats } from '../hooks/useMidnight'
import { generateSecretKey, bytesToHex, hashCredential, getTxExplorerUrl, truncate } from '../utils/contract'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionTab = 'register' | 'authorize' | 'revoke'

interface AgentAuthorizationProps {
  isWalletConnected: boolean
  proof: ProofState
  stats: ContractStats
  onRegister: (secretKey: string, credentialHash: string) => Promise<boolean>
  onAuthorize: (requestedAmount: number, budget: number) => Promise<boolean>
  onRevoke: (secretKey: string) => Promise<boolean>
  onResetProof: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentAuthorization({
  isWalletConnected,
  proof,
  stats,
  onRegister,
  onAuthorize,
  onRevoke,
  onResetProof,
}: AgentAuthorizationProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>('register')

  // Registration form state
  const [secretKey, setSecretKey] = useState('')
  const [credential, setCredential] = useState('')

  // Authorization form state
  const [requestedAmount, setRequestedAmount] = useState('')
  const [budget, setBudget] = useState('')

  // Revocation form state
  const [revokeKey, setRevokeKey] = useState('')

  const isProcessing = proof.status === 'generating' || proof.status === 'submitting'

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    if (!secretKey || !credential) return
    const credHash = bytesToHex(hashCredential(credential))
    await onRegister(secretKey, credHash)
  }

  const handleAuthorize = async () => {
    const amount = parseInt(requestedAmount)
    const bud = parseInt(budget)
    if (isNaN(amount) || isNaN(bud) || amount <= 0) return
    await onAuthorize(amount, bud)
  }

  const handleRevoke = async () => {
    if (!revokeKey) return
    await onRevoke(revokeKey)
  }

  const handleGenerateKey = () => {
    const key = generateSecretKey()
    setSecretKey(bytesToHex(key))
  }

  // ── Tab configs ───────────────────────────────────────────────────────────
  const tabs: { id: ActionTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'register',
      label: 'Register Agent',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    },
    {
      id: 'authorize',
      label: 'Authorize Action',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      id: 'revoke',
      label: 'Revoke Agent',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Registered Agents"
          value={stats.agentCount}
          color="purple"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Authorized Actions"
          value={stats.totalAuthorizations}
          color="green"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />
        <StatCard
          label="Rejected Actions"
          value={stats.totalRejections}
          color="red"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Main Panel */}
      <div className="glass card">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg bg-midnight-950/60 border border-purple-900/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id)
                onResetProof()
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600/80 to-cyan-600/80 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Privacy Model Reminder */}
        <div className="mb-6 p-3 rounded-lg bg-purple-900/10 border border-purple-500/20 text-xs">
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div className="text-slate-400">
              <span className="text-purple-400 font-semibold">ZK Privacy Active: </span>
              Your private data (secret keys, budget, credentials) is processed locally on your device.
              Only cryptographic proofs are submitted to the Midnight Preview network.
            </div>
          </div>
        </div>

        {/* Disabled overlay */}
        {!isWalletConnected && (
          <div className="mb-4 p-4 rounded-lg proof-pending text-sm text-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mb-1 mr-1">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Connect your wallet above to interact with the AgentPassport contract
          </div>
        )}

        {/* ── Register Tab ── */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Agent Secret Key{' '}
                <span className="text-purple-400 ml-1 font-mono">(Private — never on-chain)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="register-secret-key"
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter or generate a 32-byte hex secret key..."
                  className="input-neon"
                  disabled={!isWalletConnected || isProcessing}
                />
                <button
                  id="generate-key-btn"
                  onClick={handleGenerateKey}
                  disabled={!isWalletConnected || isProcessing}
                  className="btn-ghost text-xs whitespace-nowrap px-3"
                  title="Generate random key"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This is your agent's private identity. Store it securely — it's needed for authorization and revocation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Agent Credential{' '}
                <span className="text-purple-400 ml-1 font-mono">(Private — hashed locally)</span>
              </label>
              <input
                id="register-credential"
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Enter agent credential (e.g., API key, certificate ID)..."
                className="input-neon"
                disabled={!isWalletConnected || isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1">
                Will be hashed locally before use. The original credential never leaves your device.
              </p>
            </div>

            <button
              id="register-agent-btn"
              onClick={handleRegister}
              disabled={!isWalletConnected || isProcessing || !secretKey || !credential}
              className="btn-neon w-full"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: 'white' }} />
                  {proof.status === 'generating' ? 'Generating ZK Proof...' : 'Submitting to Network...'}
                </span>
              ) : (
                'Register Agent with ZK Proof'
              )}
            </button>
          </div>
        )}

        {/* ── Authorize Tab ── */}
        {activeTab === 'authorize' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Permission Budget (tDUST){' '}
                <span className="text-purple-400 ml-1 font-mono">(Private — never revealed)</span>
              </label>
              <input
                id="authorize-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Your agent's private spending budget..."
                className="input-neon"
                min="1"
                disabled={!isWalletConnected || isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1">
                This value stays private. The ZK proof only reveals whether it's sufficient.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Requested Action Amount (tDUST){' '}
                <span className="text-cyan-400 ml-1 font-mono">(Public — on-chain)</span>
              </label>
              <input
                id="authorize-amount"
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                placeholder="Cost of the action to authorize..."
                className="input-neon"
                min="1"
                disabled={!isWalletConnected || isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1">
                The requested amount is public. The circuit proves budget ≥ amount without revealing budget.
              </p>
            </div>

            {/* Budget comparison preview */}
            {budget && requestedAmount && (
              <div className={`p-3 rounded-lg text-xs ${
                parseInt(budget) >= parseInt(requestedAmount) ? 'proof-verified' : 'proof-rejected'
              }`}>
                <div className="font-semibold mb-1">ZK Proof Preview:</div>
                <div>
                  Budget ({parseInt(budget).toLocaleString()}) {parseInt(budget) >= parseInt(requestedAmount) ? '≥' : '<'}{' '}
                  Requested ({parseInt(requestedAmount).toLocaleString()}) →{' '}
                  <strong>{parseInt(budget) >= parseInt(requestedAmount) ? 'WILL AUTHORIZE' : 'WILL REJECT'}</strong>
                </div>
                <div className="mt-1 text-current/70">Budget value stays private — only this verdict is proven on-chain.</div>
              </div>
            )}

            <button
              id="authorize-action-btn"
              onClick={handleAuthorize}
              disabled={!isWalletConnected || isProcessing || !requestedAmount || !budget}
              className="btn-neon w-full"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: 'white' }} />
                  {proof.status === 'generating' ? 'Generating ZK Proof...' : 'Submitting to Network...'}
                </span>
              ) : (
                'Authorize with ZK Proof'
              )}
            </button>
          </div>
        )}

        {/* ── Revoke Tab ── */}
        {activeTab === 'revoke' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Agent Secret Key{' '}
                <span className="text-purple-400 ml-1 font-mono">(Proves ownership)</span>
              </label>
              <input
                id="revoke-secret-key"
                type="text"
                value={revokeKey}
                onChange={(e) => setRevokeKey(e.target.value)}
                placeholder="Enter the agent's secret key to prove ownership..."
                className="input-neon"
                disabled={!isWalletConnected || isProcessing}
              />
              <p className="text-xs text-slate-500 mt-1">
                The ZK proof verifies you know the key without revealing it on-chain.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-red-900/10 border border-red-500/20 text-xs text-red-400">
              ⚠️ Revoking an agent is irreversible. The agent_count will be decremented on-chain.
            </div>

            <button
              id="revoke-agent-btn"
              onClick={handleRevoke}
              disabled={!isWalletConnected || isProcessing || !revokeKey}
              className="w-full py-3 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: '#ef4444' }} />
                  {proof.status === 'generating' ? 'Generating Revocation Proof...' : 'Submitting...'}
                </span>
              ) : (
                'Revoke Agent'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Proof Status Panel */}
      {proof.status !== 'idle' && (
        <div className={`card animate-fade-in ${getProofPanelClass(proof.status)}`}>
          <div className="flex items-start gap-3">
            <ProofStatusIcon status={proof.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{getProofStatusLabel(proof.status)}</span>
                {proof.timestamp && (
                  <span className="text-xs opacity-60">{new Date(proof.timestamp).toLocaleTimeString()}</span>
                )}
              </div>

              {proof.message && (
                <p className="text-sm opacity-80">{proof.message}</p>
              )}
              {proof.error && (
                <p className="text-sm text-red-300">{proof.error}</p>
              )}

              {proof.txHash && (
                <div className="mt-2 p-2 rounded bg-black/30 flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <a
                    href={getTxExplorerUrl(proof.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono underline hover:opacity-80 truncate"
                  >
                    Tx: {truncate(proof.txHash, 16, 8)}
                  </a>
                </div>
              )}

              {/* Processing animation */}
              {(proof.status === 'generating' || proof.status === 'submitting') && (
                <div className="mt-3 h-1 rounded-full bg-current/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-current animate-pulse"
                    style={{ width: proof.status === 'generating' ? '60%' : '90%', transition: 'width 0.5s ease' }}
                  />
                </div>
              )}
            </div>

            {(proof.status === 'verified' || proof.status === 'rejected' || proof.status === 'error') && (
              <button
                onClick={onResetProof}
                className="text-current/60 hover:text-current/90 transition-colors p-1 shrink-0"
                title="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: 'purple' | 'green' | 'red'
  icon: React.ReactNode
}) {
  const colors = {
    purple: 'text-purple-400 border-purple-500/20 bg-purple-900/10',
    green: 'text-green-400 border-green-500/20 bg-green-900/10',
    red: 'text-red-400 border-red-500/20 bg-red-900/10',
  }

  return (
    <div className={`glass card flex flex-col gap-2 border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="opacity-60">{icon}</div>
      </div>
      <div className="text-2xl font-bold font-mono tabular-nums">{value.toLocaleString()}</div>
    </div>
  )
}

function ProofStatusIcon({ status }: { status: ProofState['status'] }) {
  if (status === 'generating' || status === 'submitting') {
    return (
      <div className="shrink-0 mt-0.5">
        <div className="spinner" style={{ borderTopColor: 'currentColor' }} />
      </div>
    )
  }
  if (status === 'verified') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    )
  }
  if (status === 'rejected') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function getProofPanelClass(status: ProofState['status']): string {
  switch (status) {
    case 'generating':
    case 'submitting':
      return 'proof-generating'
    case 'verified':
      return 'proof-verified'
    case 'rejected':
      return 'proof-rejected'
    case 'error':
      return 'proof-rejected'
    default:
      return 'proof-pending'
  }
}

function getProofStatusLabel(status: ProofState['status']): string {
  switch (status) {
    case 'generating':
      return '⚡ Generating Zero-Knowledge Proof'
    case 'submitting':
      return '📡 Submitting to Midnight Preview'
    case 'verified':
      return '✅ ZK Proof Verified On-Chain'
    case 'rejected':
      return '❌ Authorization Rejected'
    case 'error':
      return '⚠️ Error'
    default:
      return ''
  }
}
