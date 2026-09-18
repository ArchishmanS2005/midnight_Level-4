/**
 * AgentPassport — Real Contract Action Test
 *
 * Tests authorize_action on the real deployed contract using:
 *  - indexerPublicDataProvider (official implementation backed by the Midnight indexer)
 *  - WalletFacade for DUST balancing
 *  - Local proof server for ZK proof generation
 *
 * Prerequisites:
 *   MIDNIGHT_WALLET_SEED env var must be set.
 *   Proof server must be running at localhost:6300.
 *
 * Run: tsx scripts/test_contract_call.ts
 */

import path from 'path';
import fs from 'fs';
import { mnemonicToSeedSync } from '@scure/bip39';
import {
  ZswapSecretKeys,
  DustSecretKey,
  LedgerParameters,
} from '@midnight-ntwrk/ledger-v8';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';

const seedPhrase = process.env.MIDNIGHT_WALLET_SEED;

if (!seedPhrase) {
  console.error('\n❌ ERROR: MIDNIGHT_WALLET_SEED environment variable is not set!');
  process.exit(1);
}

const deployedAddressFile = path.resolve('managed/deployed_address.txt');
const defaultAddress = fs.existsSync(deployedAddressFile)
  ? fs.readFileSync(deployedAddressFile, 'utf-8').trim()
  : '4ec57e9b77711da44ecfe6d2dd5be638fcb14832b8821290dce4f04561add3a4';

const NETWORK_CONFIG = {
  network: 'preview',
  nodeUrl: process.env.MIDNIGHT_RPC_URL || 'https://rpc.preview.midnight.network',
  indexerUrl: process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
  contractAddress: process.env.MIDNIGHT_CONTRACT_ADDRESS || defaultAddress,
};

