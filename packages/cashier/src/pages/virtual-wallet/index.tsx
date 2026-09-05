import React, { useState } from 'react';
import { Button, Text } from '@deriv/components';
import { observer, useStore } from '@deriv/stores';
import PageContainer from '../../components/page-container';
import { useCashierStore } from '../../stores/useCashierStores';

const VirtualWallet = observer(() => {
    const { client } = useStore();
    const { virtual_wallet } = useCashierStore();
    const activeAccount = client.loginid || 'ROT92069393';
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    const balance = virtual_wallet.getBalance(activeAccount);

    const handleDeposit = () => {
        const value = Number(amount);
        setMessage(virtual_wallet.deposit(activeAccount, value) ? 'Virtual deposit completed.' : 'Enter a valid amount.');
        if (Number.isFinite(value) && value > 0) setAmount('');
    };

    const handleWithdrawal = () => {
        const value = Number(amount);
        setMessage(
            virtual_wallet.withdraw(activeAccount, value)
                ? 'Virtual withdrawal completed.'
                : 'Invalid amount or insufficient virtual funds.'
        );
        if (Number.isFinite(value) && value > 0 && value <= balance) setAmount('');
    };

    return (
        <PageContainer>
            <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
                <Text as='h2'>Virtual Wallet</Text>
                <div style={{ padding: 24, margin: '20px 0', borderRadius: 12, background: 'var(--general-section-1)' }}>
                    <Text size='xs' color='less-prominent'>Virtual balance</Text>
                    <Text as='h1' weight='bold'>
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text size='xs' color='less-prominent'>Account: {activeAccount}</Text>
                </div>
                <input
                    aria-label='Virtual amount'
                    inputMode='decimal'
                    placeholder='Amount'
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 12,
                        marginBottom: 12,
                        borderRadius: 8,
                        border: '1px solid var(--general-section-1)',
                    }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button onClick={handleDeposit} primary>Deposit</Button>
                    <Button onClick={handleWithdrawal}>Withdraw</Button>
                </div>
                {message && <Text size='xs' color='less-prominent'>{message}</Text>}
                <div style={{ marginTop: 28 }}>
                    <Text weight='bold'>Recent virtual transactions</Text>
                    {virtual_wallet.transactions
                        .filter(transaction => transaction.account === activeAccount)
                        .slice(0, 8)
                        .map(transaction => (
                            <div key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                                <Text size='xs'>{transaction.description}</Text>
                                <Text size='xs'>
                                    {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                                </Text>
                            </div>
                        ))}
                </div>
            </div>
        </PageContainer>
    );
});

export default VirtualWallet;
