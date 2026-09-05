import { action, makeObservable, observable } from 'mobx';

export type TVirtualWalletTransaction = {
    id: string;
    type: 'deposit' | 'withdrawal' | 'transfer' | 'trade';
    account: string;
    amount: number;
    balance_after: number;
    description: string;
    timestamp: number;
    from?: string;
    to?: string;
};

export const VIRTUAL_WALLET_ACCOUNTS = ['ROT92069393', 'DOT93428212'] as const;
export const VIRTUAL_WALLET_INITIAL_BALANCE = 5900;
const STORAGE_KEY = 'cloneapp_virtual_wallet_v1';

type TVirtualWalletState = {
    balances: Record<string, number>;
    initialized: Record<string, boolean>;
    transactions: TVirtualWalletTransaction[];
};

const emptyState = (): TVirtualWalletState => ({ balances: {}, initialized: {}, transactions: [] });

export default class VirtualWalletStore {
    balances: Record<string, number> = {};
    initialized: Record<string, boolean> = {};
    transactions: TVirtualWalletTransaction[] = [];

    constructor() {
        makeObservable(this, {
            balances: observable,
            initialized: observable,
            transactions: observable,
            deposit: action.bound,
            withdraw: action.bound,
            transfer: action.bound,
            debitForTrade: action.bound,
            creditFromTrade: action.bound,
            setBalance: action.bound,
            reset: action.bound,
        });
        this.load();
    }

    private persist() {
        if (typeof window === 'undefined') return;
        const state: TVirtualWalletState = {
            balances: this.balances,
            initialized: this.initialized,
            transactions: this.transactions,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    private load() {
        if (typeof window === 'undefined') return;
        try {
            const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as TVirtualWalletState | null;
            if (saved?.balances) this.balances = saved.balances;
            if (saved?.initialized) this.initialized = saved.initialized;
            if (Array.isArray(saved?.transactions)) this.transactions = saved.transactions;
        } catch {
            // Ignore malformed local virtual-wallet data and start cleanly.
        }

        // Only the requested virtual real-account login id receives the first-use $5,900 grant.
        if (!this.initialized[VIRTUAL_WALLET_ACCOUNTS[0]]) {
            this.balances[VIRTUAL_WALLET_ACCOUNTS[0]] = VIRTUAL_WALLET_INITIAL_BALANCE;
            this.initialized[VIRTUAL_WALLET_ACCOUNTS[0]] = true;
            this.addTransaction(VIRTUAL_WALLET_ACCOUNTS[0], 'deposit', VIRTUAL_WALLET_INITIAL_BALANCE, 'Initial virtual wallet credit');
            this.persist();
        }
    }

    private addTransaction(
        account: string,
        type: TVirtualWalletTransaction['type'],
        amount: number,
        description: string,
        from?: string,
        to?: string
    ) {
        this.transactions.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type,
            account,
            amount,
            balance_after: this.getBalance(account),
            description,
            timestamp: Date.now(),
            from,
            to,
        });
        this.transactions = this.transactions.slice(0, 500);
    }

    isSupportedAccount(account: string) {
        return (VIRTUAL_WALLET_ACCOUNTS as readonly string[]).includes(account);
    }

    getBalance(account: string) {
        return Number(this.balances[account] || 0);
    }

    setBalance(account: string, amount: number, description = 'Admin virtual balance adjustment') {
        if (!this.isSupportedAccount(account) || !Number.isFinite(amount) || amount < 0) return false;
        this.balances[account] = Number(amount.toFixed(2));
        this.initialized[account] = true;
        this.addTransaction(account, 'deposit', this.balances[account], description);
        this.persist();
        return true;
    }

    deposit(account: string, amount: number) {
        if (!this.isSupportedAccount(account) || !Number.isFinite(amount) || amount <= 0) return false;
        this.balances[account] = Number((this.getBalance(account) + amount).toFixed(2));
        this.initialized[account] = true;
        this.addTransaction(account, 'deposit', amount, 'Virtual wallet deposit');
        this.persist();
        return true;
    }

    withdraw(account: string, amount: number) {
        if (!this.isSupportedAccount(account) || !Number.isFinite(amount) || amount <= 0 || amount > this.getBalance(account)) return false;
        this.balances[account] = Number((this.getBalance(account) - amount).toFixed(2));
        this.addTransaction(account, 'withdrawal', -amount, 'Virtual wallet withdrawal');
        this.persist();
        return true;
    }

    transfer(from: string, to: string, amount: number) {
        if (from === to || !this.isSupportedAccount(from) || !this.isSupportedAccount(to) || !Number.isFinite(amount) || amount <= 0 || amount > this.getBalance(from)) return false;
        this.balances[from] = Number((this.getBalance(from) - amount).toFixed(2));
        this.balances[to] = Number((this.getBalance(to) + amount).toFixed(2));
        this.addTransaction(from, 'transfer', -amount, `Virtual transfer to ${to}`, from, to);
        this.addTransaction(to, 'transfer', amount, `Virtual transfer from ${from}`, from, to);
        this.persist();
        return true;
    }

    debitForTrade(account: string, amount: number) {
        if (!this.isSupportedAccount(account) || !Number.isFinite(amount) || amount <= 0 || amount > this.getBalance(account)) return false;
        this.balances[account] = Number((this.getBalance(account) - amount).toFixed(2));
        this.addTransaction(account, 'trade', -amount, 'Virtual trade stake');
        this.persist();
        return true;
    }

    creditFromTrade(account: string, amount: number) {
        if (!this.isSupportedAccount(account) || !Number.isFinite(amount) || amount <= 0) return false;
        this.balances[account] = Number((this.getBalance(account) + amount).toFixed(2));
        this.addTransaction(account, 'trade', amount, 'Virtual trade payout');
        this.persist();
        return true;
    }

    reset() {
        this.balances = {};
        this.initialized = {};
        this.transactions = [];
        this.load();
        this.persist();
    }
}
