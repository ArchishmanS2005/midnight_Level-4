import crypto from 'crypto';
import { mnemonicToSeedSync, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { ZswapSecretKeys, DustSecretKey, encodeCoinPublicKey } from '@midnight-ntwrk/ledger-v8';
import { ShieldedCoinPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';

const seedPhrase = process.env.MIDNIGHT_WALLET_SEED || '';
console.log('Seed phrase word count:', seedPhrase.trim().split(/\s+/).filter(Boolean).length);

if (!seedPhrase) {
  console.error('MIDNIGHT_WALLET_SEED is empty!');
  process.exit(1);
}

const bip39Seed64 = mnemonicToSeedSync(seedPhrase.trim());
console.log('BIP39 Seed 64-byte length:', bip39Seed64.length);

const hdRes = HDWallet.fromSeed(bip39Seed64);
console.log('HDWallet result type:', hdRes.type);

let zswapKeys: ZswapSecretKeys;
let dustSk: DustSecretKey;

if (hdRes.type === 'seedOk') {
  const account = hdRes.hdWallet.selectAccount(0);
  const compositeKey = account.selectRoles([Roles.Dust, Roles.Zswap]);
  const derived = compositeKey.deriveKeysAt(0);
  if (derived.type === 'keysDerived') {
    console.log('Successfully derived HD keys for Dust and Zswap!');
    dustSk = DustSecretKey.fromSeed(derived.keys[Roles.Dust]);
    zswapKeys = ZswapSecretKeys.fromSeed(derived.keys[Roles.Zswap]);
  } else {
    throw new Error('Key derivation failed out of bounds');
  }
} else {
  throw new Error('Failed to create HD wallet from seed');
}

const coinPk = zswapKeys.coinPublicKey;
const bech32Address = ShieldedCoinPublicKey.codec.encode('preview', new ShieldedCoinPublicKey(encodeCoinPublicKey(coinPk))).asString();
console.log('🔑 Derived Bech32 Address (HD Account 0):', bech32Address);

const config = {
  networkId: 'preview' as any,
  provingServerUrl: new URL('http://localhost:6300'),
  relayURL: new URL('wss://rpc.preview.midnight.network'),
  indexerClientConnection: {
    indexerHttpUrl: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWsUrl: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  },
};

import { DustParameters } from '@midnight-ntwrk/ledger-v8';

const dustParameters = new DustParameters(1n, 1n, 0n);

async function test() {
  console.log('Building Dust Wallet...');
  const walletClass = DustWallet(config as any);
  const dustWallet = walletClass.startWithSecretKey(dustSk as any, dustParameters as any);
  console.log('Starting Dust Wallet sync with Midnight Preview Indexer...');
  await dustWallet.start(dustSk as any);
  console.log('⏳ Waiting for wallet sync to complete...');
  const syncedState = await dustWallet.waitForSyncedState();
  console.log('✅ Indexer Sync Complete!');
  console.log('📊 Synced Dust Balance:', JSON.stringify(syncedState, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  await dustWallet.stop();
}

test().catch((err) => console.error('Error:', err));
