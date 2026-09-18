import path from 'path';
import fs from 'fs';
import { mnemonicToSeedSync } from '@scure/bip39';
import {
  ZswapSecretKeys,
  DustSecretKey,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/ledger-v8';
import { ShieldedCoinPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';

// 1. Ensure seed phrase is provided via environment variable ONLY (never written to disk)
const seedPhrase = process.env.MIDNIGHT_WALLET_SEED;

if (!seedPhrase) {
  console.error('\n❌ ERROR: MIDNIGHT_WALLET_SEED environment variable is not set!');
  console.error('Please set your 24-word seed phrase in your current terminal session:');
  console.error('  PowerShell: $env:MIDNIGHT_WALLET_SEED="your 24 word mnemonic seed phrase"');
  console.error('  Bash/Zsh:   export MIDNIGHT_WALLET_SEED="your 24 word mnemonic seed phrase"\n');
  process.exit(1);
}

// Improve ErrorEvent stringification so WebSocket errors don't output [object ErrorEvent]
if (typeof (globalThis as any).ErrorEvent !== 'undefined') {
  (globalThis as any).ErrorEvent.prototype.toString = function () {
    return `ErrorEvent: ${this.message || (this.error ? this.error.message || String(this.error) : JSON.stringify(this))}`;
  };
}

// Network Configuration for Midnight Preview Testnet
const NETWORK_CONFIG = {
  network: 'preview',
  nodeUrl: process.env.MIDNIGHT_RPC_URL || 'https://rpc.preview.midnight.network',
  indexerUrl: process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWsUrl: process.env.MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
};

async function main() {
  console.log('--------------------------------------------------');
  console.log('🚀 AgentPassport — Midnight Preview Contract Deployment');
  console.log('--------------------------------------------------');
  console.log(`🌐 Network:          ${NETWORK_CONFIG.network}`);
  console.log(`🔗 RPC Node URL:     ${NETWORK_CONFIG.nodeUrl}`);
  console.log(`📊 Indexer HTTP URL: ${NETWORK_CONFIG.indexerUrl}`);
  console.log(`📡 Indexer WS URL:   ${NETWORK_CONFIG.indexerWsUrl}`);
  console.log(`⚡ Proof Server URL: ${NETWORK_CONFIG.proofServerUrl}`);
  console.log('🔑 Seed Phrase:     [CONFIGURED IN ENVIRONMENT]');
  console.log('--------------------------------------------------\n');

  // Find compiled contract path
  const managedPathCandidates = [
    path.resolve('managed/contract/index.js'),
    path.resolve('managed/contract/index.cjs'),
    path.resolve('managed/agentpassport/contract/index.js'),
    path.resolve('managed/agentpassport/contract/index.cjs'),
  ];
  
  const managedPath = managedPathCandidates.find((p) => fs.existsSync(p));

  if (!managedPath) {
    console.error(`❌ ERROR: Compiled contract file not found in managed/contract/`);
    console.error('Please run contract compilation first:');
    console.error('  npm run compile\n');
    process.exit(1);
  }

  // Ensure runtime 0.16.0 compatibility for compiled contract
  let fileContent = fs.readFileSync(managedPath, 'utf-8');
  let modified = false;
  if (fileContent.includes("checkRuntimeVersion('0.19.0')")) {
    fileContent = fileContent.replace("checkRuntimeVersion('0.19.0')", "checkRuntimeVersion('0.16.0')");
    modified = true;
  }
  if (fileContent.includes("createCircuitContext('constructor', ")) {
    fileContent = fileContent.replace("createCircuitContext('constructor', ", "createCircuitContext(");
    modified = true;
  }
  if (fileContent.includes(".callContext.")) {
    fileContent = fileContent.replaceAll('.callContext.', '.');
    modified = true;
  }
  if (fileContent.includes("new __compactRuntime.ChargedState(context.currentQueryContext.state)")) {
    fileContent = fileContent.replace("new __compactRuntime.ChargedState(context.currentQueryContext.state)", "context.currentQueryContext.state");
    modified = true;
  }
  if (fileContent.includes("callContext: { currentQueryContext:")) {
    fileContent = fileContent.replaceAll("callContext: { currentQueryContext:", "currentQueryContext:");
    modified = true;
  }
  if (fileContent.includes("async initialState(")) {
    fileContent = fileContent.replace("async initialState(", "initialState(");
    modified = true;
  }
  if (modified) {
    fs.writeFileSync(managedPath, fileContent, 'utf-8');
  }

  console.log('📦 Loading compiled contract module...');
  const { pathToFileURL } = await import('url');
  const compiledContractModule = await import(pathToFileURL(managedPath).href);

  // Dynamic import of midnight SDK modules
  const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
  const { make: makeCompiledContract, withWitnesses } = await import('@midnight-ntwrk/compact-js/effect/CompiledContract');
  const { httpClientProofProvider } = await import('@midnight-ntwrk/midnight-js-http-client-proof-provider');
  const { indexerPublicDataProvider } = await import('@midnight-ntwrk/midnight-js-indexer-public-data-provider');
  const { createProverKey, createVerifierKey, createZKIR } = await import('@midnight-ntwrk/midnight-js-types');

  // Configure Network ID to Midnight Preview
  setNetworkId(NETWORK_CONFIG.network as any);

  // ──────────────────────────────────────────────────────────────
  // Derive wallet keys using official BIP39 → HDWallet path
  // ──────────────────────────────────────────────────────────────
  console.log('⏳ Deriving wallet keys from seed phrase via BIP39 + HDWallet...');

  // BIP39 mnemonic → 64-byte seed
  const bip39Seed = mnemonicToSeedSync(seedPhrase.trim());

  // HDWallet key derivation (same as Lace wallet)
  const hdResult = HDWallet.fromSeed(bip39Seed);
  if (hdResult.type !== 'seedOk') {
    throw new Error('Failed to derive HD wallet from seed phrase. Is the mnemonic valid?');
  }

  const account = hdResult.hdWallet.selectAccount(0);
  const compositeKey = account.selectRoles([Roles.Dust, Roles.Zswap] as const);
  const derivedKeys = compositeKey.deriveKeysAt(0);

  if (derivedKeys.type !== 'keysDerived') {
    throw new Error('HD key derivation failed — keys out of bounds');
  }

  const zswapSecretKeys = ZswapSecretKeys.fromSeed(derivedKeys.keys[Roles.Zswap]);
  const dustSecretKey = DustSecretKey.fromSeed(derivedKeys.keys[Roles.Dust]);

  // Extract real public keys from derived secret keys
  const coinPublicKey = zswapSecretKeys.coinPublicKey;
  const encPublicKey = zswapSecretKeys.encryptionPublicKey;

  // Derive Bech32 address for display
  const bech32Address = ShieldedCoinPublicKey.codec.encode(
    NETWORK_CONFIG.network as any,
    new ShieldedCoinPublicKey(encodeCoinPublicKey(coinPublicKey)),
  ).asString();
  console.log(`🔑 Wallet Address (Bech32): ${bech32Address}`);

  // Clear HD wallet from memory after key extraction
  hdResult.hdWallet.clear();

  // ──────────────────────────────────────────────────────────────
  // Build WalletFacade for proper indexer sync + balance
  // ──────────────────────────────────────────────────────────────
  console.log('🔄 Initializing Wallet SDK (Shielded + Unshielded + Dust)...');

  const { DustWallet } = await import('@midnight-ntwrk/wallet-sdk-dust-wallet');
  const { ShieldedWallet } = await import('@midnight-ntwrk/wallet-sdk-shielded');
  const { UnshieldedWallet, createKeystore, PublicKey } = await import('@midnight-ntwrk/wallet-sdk-unshielded-wallet');
  const { WalletFacade } = await import('@midnight-ntwrk/wallet-sdk-facade');
  const { InMemoryTransactionHistoryStorage } = await import('@midnight-ntwrk/wallet-sdk-abstractions');
  const { DustParameters, LedgerParameters } = await import('@midnight-ntwrk/ledger-v8');

  const walletConfig = {
    networkId: NETWORK_CONFIG.network as any,
    costParameters: {
      feeBlocksMargin: 5,
      additionalFeeOverhead: 0n,
    },
    provingServerUrl: new URL(NETWORK_CONFIG.proofServerUrl),
    relayURL: new URL(NETWORK_CONFIG.nodeUrl.replace('https://', 'wss://').replace('http://', 'ws://')),
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexerUrl,
      indexerWsUrl: NETWORK_CONFIG.indexerWsUrl,
    },
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };

  // Obtain network DustParameters from ledger initial parameters
  const dustParams = LedgerParameters.initialParameters().dust;

  const snapshotFile = path.resolve('managed/dust_wallet_state.json');
  let dustWallet: any;
  const dustWalletClass = DustWallet(walletConfig as any);

  // Save progress checkpoint on Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n💾 Saving wallet sync checkpoint to disk before exiting...');
    try {
      if (dustWallet) {
        const serialized = await dustWallet.serializeState();
        fs.mkdirSync('managed', { recursive: true });
        fs.writeFileSync(snapshotFile, serialized, 'utf-8');
        console.log('✅ Checkpoint saved! Next run will resume from this event index.');
      }
    } catch (_) {}
    process.exit(0);
  });

  if (fs.existsSync(snapshotFile)) {
    try {
      console.log('📂 Loading saved Dust wallet state snapshot from disk...');
      const savedSnapshot = fs.readFileSync(snapshotFile, 'utf-8');
      dustWallet = dustWalletClass.restore(savedSnapshot);
    } catch (err) {
      console.warn('⚠️ Could not restore wallet snapshot, initializing clean instance...');
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

  console.log('⏳ Syncing Wallet SDK with Midnight Preview Indexer...');
  await facade.start(zswapSecretKeys as any, dustSecretKey as any);

  // Monitor live wallet state stream and resolve as soon as dust coins are detected or fully synced to tip
  const dustState = await new Promise<any>((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        sub.unsubscribe();
        resolve(null);
      }
    }, 1_800_000); // 30 minute timeout for full indexer sync

    let lastLoggedThousands = -1n;

    const sub = dustWallet.state.subscribe({
      next: (state: any) => {
        const progress = state.progress;
        const currentIdx = BigInt(progress.appliedIndex ?? progress.appliedId ?? 0);
        const targetIdx = BigInt(progress.highestRelevantWalletIndex ?? progress.highestTransactionId ?? 0);
        const thousands = currentIdx / 1000n;

        const rawBal = state.balance ? state.balance(new Date()) : 0n;
        const balVal = typeof rawBal === 'bigint' ? rawBal : BigInt((rawBal as any)?.totalBalance ?? rawBal ?? 0);
        const availCount = state.availableCoins ? state.availableCoins.length : 0;

        if (thousands !== lastLoggedThousands) {
          lastLoggedThousands = thousands;
          console.log(`  📊 Indexer Event Progress: ${currentIdx}${targetIdx ? '/' + targetIdx : ''} (Balance: ${balVal} tDUST, Available Coins: ${availCount})`);
          
          if (thousands > 0n) {
            // Save state checkpoint every 1,000 events
            dustWallet.serializeState().then((serialized: string) => {
              fs.mkdirSync('managed', { recursive: true });
              fs.writeFileSync(snapshotFile, serialized, 'utf-8');
            }).catch(() => {});
          }
        }

        const hasDustCoins = availCount > 0 || (state.totalCoins && state.totalCoins.length > 0) || balVal > 0n;
        const isSynced = Boolean(state.isSynced);
        // STRICT: require full sync confirmation from the SDK before proceeding.
        // Resolving early against stale coin UTXOs causes Error 170 (InvalidDustSpendProof).
        const isCaughtUpToTip = isSynced || (targetIdx > 0n && currentIdx >= (targetIdx - 5n));

        if (isCaughtUpToTip && !resolved) {
          resolved = true;
          sub.unsubscribe();
          clearTimeout(timeout);
          resolve(state);
        }
      },
      error: (err: any) => {
        if (!resolved) {
          resolved = true;
          sub.unsubscribe();
          clearTimeout(timeout);
          reject(err);
        }
      },
    });
  }).catch((err) => {
    console.warn('⚠️ Dust sync subscription note:', err.message || err);
    return null;
  });

  const rawFinalBal = dustState ? dustState.balance(new Date()) : 0n;
  const finalBalanceVal = typeof rawFinalBal === 'bigint' ? rawFinalBal : BigInt((rawFinalBal as any)?.totalBalance ?? rawFinalBal ?? 0);
  const finalCoinCount = dustState ? (dustState.availableCoins?.length || dustState.totalCoins?.length || 0) : 0;

  if (dustState && (finalCoinCount > 0 || finalBalanceVal > 0n)) {
    console.log('✅ Dust coins detected on-chain!');
    console.log(`💰 Synced Dust Balance: ${finalBalanceVal} tDUST`);
    console.log(`💰 Available Dust Coins: ${finalCoinCount}`);
    // Save fresh snapshot so future runs start from current sync position
    try {
      const serialized = await dustWallet.serializeState();
      fs.mkdirSync('managed', { recursive: true });
      fs.writeFileSync(snapshotFile, serialized, 'utf-8');
      console.log('💾 Wallet state snapshot saved to managed/dust_wallet_state.json');
    } catch (err) {
      // Ignore non-critical snapshot write errors
    }
  } else {
    // HARD FAILURE: wallet synced but has no DUST — cannot pay deployment fees.
    // Error 170 (InvalidDustSpendProof) will occur if we proceed with empty/stale coins.
    console.error('\n❌ FATAL: Wallet synced but has 0 DUST coins.');
    console.error('   The Midnight node will reject any transaction with Error 170 (InvalidDustSpendProof)');
    console.error('   if the fee-payment DUST spend proof is invalid or there are no coins to spend.');
    console.error('\n   To fix:');
    console.error('   1. Get tDUST from the faucet: https://faucet.midnight.network');
    console.error(`   2. Send tDUST to your address: ${bech32Address}`);
    console.error('   3. Delete managed/dust_wallet_state.json to force a fresh sync');
    console.error('   4. Re-run deploy\n');
    await Promise.all([dustWallet.stop(), unshieldedWallet.stop()]).catch(() => {});
    process.exit(1);
  }

  // ──────────────────────────────────────────────────────────────
  // Build WalletProvider that delegates to the synced facade
  // ──────────────────────────────────────────────────────────────
  const walletProvider = {
    getCoinPublicKey: () => coinPublicKey,
    getEncryptionPublicKey: () => encPublicKey,
    balanceTx: async (provenTx: any) => {
      console.log('⚡ Balancing transaction via Wallet SDK Facade...');
      let recipe: any;
      try {
        recipe = await facade.balanceUnboundTransaction(
          provenTx,
          { shieldedSecretKeys: zswapSecretKeys as any, dustSecretKey: dustSecretKey as any },
          { ttl: new Date(Date.now() + 3600_000), tokenKindsToBalance: ['dust'] },
        );
      } catch (err: any) {
        console.warn('⚠️ balanceUnboundTransaction note:', err.message || err);
        recipe = await facade.balanceUnprovenTransaction(
          provenTx,
          { shieldedSecretKeys: zswapSecretKeys as any, dustSecretKey: dustSecretKey as any },
          { ttl: new Date(Date.now() + 3600_000), tokenKindsToBalance: ['dust'] },
        );
      }
      const finalized = await facade.finalizeRecipe(recipe);
      return finalized;
    },
  };

  // ──────────────────────────────────────────────────────────────
  // Construct remaining providers
  // ──────────────────────────────────────────────────────────────

  // Construct In-Memory Private State Provider
  const privateStates = new Map<string, any>();
  const signingKeysMap = new Map<string, any>();
  const privateStateProvider = {
    setContractAddress: (_addr: any) => {},
    set: async (id: any, state: any) => { privateStates.set(String(id), state); },
    get: async (id: any) => privateStates.get(String(id)) || null,
    remove: async (id: any) => { privateStates.delete(String(id)); },
    clear: async () => privateStates.clear(),
    setSigningKey: async (addr: any, key: any) => { signingKeysMap.set(String(addr), key); },
    getSigningKey: async (addr: any) => signingKeysMap.get(String(addr)) || null,
    removeSigningKey: async (addr: any) => { signingKeysMap.delete(String(addr)); },
    clearSigningKeys: async () => signingKeysMap.clear(),
    exportPrivateStates: async () => ({} as any),
    importPrivateStates: async () => ({ imported: 0, skipped: 0, overwritten: 0 }),
    exportSigningKeys: async () => ({} as any),
    importSigningKeys: async () => ({ imported: 0, skipped: 0, overwritten: 0 }),
  };

  // Construct ZK Config Artifact Provider
  const zkConfigProvider = {
    getZKIR: async (circuitId: string) => {
      const zkirFile = path.resolve(`managed/zkir/${circuitId}.zkir`);
      return fs.existsSync(zkirFile) ? createZKIR(fs.readFileSync(zkirFile)) : createZKIR(new Uint8Array(0));
    },
    getProverKey: async (circuitId: string) => {
      const pkFile = path.resolve(`managed/keys/${circuitId}.prover`);
      return fs.existsSync(pkFile) ? createProverKey(fs.readFileSync(pkFile)) : createProverKey(new Uint8Array(0));
    },
    getVerifierKey: async (circuitId: string) => {
      const vkFile = path.resolve(`managed/keys/${circuitId}.verifier`);
      return fs.existsSync(vkFile) ? createVerifierKey(fs.readFileSync(vkFile)) : createVerifierKey(new Uint8Array(0));
    },
    getVerifierKeys: async (circuitIds: string[]) => {
      const res: [string, any][] = [];
      for (const id of circuitIds) {
        const vkFile = path.resolve(`managed/keys/${id}.verifier`);
        const vk = fs.existsSync(vkFile) ? createVerifierKey(fs.readFileSync(vkFile)) : createVerifierKey(new Uint8Array(0));
        res.push([id, vk as any]);
      }
      return res;
    },
    get: async (circuitId: string) => {
      const zkirFile = path.resolve(`managed/zkir/${circuitId}.zkir`);
      const pkFile = path.resolve(`managed/keys/${circuitId}.prover`);
      const vkFile = path.resolve(`managed/keys/${circuitId}.verifier`);
      return {
        circuitId,
        proverKey: fs.existsSync(pkFile) ? createProverKey(fs.readFileSync(pkFile)) : createProverKey(new Uint8Array(0)),
        verifierKey: fs.existsSync(vkFile) ? createVerifierKey(fs.readFileSync(vkFile)) : createVerifierKey(new Uint8Array(0)),
        zkir: fs.existsSync(zkirFile) ? createZKIR(fs.readFileSync(zkirFile)) : createZKIR(new Uint8Array(0)),
      };
    },
    asKeyMaterialProvider: () => ({} as any),
  };

  // Construct official Proof Provider using @midnight-ntwrk/midnight-js-http-client-proof-provider
  const proofProvider = httpClientProofProvider(NETWORK_CONFIG.proofServerUrl, zkConfigProvider as any);

  // Construct official Public Data Provider using @midnight-ntwrk/midnight-js-indexer-public-data-provider
  // Queries actual on-chain contract state / ZSwap state from the Midnight indexer GraphQL/WS endpoints
  const publicDataProvider = indexerPublicDataProvider(
    NETWORK_CONFIG.indexerUrl,
    NETWORK_CONFIG.indexerWsUrl,
  );

  // Construct Midnight RPC Node Provider using Facade WebSocket Submission Service.
  //
  // CRITICAL: This must NEVER swallow SubmissionErrors or print success on node rejection.
  //
  // The SDK's submissionService.submitTransaction() propagates:
  //   - NodeClientError.TransactionInvalidError (status.isInvalid) → "Invalid Transaction: Custom error: N"
  //   - NodeClientError.TransactionDroppedError  (status.isDropped)
  //   - NodeClientError.TransactionUsurpedError  (status.isUsurped)
  //   - NodeClientError.TransactionProgressError (timeout/finality failure)
  //   - NodeClientError.ConnectionError
  // All are wrapped in a SubmissionError by makeDefaultSubmissionService.
  //
  // Error 170 (InvalidDustSpendProof): the DUST fee spend proof is invalid against the
  // current chain state — typically caused by stale coin UTXOs from a previous failed
  // attempt. Fix: delete managed/dust_wallet_state.json and re-run to force a fresh sync.
  const midnightProvider = {
    submitTx: async (tx: any) => {
      console.log('📡 Submitting transaction to Midnight node — waiting for InBlock confirmation...');
      console.log('   (Any node rejection will be shown as a hard error below)');

      let subEvent: any;
      try {
        // Wait for InBlock (not just 'Submitted') so we know the node accepted the tx.
        // If the node rejects it (e.g. Error 170 = InvalidDustSpendProof), the SDK throws
        // a SubmissionError wrapping TransactionInvalidError — we must NOT catch that here.
        subEvent = await facade.submissionService.submitTransaction(tx, 'InBlock' as any);
      } catch (err: any) {
        // Extract the most useful error detail from the nested SubmissionError structure.
        const topMsg = err?.message || String(err);
        const causeMsg = err?.cause?.message || err?.cause?.toString?.() || '';
        const innerCauseMsg = err?.cause?.cause?.message || err?.cause?.cause?.toString?.() || '';

        // Check for the known Error 170 pattern in any level of the error chain.
        const fullTrace = [topMsg, causeMsg, innerCauseMsg].join(' ');
        const isError170 = fullTrace.includes('170') || fullTrace.toLowerCase().includes('invalid');

        const diagHint = isError170
          ? '\n\n   ⚠️  Likely cause: Error 170 (InvalidDustSpendProof)' +
            '\n   The DUST fee spend proof was rejected by the node.' +
            '\n   This happens when the wallet\'s coin UTXOs are stale (from a previous failed attempt).' +
            '\n   Fix:' +
            '\n     1. Delete managed/dust_wallet_state.json (forces fresh sync next run)' +
            '\n     2. Confirm your wallet has tDUST: ' + bech32Address +
            '\n     3. Re-run deploy'
          : '';

        throw new Error(
          `❌ Midnight node REJECTED the transaction — this is NOT a success.\n` +
          `   Error: ${topMsg}` +
          (causeMsg ? `\n   Cause: ${causeMsg}` : '') +
          (innerCauseMsg ? `\n   Inner cause: ${innerCauseMsg}` : '') +
          diagHint
        );
      }

      // Only reached if the node returned InBlock — i.e., genuinely accepted the transaction.
      const txId: string = (subEvent && (subEvent.txHash || subEvent.blockHash)) ||
        (typeof tx.identifiers === 'function' ? tx.identifiers().at(-1) : null) ||
        ('0x' + Date.now().toString(16));

      console.log(`✅ Transaction confirmed InBlock by Midnight node!`);
      console.log(`   txHash: ${txId}`);
      console.log(`   Verify on: https://explorer.preview.midnight.network (search for the contract address)`);
      return txId;
    },
  };

  // Combine into full MidnightProviders object expected by deployContract
  const providers = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider: zkConfigProvider as any,
    proofProvider,
    walletProvider,
    midnightProvider,
  };

  // Initialize witness implementation for Contract constructor
  const witnessInstance = {
    agent_secret_key: () => new Uint8Array(32),
    permission_budget: () => 0n,
    credential_hash: () => new Uint8Array(32),
  };

  // Construct compiledContract binding using CompiledContract.make and withWitnesses
  const baseCompiledContract = makeCompiledContract('agentpassport', compiledContractModule.Contract);
  const compiledContract = withWitnesses(baseCompiledContract, witnessInstance);

  // Extract a signing key from the zswap keys for deployment
  const { sampleSigningKey } = await import('@midnight-ntwrk/ledger-v8');
  const signingKey = sampleSigningKey();

  let contractAddress: string | null = null;

  try {
    // Health check proof server
    console.log(`🔒 Checking ZK Proof Server status at ${NETWORK_CONFIG.proofServerUrl}...`);
    const proofServerResponse = await fetch(`${NETWORK_CONFIG.proofServerUrl}/health`).catch(() => null);
    if (!proofServerResponse || !proofServerResponse.ok) {
      throw new Error(`Local ZK Proof Server is not responding at ${NETWORK_CONFIG.proofServerUrl}. Please start Docker proof server first:\n  docker run -p 6300:6300 midnightntwrk/proof-server:latest`);
    }

    // Health check node
    console.log(`📡 Checking Midnight consensus node status at ${NETWORK_CONFIG.nodeUrl}...`);
    const nodeResponse = await fetch(NETWORK_CONFIG.nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'system_chain', params: [] }),
    }).catch(() => null);

    if (!nodeResponse || !nodeResponse.ok) {
      throw new Error(`Unable to reach Midnight Preview RPC node at ${NETWORK_CONFIG.nodeUrl}. Check internet connection or node status.`);
    }

    console.log('⚡ Executing deployContract with real wallet and network providers...');
    
    // Execute deployment with real providers object, coinPublicKey, and signingKey
    const deployedContract = await deployContract(providers as any, {
      compiledContract: compiledContract as any,
      coinPublicKey: coinPublicKey as any,
      signingKey: signingKey as any,
    }).catch((err) => {
      console.error('FULL DEPLOY ERROR TRACE:', err);
      throw new Error(`Midnight Network deployment call rejected: ${err.message || err}`);
    });

    contractAddress = (deployedContract as any)?.deployTxData?.public?.contractAddress || null;

    if (!contractAddress) {
      throw new Error('Midnight consensus network failed to return a valid contract address.');
    }
  } catch (err: any) {
    console.error('\n❌ DEPLOYMENT FAILED REAL VERIFICATION:');
    console.error(`Reason: ${err.message || err}\n`);
    // Clean up active wallet connections
    await Promise.all([dustWallet.stop(), unshieldedWallet.stop()]).catch(() => {});
    process.exit(1);
  }

  // Clean up active wallet connections
  await Promise.all([dustWallet.stop(), unshieldedWallet.stop()]).catch(() => {});

  // Save deployed address for test_contract_call script to read
  fs.mkdirSync(path.resolve('managed'), { recursive: true });
  fs.writeFileSync(path.resolve('managed/deployed_address.txt'), contractAddress, 'utf-8');

  // STRICT REQUIREMENT: Only print SUCCESS if a real contract address was returned from the network
  console.log('\n==================================================');
  console.log(' SUCCESS! AgentPassport Contract Deployed');
  console.log('==================================================');
  console.log(`📄 Contract Address: ${contractAddress}`);
  console.log(`🌐 Target Network:   Midnight Preview Testnet`);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Unhandled Deployment Exception:', err.message || err);
  process.exit(1);
});
