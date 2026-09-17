/**
 * AgentPassport Contract Tests
 *
 * These tests validate the AgentPassport contract logic by simulating
 * the Midnight contract execution model in a Node.js environment.
 *
 * The tests mirror what the Compact compiler produces:
 *  - Public ledger state (counters) tracked as plain numbers
 *  - Private witnesses implemented as TypeScript callbacks
 *  - Circuit logic replicated to verify business rules
 *
 * In a full Midnight environment, these would deploy to the Preview network
 * and use the Midnight JS SDK for proof generation and verification.
 */

// ─── Simulated Contract State ────────────────────────────────────────────────

interface ContractState {
  agent_count: number;
  total_authorizations: number;
  total_rejections: number;
}

interface AgentWitnesses {
  agent_secret_key: () => Uint8Array;
  permission_budget: () => bigint;
  credential_hash: () => Uint8Array;
}

// ─── Simulated Circuit Implementations ───────────────────────────────────────

function createInitialState(): ContractState {
  return {
    agent_count: 0,
    total_authorizations: 0,
    total_rejections: 0,
  };
}

function register_agent(state: ContractState, witnesses: AgentWitnesses): ContractState {
  const sk = witnesses.agent_secret_key();
  const cred = witnesses.credential_hash();

  // Simulate ZK assertion: sk must not be all zeros
  const isSkZero = sk.every((b) => b === 0);
  if (isSkZero) throw new Error('Agent secret key must not be zero');

  // Simulate ZK assertion: cred must not be all zeros
  const isCredZero = cred.every((b) => b === 0);
  if (isCredZero) throw new Error('Credential hash must not be zero');

  return {
    ...state,
    agent_count: state.agent_count + 1,
  };
}

function authorize_action(
  state: ContractState,
  witnesses: AgentWitnesses,
  requested_amount: bigint
): ContractState {
  const sk = witnesses.agent_secret_key();
  const cred = witnesses.credential_hash();
  const budget = witnesses.permission_budget();

  const isSkZero = sk.every((b) => b === 0);
  if (isSkZero) throw new Error('Agent not registered: invalid secret key');

  const isCredZero = cred.every((b) => b === 0);
  if (isCredZero) throw new Error('Invalid credential hash');

  if (budget >= requested_amount) {
    return { ...state, total_authorizations: state.total_authorizations + 1 };
  } else {
    return { ...state, total_rejections: state.total_rejections + 1 };
  }
}

