import { WalletState } from '../hooks/useMidnight'
import { truncate } from '../utils/contract'

interface WalletConnectProps {
  wallet: WalletState
  onConnect: () => void
  onDisconnect: () => void
}

export default function WalletConnect({ wallet, onConnect, onDisconnect }: WalletConnectProps) {
  const isConnecting = wallet.status === 'connecting'
  const isConnected = wallet.status === 'connected'
  const isError = wallet.status === 'error'
  const isNotInstalled = wallet.status === 'not-installed'

  return (
    <div className="glass card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="5" width="22" height="14" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            {isConnected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-midnight-950 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Lace Wallet</h2>
            <p className="text-xs text-slate-400">Midnight Preview Network</p>
          </div>
        </div>

        {/* Status badge */}
        <StatusBadge status={wallet.status} />
      </div>

      {/* Wallet Info (connected) */}
      {isConnected && wallet.address && (
        <div className="mb-4 p-3 rounded-lg bg-midnight-950/60 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Connected</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Address</span>
              <span className="text-xs font-mono text-slate-200">{truncate(wallet.address, 12, 8)}</span>
            </div>
            {wallet.networkId && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Network</span>
                <span className="text-xs font-mono text-cyan-400">{wallet.networkId}</span>
              </div>
            )}
            {wallet.balance && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Balance</span>
                <span className="text-xs font-mono text-purple-300">{wallet.balance}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {isError && wallet.error && (
        <div className="mb-4 p-3 rounded-lg proof-rejected text-sm">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{wallet.error}</span>
          </div>
        </div>
      )}

      {/* Not installed message */}
      {isNotInstalled && (
        <div className="mb-4 p-3 rounded-lg proof-pending text-sm">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Lace wallet not detected.{' '}
              <a
                href="https://www.lace.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-yellow-300 transition-colors"
              >
                Install Lace
              </a>{' '}
              or continue in demo mode.
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isConnected ? (
          <button
            id="wallet-connect-btn"
            onClick={onConnect}
            disabled={isConnecting}
            className="btn-neon flex-1 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: 'white' }} />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {isNotInstalled ? 'Connect (Demo Mode)' : 'Connect Lace Wallet'}
              </>
            )}
          </button>
        ) : (
          <button
            id="wallet-disconnect-btn"
            onClick={onDisconnect}
            className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Disconnect
          </button>
        )}
      </div>

      {/* Privacy note */}
      <p className="text-xs text-slate-500 mt-3 text-center">
        🔒 Your keys and private data never leave your device
      </p>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WalletState['status'] }) {
  const configs = {
    'not-installed': { label: 'Not Found', className: 'proof-rejected' },
    'disconnected': { label: 'Disconnected', className: 'bg-slate-700/50 border-slate-600/30 text-slate-400 border' },
    'connecting': { label: 'Connecting...', className: 'proof-generating' },
    'connected': { label: 'Connected', className: 'proof-verified' },
    'error': { label: 'Error', className: 'proof-rejected' },
  }
  const { label, className } = configs[status]
  return <span className={`badge ${className}`}>{label}</span>
}