async function main() {
  console.log('--------------------------------------------------');
  console.log('🚀 AgentPassport — Real Contract Action Test');
  console.log('--------------------------------------------------');
  console.log(`🌐 Target Contract: ${NETWORK_CONFIG.contractAddress}`);
  console.log('--------------------------------------------------\n');

  // ── Load compiled contract module ────────────────────────────────────────
  const managedPath = path.resolve('managed/contract/index.js');
  const { pathToFileURL } = await import('url');
  const compiledContractModule = await import(pathToFileURL(managedPath).href);

  // ── Import Midnight SDK modules ───────────────────────────────────────────
  const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
  const { make: makeCompiledContract, withWitnesses } = await import('@midnight-ntwrk/compact-js/effect/CompiledContract');
  const { indexerPublicDataProvider } = await import('@midnight-ntwrk/midnight-js-indexer-public-data-provider');

  setNetworkId(NETWORK_CONFIG.network as any);

  // ── Derive wallet keys from seed phrase ───────────────────────────────────
  console.log('🔑 Deriving wallet keys from seed phrase...');
  const bip39Seed = mnemonicToSeedSync(seedPhrase.trim());
  const hdResult = HDWallet.fromSeed(bip39Seed);
  if (hdResult.type !== 'seedOk') throw new Error('Invalid seed phrase');

  const account = hdResult.hdWallet.selectAccount(0);
  const compositeKey = account.selectRoles([Roles.Dust, Roles.Zswap] as const);
  const derivedKeys = compositeKey.deriveKeysAt(0);
  if (derivedKeys.type !== 'keysDerived') throw new Error('HD Key derivation failed');

  const zswapSecretKeys = ZswapSecretKeys.fromSeed(derivedKeys.keys[Roles.Zswap]);
  const dustSecretKey = DustSecretKey.fromSeed(derivedKeys.keys[Roles.Dust]);
  const coinPublicKey = zswapSecretKeys.coinPublicKey;
  hdResult.hdWallet.clear();

  // ── Initialize WalletFacade (for DUST balancing) ──────────────────────────
  console.log('🔄 Initializing Wallet SDK & Syncing with Indexer...');
  const { DustWallet } = await import('@midnight-ntwrk/wallet-sdk-dust-wallet');
  const { ShieldedWallet } = await import('@midnight-ntwrk/wallet-sdk-shielded');
  const { UnshieldedWallet, createKeystore, PublicKey } = await import('@midnight-ntwrk/wallet-sdk-unshielded-wallet');
  const { WalletFacade } = await import('@midnight-ntwrk/wallet-sdk-facade');
  const { InMemoryTransactionHistoryStorage } = await import('@midnight-ntwrk/wallet-sdk-abstractions');

  const walletConfig = {
    networkId: NETWORK_CONFIG.network as any,
    costParameters: { feeBlocksMargin: 5, additionalFeeOverhead: 0n },
    provingServerUrl: new URL(NETWORK_CONFIG.proofServerUrl),
    relayURL: new URL(NETWORK_CONFIG.nodeUrl.replace('https://', 'wss://').replace('http://', 'ws://')),
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexerUrl,
      indexerWsUrl: NETWORK_CONFIG.indexerWsUrl,
    },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  const dustParams = LedgerParameters.initialParameters().dust;
  const snapshotFile = path.resolve('managed/dust_wallet_state.json');
  const dustWalletClass = DustWallet(walletConfig as any);

  let dustWallet: any;
  if (fs.existsSync(snapshotFile)) {
    try {
      dustWallet = dustWalletClass.restore(fs.readFileSync(snapshotFile, 'utf-8'));
    } catch (_) {
      dustWallet = dustWalletClass.startWithSecretKey(dustSecretKey as any, dustParams as any);
    }
  } else {
    dustWallet = dustWalletClass.startWithSecretKey(dustSecretKey as any, dustParams as any);
  }

  const shieldedWallet = ShieldedWallet(walletConfig as any).startWithSeed(derivedKeys.keys[Roles.Zswap]);
  const unshieldedKeystore = createKeystore(derivedKeys.keys[Roles.Zswap], walletConfig.networkId);
  const unshieldedWallet = UnshieldedWallet(walletConfig as any).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));

  const facade = await WalletFacade.init({
    configuration: walletConfig as any,
    shielded: () => shieldedWallet,
    unshielded: () => unshieldedWallet,
    dust: () => dustWallet,
  });

  console.log('⏳ Syncing Dust UTXOs from Midnight Preview Indexer...');
  await facade.start(zswapSecretKeys as any, dustSecretKey as any);

  await new Promise<void>((resolve) => {
    const sub = dustWallet.state.subscribe({
      next: (state: any) => {
        const rawBal = state.balance ? state.balance(new Date()) : 0n;
        const balVal = typeof rawBal === 'bigint' ? rawBal : BigInt((rawBal as any)?.totalBalance ?? rawBal ?? 0);
        if (balVal > 0n) {
          console.log(`✅ Dust balance confirmed: ${balVal} tDUST`);
          sub.unsubscribe();
          resolve();
        }
      },
    });
    setTimeout(() => { sub.unsubscribe(); resolve(); }, 20000);
  });

  // ── Build providers ───────────────────────────────────────────────────────

  // REAL public data provider: queries the actual Midnight indexer for chain state.
  // This properly deserializes ContractState/ZswapChainState from on-chain data,
  // including all internal fields (QueryContext, etc.) needed by the compact runtime.
  const publicDataProvider = indexerPublicDataProvider(
    NETWORK_CONFIG.indexerUrl,
    NETWORK_CONFIG.indexerWsUrl,
  );

  const walletProvider = {
    balanceTx: async (tx: any) => {
      console.log('⚖️ Balancing transaction with Dust UTXOs...');
      const balanced = await facade.balanceTransaction(tx);
      console.log('✅ Transaction balanced & signed!');
      return balanced;
    },
    getCoinPublicKey: () => coinPublicKey,
    getEncryptionPublicKey: () => zswapSecretKeys.encryptionPublicKey,
  };

  const proofProvider = {
    proveTx: async (unprovenTx: any) => {
      console.log('⚡ Generating ZK proof with local Proof Server (localhost:6300)...');
      const response = await fetch(`${NETWORK_CONFIG.proofServerUrl}/prove/tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unprovenTx),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Proof server returned status ${response.status}: ${text}`);
      }
      const data = await response.arrayBuffer();
      return new Uint8Array(data);
    },
  };

  const zkConfigProvider = {
    getZKIR: async (cId: string) => {
      const p = path.resolve(`managed/zkir/${cId}.zkir`);
      return new Uint8Array(fs.readFileSync(p));
    },
    getProverKey: async (cId: string) => {
      const p = path.resolve(`managed/keys/${cId}.prover`);
      return new Uint8Array(fs.readFileSync(p));
    },
    getVerifierKey: async (cId: string) => {
      const p = path.resolve(`managed/keys/${cId}.verifier`);
      return new Uint8Array(fs.readFileSync(p));
    },
    getVerifierKeys: async (cIds: string[]) => {
      return Promise.all(cIds.map(async (id) => [id, await zkConfigProvider.getVerifierKey(id)]));
    },
  };

  const privateStateProvider = {
    setContractAddress: () => {},
    get: async () => null,
    set: async () => {},
    remove: async () => {},
    clear: async () => {},
    setSigningKey: async () => {},
    getSigningKey: async () => null,
    removeSigningKey: async () => {},
    clearSigningKeys: async () => {},
    exportPrivateStates: async () => ({} as any),
    importPrivateStates: async () => ({} as any),
    exportSigningKeys: async () => ({} as any),
    importSigningKeys: async () => ({} as any),
  };

  const midnightProvider = {
    submitTx: async (tx: any) => {
      console.log('📡 Submitting transaction to Midnight Preview node...');
      const subEvent = await facade.submissionService.submitTransaction(tx, 'InBlock' as any);
      const txId = subEvent?.txHash || subEvent?.blockHash
        || (typeof tx.identifiers === 'function' ? tx.identifiers().at(-1) : null);
      console.log(`✅ Transaction accepted InBlock! txHash: ${txId}`);
      return txId;
    },
  };

  const providers = {
    privateStateProvider,
    publicDataProvider: publicDataProvider as any,
    zkConfigProvider: zkConfigProvider as any,
    proofProvider,
    walletProvider,
    midnightProvider,
  };

  // ── Witness values ────────────────────────────────────────────────────────
  // These are the private inputs for authorize_action.
  // agent_secret_key / credential_hash can be any valid 32-byte arrays for testing.
  const secretKey = new Uint8Array(32).fill(0);
  secretKey[0] = 42;
  const credentialHash = new Uint8Array(32).fill(0);
  credentialHash[0] = 99;

  const witnessInstance = {
    agent_secret_key: () => secretKey,
    permission_budget: () => 500n,
    credential_hash: () => credentialHash,
  };

  // ── Build compiled contract ───────────────────────────────────────────────
  const baseCompiledContract = makeCompiledContract('agentpassport', compiledContractModule.Contract);
  const compiledContract = withWitnesses(baseCompiledContract, witnessInstance);

  // ── Find deployed contract ────────────────────────────────────────────────
  console.log(`🔍 Finding deployed contract at ${NETWORK_CONFIG.contractAddress}...`);
  const foundContract = await findDeployedContract(providers as any, {
    compiledContract: compiledContract as any,
    contractAddress: NETWORK_CONFIG.contractAddress,
  });
  console.log('✅ Contract found on-chain!');

  // ── Call authorize_action ─────────────────────────────────────────────────
  console.log('⚡ Calling authorize_action(requested_amount = 150n)...');
  const result = await foundContract.callTx.authorize_action(150n);

  console.log('\n==================================================');
  console.log('🎉 REAL ACTION TRANSACTION SUBMITTED & CONFIRMED ON-CHAIN!');
  console.log(`Contract Address: ${NETWORK_CONFIG.contractAddress}`);
  console.log(`Transaction Hash: ${result.public.txHash}`);
  console.log(`Explorer Link:   https://explorer.preview.midnight.network/tx/${result.public.txHash}`);
  console.log('==================================================\n');

  await Promise.all([dustWallet.stop?.(), unshieldedWallet.stop?.()]).catch(() => {});
}

main().catch((err) => {
  console.error('\n❌ ERROR EXECUTING CONTRACT ACTION:');
  console.error(err);
  process.exit(1);
});
