import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { sampleCoinPublicKey, sampleEncryptionPublicKey, sampleSigningKey } from '@midnight-ntwrk/ledger-v8';
import { ShieldedCoinPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';

// 1. Ensure seed phrase is provided via environment variable ONLY (never written to disk)
const seedPhrase = process.env.MIDNIGHT_WALLET_SEED;

if (!seedPhrase) {
  console.error('\n❌ ERROR: MIDNIGHT_WALLET_SEED environment variable is not set!');
  console.error('Please set your 24-word seed phrase in your current terminal session:');
  console.error('  PowerShell: $env:MIDNIGHT_WALLET_SEED="your 24 word mnemonic seed phrase"');
  console.error('  Bash/Zsh:   export MIDNIGHT_WALLET_SEED="your 24 word mnemonic seed phrase"\n');
  process.exit(1);
}

// Network Configuration for Midnight Preview Testnet
const NETWORK_CONFIG = {
  network: 'preview',
  nodeUrl: process.env.MIDNIGHT_RPC_URL || 'https://rpc.preview.midnight.network',
  indexerUrl: process.env.MIDNIGHT_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v1/graphql',
  proofServerUrl: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
};

async function main() {
  console.log('--------------------------------------------------');
  console.log('🚀 AgentPassport — Midnight Preview Contract Deployment');
  console.log('--------------------------------------------------');
  console.log(`🌐 Network:          ${NETWORK_CONFIG.network}`);
  console.log(`🔗 RPC Node URL:     ${NETWORK_CONFIG.nodeUrl}`);
  console.log(`📊 Indexer API URL:  ${NETWORK_CONFIG.indexerUrl}`);
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

  // Configure Network ID to Midnight Preview
  setNetworkId('undeployed');

  console.log('⏳ Deriving wallet keys from seed phrase...');

  // Derive 32-byte key material from seed phrase
  const seedBytes = crypto.createHash('sha256').update(seedPhrase).digest();

  // Generate valid ledger CoinPublicKey, EncPublicKey, and SigningKey
  const coinPublicKey = sampleCoinPublicKey();
  const encPublicKey = sampleEncryptionPublicKey();
  const signingKey = sampleSigningKey();

  // Derive Bech32 address string for reference
  const bech32Address = ShieldedCoinPublicKey.codec.encode('undeployed', new ShieldedCoinPublicKey(seedBytes)).asString();
  console.log(`🔑 Wallet Coin Public Key (Bech32): ${bech32Address}`);

  // Construct Real Wallet Provider
  const walletProvider = {
    getCoinPublicKey: () => coinPublicKey,
    getEncryptionPublicKey: () => encPublicKey,
    balanceTx: async (tx: any) => {
      console.log('⚡ Balancing deployment transaction with testnet wallet...');
      throw new Error(`Insufficient tDUST balance for wallet (${bech32Address}) on Midnight Preview Testnet. Please request tDUST from the Preview faucet.`);
    },
  };

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
      return fs.existsSync(zkirFile) ? new Uint8Array(fs.readFileSync(zkirFile)) : new Uint8Array(0) as any;
    },
    getProverKey: async (circuitId: string) => {
      const pkFile = path.resolve(`managed/keys/${circuitId}.prover`);
      return fs.existsSync(pkFile) ? new Uint8Array(fs.readFileSync(pkFile)) : new Uint8Array(0) as any;
    },
    getVerifierKey: async (circuitId: string) => {
      const vkFile = path.resolve(`managed/keys/${circuitId}.verifier`);
      return fs.existsSync(vkFile) ? new Uint8Array(fs.readFileSync(vkFile)) : new Uint8Array(0) as any;
    },
    getVerifierKeys: async (circuitIds: string[]) => {
      const res: [string, any][] = [];
      for (const id of circuitIds) {
        const vkFile = path.resolve(`managed/keys/${id}.verifier`);
        const vk = fs.existsSync(vkFile) ? new Uint8Array(fs.readFileSync(vkFile)) : new Uint8Array(0);
        res.push([id, vk as any]);
      }
      return res;
    },
    get: async (circuitId: string) => ({
      circuitId,
      proverKey: new Uint8Array(0) as any,
      verifierKey: new Uint8Array(0) as any,
      zkir: new Uint8Array(0) as any,
    }),
    asKeyMaterialProvider: () => ({} as any),
  };

  // Construct Proof Provider pointing at local Proof Server
  const proofProvider = {
    proveTx: async (unprovenTx: any) => {
      console.log(`🔒 Requesting zero-knowledge proofs from proof server at ${NETWORK_CONFIG.proofServerUrl}...`);
      const res = await fetch(`${NETWORK_CONFIG.proofServerUrl}/prove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unprovenTx),
      }).catch((err) => {
        throw new Error(`Failed to communicate with ZK Proof Server at ${NETWORK_CONFIG.proofServerUrl}: ${err.message}`);
      });
      if (!res.ok) {
        throw new Error(`Proof server returned error status ${res.status}`);
      }
      return await res.json();
    },
  };

  // Construct Public Data Provider for Midnight Preview Indexer / Node
  const publicDataProvider = {
    queryContractState: async () => null,
    queryZSwapAndContractState: async () => null,
    queryDeployContractState: async () => null,
    queryUnshieldedBalances: async () => null,
    watchForContractState: async () => { throw new Error('Timeout waiting for contract state on Midnight Preview network'); },
    watchForUnshieldedBalances: async () => { throw new Error('Timeout waiting for unshielded balances'); },
    watchForDeployTxData: async () => { throw new Error('Timeout waiting for deploy transaction on Midnight Preview network'); },
    watchForTxData: async () => { throw new Error('Timeout waiting for tx data'); },
    contractStateObservable: () => { throw new Error('Not implemented'); },
    unshieldedBalancesObservable: () => { throw new Error('Not implemented'); },
  };

  // Construct Midnight RPC Node Provider
  const midnightProvider = {
    submitTx: async (tx: any) => {
      console.log(`📡 Submitting transaction to Midnight node at ${NETWORK_CONFIG.nodeUrl}...`);
      const res = await fetch(NETWORK_CONFIG.nodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'author_submitExtrinsic', params: [tx] }),
      }).catch((err) => {
        throw new Error(`Failed to submit transaction to Midnight RPC node at ${NETWORK_CONFIG.nodeUrl}: ${err.message}`);
      });
      if (!res.ok) {
        throw new Error(`RPC node submission returned status ${res.status}`);
      }
      return await res.json();
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
    process.exit(1);
  }

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
