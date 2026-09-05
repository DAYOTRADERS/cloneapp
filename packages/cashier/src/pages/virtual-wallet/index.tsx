import React, { useState } from 'react';
import { Button, Text } from '@deriv/components';
import { observer, useStore } from '@deriv/stores';
import PageContainer from '../../components/page-container';
import { useCashierStore } from '../../stores/useCashierStores';
import { VIRTUAL_WALLET_ACCOUNTS } from '../../stores/virtual-wallet-store';

const formatMoney = (amount: number) =>
    `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const VirtualWallet = observer(() => {
    const { client } = useStore();
    const { virtual_wallet } = useCashierStore();
    const activeAccount = client.loginid;
    const [amount, setAmount] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [message, setMessage] = useState('');

    const isSupported = !!activeAccount && virtual_wallet.isSupportedAccount(activeAccount);
    const balance = activeAccount ? virtual_wallet.getBalance(activeAccount) : 0;
    const transferTo = activeAccount === VIRTUAL_WALLET_ACCOUNTS[0] ? VIRTUAL_WALLET_ACCOUNTS[1] : VIRTUAL_WALLET_ACCOUNTS[0];

    const handleDeposit = () => {
        if (!activeAccount) return;
        const value = Number(amount);
        const success = virtual_wallet.deposit(activeAccount, value);
        setMessage(success ? 'Virtual deposit completed.' : 'Enter a valid amount.');
        if (success) setAmount('');
    };

    const handleWithdrawal = () => {
        if (!activeAccount) return;
        const value = Number(amount);
        const success = virtual_wallet.withdraw(activeAccount, value);
        setMessage(success ? 'Virtual withdrawal completed.' : 'Invalid amount or insufficient virtual funds.');
        if (success) setAmount('');
    };

    const handleTransfer = () => {
        if (!activeAccount) return;
        const value = Number(transferAmount);
        const success = virtual_wallet.transfer(activeAccount, transferTo, value);
        setMessage(success ? `Virtual transfer to ${transferTo} completed.` : 'Invalid amount or insufficient virtual funds.');
        if (success) setTransferAmount('');
    };

    if (!activeAccount) {
        return (
            <PageContainer>
                <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
                    <Text as='h2'>Virtual Wallet</Text>
                    <Text size='xs' color='less-prominent'>Log in to use the virtual wallet.</Text>
                </div>
            </PageContainer>
        );
    }

    if (!isSupported) {
        return (
            <PageContainer>
                <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
                    <Text as='h2'>Virtual Wallet</Text>
                    <Text size='xs' color='less-prominent'>
                        This virtual wallet is currently enabled only for the configured practice accounts.
                    </Text>
                    <Text size='xs' color='less-prominent'>Account: {activeAccount}</Text>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
                <Text as='h2'>Virtual Wallet</Text>
                <Text size='xs' color='less-prominent'>Practice funds only — this does not change any Deriv balance.</Text>

                <div style={{ padding: 24, margin: '20px 0', borderRadius: 12, background: 'var(--general-section-1)' }}>
                    <Text size='xs' color='less-prominent'>Virtual balance</Text>
                    <Text as='h1' weight='bold'>{formatMoney(balance)}</Text>
                    <Text size='xs' color='less-prominent'>Account: {activeAccount}</Text>
                </div>

                <input
                    aria-label='Virtual deposit or withdrawal amount'
                    inputMode='decimal'
                    placeholder='Amount'
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: 12, marginBottom: 12, borderRadius: 8, border: '1px solid var(--general-section-1)' }}
                />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Button onClick={handleDeposit} primary>Virtual deposit</Button>
                    <Button onClick={handleWithdrawal}>Virtual withdrawal</Button>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--general-section-1)' }}>
                    <Text weight='bold'>Transfer virtual funds</Text>
                    <Text size='xs' color='less-prominent'>To {transferTo}</Text>
                    <input
                        aria-label='Virtual transfer amount'
                        inputMode='decimal'
                        placeholder='Transfer amount'
                        value={transferAmount}
                        onChange={event => setTransferAmount(event.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: 12, margin: '12px 0', borderRadius: 8, border: '1px solid var(--general-section-1)' }}
                    />
                    <Button onClick={handleTransfer}>Transfer</Button>
                </div>

                {message && <Text size='xs' color='less-prominent'>{message}</Text>}

                <div style={{ marginTop: 28 }}>
                    <Text weight='bold'>Recent virtual transactions</Text>
                    {virtual_wallet.transactions
                        .filter(transaction => transaction.account === activeAccount)
                        .slice(0, 8)
                        .map(transaction => (
                            <div key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
                                <Text size='xs'>{transaction.description}</Text>
                                <Text size='xs'>{transaction.amount >= 0 ? '+' : ''}{formatMoney(transaction.amount)}</Text>
                            </div>
                        ))}
                </div>
            </div>
        </PageContainer>
    );
});

export default VirtualWallet;