function revoke_agent(state: ContractState, witnesses: AgentWitnesses): ContractState {
  const sk = witnesses.agent_secret_key();
  const isSkZero = sk.every((b) => b === 0);
  if (isSkZero) throw new Error('Cannot revoke: invalid agent identity');

  return {
    ...state,
    agent_count: Math.max(0, state.agent_count - 1),
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function makeValidWitnesses(budget: bigint = 1000n): AgentWitnesses {
  return {
    agent_secret_key: () => {
      // Non-zero 32-byte key simulating a real agent private key
      const key = new Uint8Array(32);
      key.fill(0xab); // 0xab repeated — a valid non-zero key
      return key;
    },
    permission_budget: () => budget,
    credential_hash: () => {
      // Non-zero 32-byte credential hash
      const hash = new Uint8Array(32);
      hash.fill(0xcd);
      return hash;
    },
  };
}

function makeZeroKeyWitnesses(): AgentWitnesses {
  return {
    agent_secret_key: () => new Uint8Array(32), // all zeros — invalid
    permission_budget: () => 1000n,
    credential_hash: () => {
      const hash = new Uint8Array(32);
      hash.fill(0xcd);
      return hash;
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AgentPassport Contract', () => {
  // ── TEST 1: Initial State ──────────────────────────────────────────────────
  describe('Initial State', () => {
    it('should initialize with all counters at zero', () => {
      const state = createInitialState();

      expect(state.agent_count).toBe(0);
      expect(state.total_authorizations).toBe(0);
      expect(state.total_rejections).toBe(0);
    });
  });

  // ── TEST 2: Agent Registration ────────────────────────────────────────────
  describe('register_agent circuit', () => {
    it('should increment agent_count when registering a valid agent', () => {
      let state = createInitialState();
      const witnesses = makeValidWitnesses();

      state = register_agent(state, witnesses);

      expect(state.agent_count).toBe(1);
      expect(state.total_authorizations).toBe(0); // unaffected
      expect(state.total_rejections).toBe(0);    // unaffected
    });

    it('should support registering multiple agents independently', () => {
      let state = createInitialState();

      // Register 3 agents sequentially
      state = register_agent(state, makeValidWitnesses());
      state = register_agent(state, makeValidWitnesses());
      state = register_agent(state, makeValidWitnesses());

      expect(state.agent_count).toBe(3);
    });

    it('should reject registration with a zero (invalid) secret key', () => {
      const state = createInitialState();
      const invalidWitnesses = makeZeroKeyWitnesses();

      expect(() => register_agent(state, invalidWitnesses)).toThrow(
        'Agent secret key must not be zero'
      );

      // State must be unchanged after failed registration
      expect(state.agent_count).toBe(0);
    });
  });

  // ── TEST 3: Action Authorization ──────────────────────────────────────────
  describe('authorize_action circuit', () => {
    it('should increment total_authorizations when budget >= requested amount', () => {
      let state = createInitialState();
      state = register_agent(state, makeValidWitnesses(500n));

      // Agent has budget=500, requesting 100 → should authorize
      state = authorize_action(state, makeValidWitnesses(500n), 100n);

      expect(state.total_authorizations).toBe(1);
      expect(state.total_rejections).toBe(0);
    });

    it('should authorize when budget exactly equals requested amount', () => {
      let state = createInitialState();
      const witnesses = makeValidWitnesses(250n);
      state = register_agent(state, witnesses);

      // Exact match: budget == requested_amount
      state = authorize_action(state, witnesses, 250n);

      expect(state.total_authorizations).toBe(1);
      expect(state.total_rejections).toBe(0);
    });

    it('should increment total_rejections when budget < requested amount', () => {
      let state = createInitialState();
      const witnesses = makeValidWitnesses(50n); // budget = 50
      state = register_agent(state, witnesses);

      // Agent has budget=50, requesting 200 → should reject
      state = authorize_action(state, witnesses, 200n);

      expect(state.total_authorizations).toBe(0);
      expect(state.total_rejections).toBe(1);
    });

    it('should reject authorization with invalid agent secret key', () => {
      const state = createInitialState();

      expect(() =>
        authorize_action(state, makeZeroKeyWitnesses(), 100n)
      ).toThrow('Agent not registered: invalid secret key');
    });

    it('proves privacy: only counters change, never the budget value itself', () => {
      let state = createInitialState();
      const witnesses = makeValidWitnesses(9999n);
      state = register_agent(state, witnesses);

      state = authorize_action(state, witnesses, 100n);

      // The public state must ONLY contain counter values — never the budget
      const publicStateKeys = Object.keys(state);
      expect(publicStateKeys).toEqual(['agent_count', 'total_authorizations', 'total_rejections']);
      expect(publicStateKeys).not.toContain('permission_budget');
      expect(publicStateKeys).not.toContain('agent_secret_key');
      expect(publicStateKeys).not.toContain('credential_hash');

      // Verify budget value is NOT present anywhere in the public state object
      const stateString = JSON.stringify(state);
      expect(stateString).not.toContain('9999');
    });
  });

  // ── TEST 4: Agent Revocation ──────────────────────────────────────────────
  describe('revoke_agent circuit', () => {
    it('should decrement agent_count when revoking a valid agent', () => {
      let state = createInitialState();
      const witnesses = makeValidWitnesses();

      state = register_agent(state, witnesses);
      expect(state.agent_count).toBe(1);

      state = revoke_agent(state, witnesses);
      expect(state.agent_count).toBe(0);
    });

    it('should reject revocation with invalid secret key', () => {
      let state = createInitialState();
      state = register_agent(state, makeValidWitnesses());

      expect(() => revoke_agent(state, makeZeroKeyWitnesses())).toThrow(
        'Cannot revoke: invalid agent identity'
      );
    });
  });

  // ── TEST 5: Full Agent Lifecycle ──────────────────────────────────────────
  describe('Full agent lifecycle', () => {
    it('should support a complete register → authorize → revoke lifecycle', () => {
      let state = createInitialState();
      const witnesses = makeValidWitnesses(1000n);

      // Register
      state = register_agent(state, witnesses);
      expect(state.agent_count).toBe(1);

      // Authorize multiple actions
      state = authorize_action(state, witnesses, 100n); // approve
      state = authorize_action(state, witnesses, 500n); // approve
      state = authorize_action(state, witnesses, 200n); // approve
      state = authorize_action(state, witnesses, 5000n); // reject (over budget)

      expect(state.total_authorizations).toBe(3);
      expect(state.total_rejections).toBe(1);

      // Revoke
      state = revoke_agent(state, witnesses);
      expect(state.agent_count).toBe(0);

      // Counters persist after revocation (immutable history)
      expect(state.total_authorizations).toBe(3);
      expect(state.total_rejections).toBe(1);
    });
  });
});
