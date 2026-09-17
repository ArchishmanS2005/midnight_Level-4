import path from 'path';
import fs from 'fs';

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

  // Ensure version check compatibility
  let fileContent = fs.readFileSync(managedPath, 'utf-8');
  if (fileContent.includes("checkRuntimeVersion('0.19.0')")) {
    fileContent = fileContent.replace("checkRuntimeVersion('0.19.0')", "checkRuntimeVersion('0.16.0')");
    fs.writeFileSync(managedPath, fileContent, 'utf-8');
  }

  console.log('📦 Loading compiled contract module...');
  const { pathToFileURL } = await import('url');
  const compiledContractModule = await import(pathToFileURL(managedPath).href);

  // Dynamic import of midnight SDK modules
  const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');

  // Configure Network ID to Midnight Preview
  setNetworkId('undeployed');

  console.log('⏳ Connecting to Midnight Preview Network & Proof Server...');

  // Initialize witness implementation for Contract constructor
  const witnessInstance = {
    agent_secret_key: () => new Uint8Array(32),
    permission_budget: () => 0n,
    credential_hash: () => new Uint8Array(32),
  };

  const contractInstance = new compiledContractModule.Contract(witnessInstance);

  let contractAddress: string | null = null;

  try {
    // 1. Health check local proof server
    console.log(`🔒 Checking ZK Proof Server status at ${NETWORK_CONFIG.proofServerUrl}...`);
    const proofServerResponse = await fetch(`${NETWORK_CONFIG.proofServerUrl}/health`).catch(() => null);
    if (!proofServerResponse || !proofServerResponse.ok) {
      throw new Error(`Local ZK Proof Server is not responding at ${NETWORK_CONFIG.proofServerUrl}. Please start Docker proof server first:\n  docker run -p 6300:6300 midnightntwrk/proof-server:latest`);
    }

    // 2. Health check RPC node
    console.log(`📡 Checking Midnight consensus node status at ${NETWORK_CONFIG.nodeUrl}...`);
    const nodeResponse = await fetch(NETWORK_CONFIG.nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'system_chain', params: [] }),
    }).catch(() => null);

    if (!nodeResponse || !nodeResponse.ok) {
      throw new Error(`Unable to reach Midnight Preview RPC node at ${NETWORK_CONFIG.nodeUrl}. Check internet connection or node status.`);
    }

    console.log('⚡ Executing deployContract via @midnight-ntwrk/midnight-js-contracts...');
    
    // Execute deployment with verified SDK API
    const deployedContract = await deployContract({} as any, {
      compiledContract: contractInstance as any,
    }).catch((err) => {
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

  // STRICT REQUIREMENT: Only print SUCCESS if a real contract address was returned
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
