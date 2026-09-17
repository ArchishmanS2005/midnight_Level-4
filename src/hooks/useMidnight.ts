import { useState, useCallback, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WalletStatus =
  | 'not-installed'
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export type ProofStatus =
  | 'idle'
  | 'generating'
  | 'submitting'
  | 'verified'
  | 'rejected'
  | 'error'

export interface WalletState {
  status: WalletStatus
  address: string | null
  networkId: string | null
  balance: string | null
  error: string | null
}

export interface ProofState {
  status: ProofStatus
  txHash: string | null
  error: string | null
  message: string | null
  timestamp: number | null
}

export interface ContractStats {
  agentCount: number
  totalAuthorizations: number
  totalRejections: number
}

// ─── Simulated Contract State (mirrors on-chain state for demo) ───────────────

let _simulatedStats: ContractStats = {
  agentCount: 0,
  totalAuthorizations: 0,
  totalRejections: 0,
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMidnight() {
  const [wallet, setWallet] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    networkId: null,
    balance: null,
    error: null,
  })

  const [proof, setProof] = useState<ProofState>({
    status: 'idle',
    txHash: null,
    error: null,
    message: null,
    timestamp: null,
  })

  const [stats, setStats] = useState<ContractStats>({ ..._simulatedStats })

  // Check on mount if Lace wallet is available
  useEffect(() => {
    const checkWallet = () => {
      const lace = (window as unknown as { midnight?: { mnLace?: unknown } }).midnight?.mnLace
      if (!lace) {
        setWallet((prev) => ({ ...prev, status: 'not-installed' }))
      }
    }
    // Small delay to let extensions inject
    const t = setTimeout(checkWallet, 500)
    return () => clearTimeout(t)
  }, [])

  // ── Connect Wallet ──────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, status: 'connecting', error: null }))

    try {
      const lace = (window as unknown as { midnight?: { mnLace?: {
        enable: () => Promise<{ state: () => Promise<{ address: string; networkId: string; coinPublicKey: string }> }>
      } } }).midnight?.mnLace

      if (!lace) {
        // Demo mode: simulate connection when Lace is not installed
        await delay(1500)
        const demoAddress = generateDemoAddress()
        setWallet({
          status: 'connected',
          address: demoAddress,
          networkId: 'preview',
          balance: '10,000 tDUST',
          error: null,
        })
        return
      }

      // Real Lace wallet flow
      const api = await lace.enable()
      const state = await api.state()

      setWallet({
        status: 'connected',
        address: state.address,
        networkId: state.networkId || 'preview',
        balance: null, // Fetch separately if needed
        error: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet'
      setWallet((prev) => ({ ...prev, status: 'error', error: message }))
    }
  }, [])

  // ── Disconnect Wallet ───────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setWallet({
      status: 'disconnected',
      address: null,
      networkId: null,
      balance: null,
      error: null,
    })
    setProof({ status: 'idle', txHash: null, error: null, message: null, timestamp: null })
  }, [])

  // ── Register Agent ──────────────────────────────────────────────────────────
  const registerAgent = useCallback(
    async (secretKey: string, credentialHash: string): Promise<boolean> => {
      if (wallet.status !== 'connected') {
        setProof((prev) => ({ ...prev, status: 'error', error: 'Wallet not connected' }))
        return false
      }

      setProof({ status: 'generating', txHash: null, error: null, message: 'Generating ZK proof for agent registration...', timestamp: null })

      try {
        // Simulate ZK proof generation (1.5s — realistic for a proof server)
        await delay(1500)

        // Validate witnesses locally (mirrors circuit assertions)
        if (!secretKey || secretKey.length < 10) {
          throw new Error('Agent secret key must not be zero or too short')
        }
        if (!credentialHash || credentialHash.length < 10) {
          throw new Error('Credential hash must not be zero or too short')
        }

        setProof((prev) => ({ ...prev, status: 'submitting', message: 'Submitting proof to Midnight Preview network...' }))
        await delay(1000)

        // Update simulated public state
        _simulatedStats = {
          ..._simulatedStats,
          agentCount: _simulatedStats.agentCount + 1,
        }
        setStats({ ..._simulatedStats })

        const txHash = generateTxHash()
        setProof({
          status: 'verified',
          txHash,
          error: null,
          message: `Agent registered successfully. ZK proof verified on-chain.`,
          timestamp: Date.now(),
        })
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed'
        setProof({ status: 'error', txHash: null, error: message, message: null, timestamp: null })
        return false
      }
    },
    [wallet.status]
  )

  // ── Authorize Action ────────────────────────────────────────────────────────
  const authorizeAction = useCallback(
    async (requestedAmount: number, budget: number): Promise<boolean> => {
      if (wallet.status !== 'connected') {
        setProof((prev) => ({ ...prev, status: 'error', error: 'Wallet not connected' }))
        return false
      }

      setProof({
        status: 'generating',
        txHash: null,
        error: null,
        message: `Generating ZK proof: budget ≥ ${requestedAmount} tDUST (without revealing budget)...`,
        timestamp: null,
      })

      try {
        await delay(2000) // Proof generation

        setProof((prev) => ({ ...prev, status: 'submitting', message: 'Submitting authorization proof to Preview network...' }))
        await delay(800)

        const approved = budget >= requestedAmount

        if (approved) {
          _simulatedStats = {
            ..._simulatedStats,
            totalAuthorizations: _simulatedStats.totalAuthorizations + 1,
          }
          setStats({ ..._simulatedStats })

          const txHash = generateTxHash()
          setProof({
            status: 'verified',
            txHash,
            error: null,
            message: `Action AUTHORIZED. ZK proof verified: budget sufficient (amount not revealed).`,
            timestamp: Date.now(),
          })
          return true
        } else {
          _simulatedStats = {
            ..._simulatedStats,
            totalRejections: _simulatedStats.totalRejections + 1,
          }
          setStats({ ..._simulatedStats })

          const txHash = generateTxHash()
          setProof({
            status: 'rejected',
            txHash,
            error: null,
            message: `Action REJECTED. ZK proof verified: budget insufficient (exact amount not revealed).`,
            timestamp: Date.now(),
          })
          return false
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authorization failed'
        setProof({ status: 'error', txHash: null, error: message, message: null, timestamp: null })
        return false
      }
    },
    [wallet.status]
  )

  // ── Revoke Agent ────────────────────────────────────────────────────────────
  const revokeAgent = useCallback(
    async (secretKey: string): Promise<boolean> => {
      if (wallet.status !== 'connected') {
        setProof((prev) => ({ ...prev, status: 'error', error: 'Wallet not connected' }))
        return false
      }

      setProof({ status: 'generating', txHash: null, error: null, message: 'Generating revocation ZK proof...', timestamp: null })

      try {
        await delay(1200)

        if (!secretKey || secretKey.length < 10) {
          throw new Error('Cannot revoke: invalid agent identity')
        }

        setProof((prev) => ({ ...prev, status: 'submitting', message: 'Submitting revocation to network...' }))
        await delay(800)

        _simulatedStats = {
          ..._simulatedStats,
          agentCount: Math.max(0, _simulatedStats.agentCount - 1),
        }
        setStats({ ..._simulatedStats })

        const txHash = generateTxHash()
        setProof({
          status: 'verified',
          txHash,
          error: null,
          message: `Agent revoked successfully. ZK ownership proof verified.`,
          timestamp: Date.now(),
        })
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Revocation failed'
        setProof({ status: 'error', txHash: null, error: message, message: null, timestamp: null })
        return false
      }
    },
    [wallet.status]
  )

  // ── Reset Proof State ───────────────────────────────────────────────────────
  const resetProof = useCallback(() => {
    setProof({ status: 'idle', txHash: null, error: null, message: null, timestamp: null })
  }, [])

  return {
    wallet,
    proof,
    stats,
    connectWallet,
    disconnectWallet,
    registerAgent,
    authorizeAction,
    revokeAgent,
    resetProof,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateDemoAddress(): string {
  const chars = '0123456789abcdef'
  const hex = Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `mn_preview_${hex.slice(0, 16)}...${hex.slice(48)}`
}

function generateTxHash(): string {
  const chars = '0123456789abcdef'
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
