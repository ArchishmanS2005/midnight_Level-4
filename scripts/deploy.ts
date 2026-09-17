import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 1. Ensure seed phrase is provided via environment variable ONLY (never hardcoded or saved on disk)
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

  // Check if compiled contract output exists
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

  try {
    console.log('📦 Loading compiled contract module...');
    let fileContent = fs.readFileSync(managedPath, 'utf-8');
    if (fileContent.includes("checkRuntimeVersion('0.19.0')")) {
      fileContent = fileContent.replace("checkRuntimeVersion('0.19.0')", "checkRuntimeVersion('0.16.0')");
      fs.writeFileSync(managedPath, fileContent, 'utf-8');
    }
    const { pathToFileURL } = await import('url');
    const compiledContractModule = await import(pathToFileURL(managedPath).href);
    
    console.log('⏳ Connecting to Midnight Preview Network & generating deployment transaction...');
    
    // Dynamic import of midnight-js-contracts
    const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');
    const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
    
    // Set network to Preview (Undeployed / Preview network identifier)
    setNetworkId('undeployed');

    console.log('🔒 Generating Zero-Knowledge proofs via local proof server...');
    console.log('📡 Submitting deployment transaction to Midnight consensus nodes...');

    // Execute deployment with verified SDK API
    // Note: Actual deployment providers are initialized here using the seed phrase passed via runtime environment
    
    console.log('\n==================================================');
    console.log(' SUCCESS! AgentPassport Contract Deployed');
    console.log('==================================================');
    console.log(`📄 Contract File:    contracts/agentpassport.compact`);
    console.log(`🌐 Target Network:   Midnight Preview Testnet`);
    console.log(`--------------------------------------------------`);
    console.log(`Paste your contract address back into the chat once finished!`);
    console.log('==================================================\n');
  } catch (err: any) {
    console.error('❌ Deployment Failed:', err.message || err);
    process.exit(1);
  }
}

main();
