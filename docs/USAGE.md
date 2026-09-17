# How to Use AgentPassport

## What You Need

Before getting started, make sure you have:

1. **Lace Wallet** (Midnight-compatible)
   - Download from [lace.io](https://www.lace.io)
   - Switch to the **Midnight Preview** network in Lace settings
   - Get some **tDUST** (test tokens) from the Preview faucet

2. **Node.js v22 or higher**
   - Download from [nodejs.org](https://nodejs.org)
   - Check your version: `node --version`

3. **Docker** (for running the local Proof Server)
   - Download from [docker.com](https://www.docker.com)
   - Required for generating Zero-Knowledge proofs locally

4. **Compact Compiler** (to compile the smart contract)
   - Follow the installation guide at [docs.midnight.network](https://docs.midnight.network)
   - Verify: `compact --version`

---

## Step-by-Step Guide

### Step 1 — Clone and Install

```bash
git clone https://github.com/ArchishmanS2005/midnight_Level-4.git
cd midnight_Level-4
npm install
```

### Step 2 — Compile the Smart Contract

```bash
compact compile contracts/agentpassport.compact --output managed
```

This takes the AgentPassport `.compact` file and produces:
- JavaScript/TypeScript bindings in `managed/`
- Zero-Knowledge circuit files used during proof generation

> ℹ️ If compilation succeeds, you'll see: `✅ Contract compiled successfully`

### Step 3 — Start the Local Proof Server

The Proof Server runs locally on your machine. It handles generating ZK proofs without sending your private data anywhere.

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest
```

Keep this terminal window open — you need the Proof Server running to generate proofs.

### Step 4 — Start the App

```bash
npm run dev
```

Open your browser at `http://localhost:3000`

### Step 5 — Connect Your Lace Wallet

1. Click **"Connect Lace Wallet"** in the top-left panel
2. Your Lace browser extension will ask for permission — click **Approve**
3. The app shows your wallet address and "Preview Network" badge

> 💡 No Lace wallet? Click the button anyway — it will connect in **Demo Mode** so you can try all features.

### Step 6 — Register an AI Agent

1. Click the **"Register Agent"** tab
2. Click **"Generate"** to create a random secret key (or paste your own)
3. Enter an **Agent Credential** (e.g., your agent's API key or a description)
4. Click **"Register Agent with ZK Proof"**

What happens behind the scenes:
- Your secret key and credential are **hashed locally** — they never leave your browser
- A **Zero-Knowledge proof** is generated proving: "I have a valid non-zero key and credential"
- Only the proof (not the data) is sent to the Midnight Preview network
- The public `agent_count` counter on-chain increments by 1

### Step 7 — Authorize an Action

1. Click the **"Authorize Action"** tab
2. Enter your agent's **Permission Budget** (e.g., `1000` tDUST)
3. Enter the **Requested Action Amount** (e.g., `150` tDUST for a hotel booking)
4. The **ZK Proof Preview** box shows whether your budget is sufficient
5. Click **"Authorize with ZK Proof"**

What the proof proves (without revealing your budget):
- **If approved:** "My budget is ≥ 150 tDUST" — the exact budget is never shown
- **If rejected:** "My budget is < 150 tDUST" — still without revealing the exact budget

### Step 8 — Revoke an Agent

1. Click the **"Revoke Agent"** tab
2. Enter the agent's **Secret Key** (the same one used during registration)
3. Click **"Revoke Agent"**

The ZK proof proves you **own** this agent (you know the secret key) without revealing the key on-chain.

---

## What Gets Proved (and What Stays Private)

| What the blockchain sees | What stays private (only on your device) |
|--------------------------|------------------------------------------|
| Agent count (number only) | The agent's identity / secret key |
| Number of approved actions | The permission budget amount |
| Number of rejected actions | The actual credential content |
| ZK proof: "budget sufficient" | Whether budget is ≥ 1000 or ≥ 100 |
| ZK proof: "agent is valid" | Which specific agent is registered |

**The core insight:** The Midnight smart contract never stores or receives your private data. It only receives a cryptographic proof that says "the rules were followed." This is the power of Zero-Knowledge Proofs.

---

## Troubleshooting

### ❌ "Lace wallet not detected"
- Make sure the Lace extension is installed in your browser
- Refresh the page after installing
- If Lace is installed but not detected, try switching to Midnight Preview network in Lace settings
- As a fallback, click "Connect (Demo Mode)" to test without a wallet

### ❌ "Proof generation failed"
- Make sure Docker is running and the Proof Server is active on port 6300
- Run: `docker ps` to check if the proof server container is running
- If not, start it again: `docker run -p 6300:6300 midnightntwrk/proof-server:latest`

### ❌ "Agent secret key must not be zero"
- The secret key field is empty or all zeros
- Click the **"Generate"** button to create a valid random key

### ❌ "npm run build" fails
- Ensure Node.js v22+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### ❌ Contract compilation fails
- Ensure the Compact compiler is installed and in your PATH
- Try: `compact --version` — if not found, follow the install guide at docs.midnight.network
- On Windows, you may need to add the compiler binary to your System PATH

### ❌ Tests failing
- Run: `npm test` and check the error output
- Make sure you're using Node.js v22+
- Try: `npm test -- --clearCache` to reset Jest cache

### 📞 Still stuck?
- Check the [Midnight Docs](https://docs.midnight.network)
- Open an issue on [GitHub](https://github.com/ArchishmanS2005/midnight_Level-4/issues)
- Join the Midnight Discord community
