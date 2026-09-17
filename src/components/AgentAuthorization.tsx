import { useState } from 'react'
import { ProofState, ContractStats } from '../hooks/useMidnight'
import { generateSecretKey, bytesToHex, hashCredential, getTxExplorerUrl, truncate } from '../utils/contract'

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

  // Form states
  const [secretKey, setSecretKey] = useState('')
  const [credential, setCredential] = useState('')
  const [requestedAmount, setRequestedAmount] = useState('')
  const [budget, setBudget] = useState('')
  const [revokeKey, setRevokeKey] = useState('')

  const isProcessing = proof.status === 'generating' || proof.status === 'submitting'

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

  const tabs: { id: ActionTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'register',
      label: 'Register Agent',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'authorize',
      label: 'Authorize Action',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      id: 'revoke',
      label: 'Revoke Agent',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Registered Agents"
          value={stats.agentCount}
          type="white"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          type="emerald"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          }
        />
        <StatCard
          label="Rejected Actions"
          value={stats.totalRejections}
          type="rose"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Main Operations Card */}
      <div className="glass-card">
        {/* Segmented Pill Tabs */}
        <div className="flex gap-1.5 p-1.5 rounded-full bg-black/70 border border-white/10 mb-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id)
                  onResetProof()
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-heading transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Privacy Active Banner */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-xs flex items-start gap-3">
          <div className="p-1 rounded-md bg-white/10 text-white shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="text-neutral-300 font-body leading-relaxed">
            <strong className="text-white font-heading">ZK Privacy Engine Active:</strong> Secrets, budgets, and credentials remain private on your device. Only verified cryptographic proofs are submitted to Midnight Preview.
          </div>
        </div>

        {/* Disabled Overlay Warning if Wallet Disconnected */}
        {!isWalletConnected && (
          <div className="mb-6 p-4 rounded-xl proof-pending text-xs text-center font-heading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mb-1 mr-1">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Connect your wallet above to interact with the AgentPassport contract
          </div>
        )}

        {/* ── REGISTER TAB ── */}
        {activeTab === 'register' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-heading font-medium text-white mb-2">
                Agent Secret Key <span className="text-neutral-400 font-mono font-normal">(Private — never on-chain)</span>
              </label>
              <div className="flex gap-2.5">
                <input
                  id="register-secret-key"
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter or generate a 32-byte hex secret key..."
                  className="input-neon flex-1"
                  disabled={!isWalletConnected || isProcessing}
                />
                <button
                  id="generate-key-btn"
                  onClick={handleGenerateKey}
                  disabled={!isWalletConnected || isProcessing}
                  className="btn-mainframe-outline text-xs px-4 shrink-0"
                >
                  Generate
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5 font-body">
                This is your agent's private identity. Store it securely — needed for authorization &amp; revocation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-white mb-2">
                Agent Credential <span className="text-neutral-400 font-mono font-normal">(Private — hashed locally)</span>
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
              <p className="text-[11px] text-neutral-400 mt-1.5 font-body">
                Hashed locally prior to proof generation. The original credential never leaves your device.
              </p>
            </div>

            <button
              id="register-agent-btn"
              onClick={handleRegister}
              disabled={!isWalletConnected || isProcessing || !secretKey || !credential}
              className="btn-mainframe-primary w-full py-3.5 mt-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: '#000000' }} />
                  <span>{proof.status === 'generating' ? 'Generating ZK Proof...' : 'Submitting to Network...'}</span>
                </span>
              ) : (
                'Register Agent with ZK Proof'
              )}
            </button>
          </div>
        )}

        {/* ── AUTHORIZE TAB ── */}
        {activeTab === 'authorize' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-heading font-medium text-white mb-2">
                Permission Budget (tDUST) <span className="text-neutral-400 font-mono font-normal">(Private — never revealed)</span>
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
              <p className="text-[11px] text-neutral-400 mt-1.5 font-body">
                Budget amount stays private. The ZK circuit proves sufficiency without exposing amount.
              </p>
            </div>

            <div>
              <label className="block text-xs font-heading font-medium text-white mb-2">
                Requested Action Amount (tDUST) <span className="text-neutral-400 font-mono font-normal">(Public — on-chain)</span>
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
              <p className="text-[11px] text-neutral-400 mt-1.5 font-body">
                Action cost is public. The circuit proves Budget ≥ Requested Amount.
              </p>
            </div>

            {/* Budget Preview Box */}
            {budget && requestedAmount && (
              <div className={`p-4 rounded-xl text-xs font-mono border ${
                parseInt(budget) >= parseInt(requestedAmount)
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
              }`}>
                <div className="font-heading font-semibold mb-1 uppercase tracking-wider text-[11px]">ZK Proof Verdict:</div>
                <div>
                  Budget ({parseInt(budget).toLocaleString()}) {parseInt(budget) >= parseInt(requestedAmount) ? '≥' : '<'}{' '}
                  Requested ({parseInt(requestedAmount).toLocaleString()}) →{' '}
                  <strong className="underline">{parseInt(budget) >= parseInt(requestedAmount) ? 'WILL AUTHORIZE' : 'WILL REJECT'}</strong>
                </div>
              </div>
            )}

            <button
              id="authorize-action-btn"
              onClick={handleAuthorize}
              disabled={!isWalletConnected || isProcessing || !requestedAmount || !budget}
              className="btn-mainframe-primary w-full py-3.5 mt-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: '#000000' }} />
                  <span>{proof.status === 'generating' ? 'Generating ZK Proof...' : 'Submitting to Network...'}</span>
                </span>
              ) : (
                'Authorize Action with ZK Proof'
              )}
            </button>
          </div>
        )}

        {/* ── REVOKE TAB ── */}
        {activeTab === 'revoke' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-heading font-medium text-white mb-2">
                Agent Secret Key <span className="text-neutral-400 font-mono font-normal">(Proves ownership)</span>
              </label>
              <input
                id="revoke-secret-key"
                type="text"
                value={revokeKey}
                onChange={(e) => setRevokeKey(e.target.value)}
                placeholder="Enter agent secret key to prove ownership..."
                className="input-neon"
                disabled={!isWalletConnected || isProcessing}
              />
              <p className="text-[11px] text-neutral-400 mt-1.5 font-body">
                The ZK proof verifies ownership without revealing key on-chain.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 font-body">
              ⚠️ Revocation is permanent. The agent count counter will be decremented on the Compact ledger.
            </div>

            <button
              id="revoke-agent-btn"
              onClick={handleRevoke}
              disabled={!isWalletConnected || isProcessing || !revokeKey}
              className="btn-mainframe-outline w-full py-3.5 text-rose-300 border-rose-500/40 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: '#ffffff' }} />
                  <span>Submitting Revocation...</span>
                </span>
              ) : (
                'Revoke Agent'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Proof Terminal Output Card */}
      {proof.status !== 'idle' && (
        <div className={`p-5 rounded-2xl border font-mono text-xs shadow-2xl animate-fade-in ${getProofPanelClass(proof.status)}`}>
          <div className="flex items-start gap-3">
            <ProofStatusIcon status={proof.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-heading font-semibold text-sm">{getProofStatusLabel(proof.status)}</span>
                {proof.timestamp && (
                  <span className="text-[11px] opacity-60">{new Date(proof.timestamp).toLocaleTimeString()}</span>
                )}
              </div>

              {proof.message && (
                <p className="opacity-90 leading-relaxed">{proof.message}</p>
              )}
              {proof.error && (
                <p className="text-rose-300 leading-relaxed">{proof.error}</p>
              )}

              {proof.txHash && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-white/10 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <a
                    href={getTxExplorerUrl(proof.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono underline hover:text-white truncate"
                  >
                    Tx Hash: {truncate(proof.txHash, 16, 8)}
                  </a>
                </div>
              )}
            </div>

            {(proof.status === 'verified' || proof.status === 'rejected' || proof.status === 'error') && (
              <button
                onClick={onResetProof}
                className="opacity-60 hover:opacity-100 transition-opacity p-1 shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

function StatCard({
  label,
  value,
  type,
  icon,
}: {
  label: string
  value: number
  type: 'white' | 'emerald' | 'rose'
  icon: React.ReactNode
}) {
  const styles = {
    white: 'border-white/15 bg-neutral-900/60 text-white',
    emerald: 'border-emerald-500/25 bg-emerald-950/20 text-emerald-400',
    rose: 'border-rose-500/25 bg-rose-950/20 text-rose-400',
  }

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col gap-2 ${styles[type]}`}>
      <div className="flex items-center justify-between text-neutral-400 font-heading text-xs">
        <span>{label}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="text-3xl sm:text-4xl font-heading font-medium tracking-tight text-white">{value.toLocaleString()}</div>
    </div>
  )
}

function ProofStatusIcon({ status }: { status: ProofState['status'] }) {
  if (status === 'generating' || status === 'submitting') {
    return (
      <div className="shrink-0 mt-0.5">
        <div className="spinner" style={{ borderTopColor: '#ffffff' }} />
      </div>
    )
  }
  if (status === 'verified') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" className="shrink-0 mt-0.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    )
  }
  if (status === 'rejected') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" className="shrink-0 mt-0.5">
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
