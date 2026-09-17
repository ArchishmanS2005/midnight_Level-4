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
    <div className="glass-card animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-neutral-900 border border-white/20 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="5" width="22" height="14" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {isConnected && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-heading font-medium text-white">Lace Wallet</h3>
            <p className="text-xs text-neutral-400 font-body">Midnight Preview Network</p>
          </div>
        </div>

        {/* Status badge */}
        <StatusBadge status={wallet.status} />
      </div>

      {/* Wallet Info (connected) */}
      {isConnected && wallet.address && (
        <div className="mb-5 p-3.5 rounded-xl bg-black/60 border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-heading text-emerald-400 font-semibold uppercase tracking-wider">Connected</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-body">Address</span>
              <span className="font-mono text-white font-medium">{truncate(wallet.address, 12, 8)}</span>
            </div>
            {wallet.networkId && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-body">Network</span>
                <span className="font-mono text-neutral-200">{wallet.networkId}</span>
              </div>
            )}
            {wallet.balance && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 font-body">Balance</span>
                <span className="font-mono text-white font-medium">{wallet.balance}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {isError && wallet.error && (
        <div className="mb-5 p-3.5 rounded-xl proof-rejected text-xs">
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{wallet.error}</span>
          </div>
        </div>
      )}

      {/* Not installed warning */}
      {isNotInstalled && (
        <div className="mb-5 p-3.5 rounded-xl proof-pending text-xs">
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
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
                className="underline hover:text-white transition-colors"
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
            className="btn-mainframe-primary w-full py-3"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <div className="spinner w-4 h-4 border-2" style={{ borderTopColor: '#000000' }} />
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {isNotInstalled ? 'Connect (Demo Mode)' : 'Connect Lace Wallet'}
              </span>
            )}
          </button>
        ) : (
          <button
            id="wallet-disconnect-btn"
            onClick={onDisconnect}
            className="btn-mainframe-outline w-full py-2.5 text-xs"
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Disconnect
            </span>
          </button>
        )}
      </div>

      {/* Privacy Guarantee Note */}
      <p className="text-[11px] text-neutral-400 mt-3.5 text-center font-body">
        🔒 Private data &amp; keys never leave your device
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: WalletState['status'] }) {
  const configs = {
    'not-installed': { label: 'NOT FOUND', className: 'proof-rejected' },
    'disconnected': { label: 'DISCONNECTED', className: 'bg-neutral-800/80 border border-neutral-700 text-neutral-300' },
    'connecting': { label: 'CONNECTING', className: 'proof-generating' },
    'connected': { label: 'CONNECTED', className: 'proof-verified' },
    'error': { label: 'ERROR', className: 'proof-rejected' },
  }
  const { label, className } = configs[status]
  return <span className={`badge ${className}`}>{label}</span>
}
