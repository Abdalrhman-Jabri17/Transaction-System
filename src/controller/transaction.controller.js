const tranactionModel = require('../models/transaction.model');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose');
const ledgerModel = require('../models/ledger.model');
const { sendTransactionEmail } = require('../services/email.service');
/**
 * - Create a new transaction
 * The 10-STEP Transfer flow: 
    * 1. Validate request
    * 2. Validate Idempotency key
    * 3. Check account status
    * 4. Derive sender balance from ledger
    * 5. Create transaction with PENDING status
    * 6. Create ledger entry for sender (DEBIT)
    * 7. Create ledger entry for receiver (CREDIT)
    * 8. Update transaction status to COMPLETED
    * 9. Commit mongoDB session
    * 10. Send email notification
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // 1. Validate request
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({ message: 'Invalid fromAccount or toAccount' });
    }

    // 2. Validate Idempotency key
    const existingTransaction = await tranactionModel.findOne({ idempotencyKey });
    if (existingTransaction) {
        if (existingTransaction.status === 'COMPLETED') {
            return res.status(200).json({ message: 'Transaction already completed', transaction: existingTransaction });
        }
        if (existingTransaction.status === 'PENDING') {
            return res.status(200).json({ message: 'Transaction is still pending' });
        }
        if (existingTransaction.status === 'FAILED') {
            return res.status(500).json({ message: 'Previous transaction attempt failed, you can retry' });
        }
        if (existingTransaction.status === 'REVERSED') {
            return res.status(500).json({ message: 'Previous transaction was reversed, you can retry' });
        }
    }
    // 3. Check account status
    if (fromUserAccount.status !== 'ACTIVE' || toUserAccount.status !== 'ACTIVE') {
        return res.status(400).json({ message: 'One or both accounts are not active' });
    }
    // 4. Derive sender balance from ledger
    const senderBalance = await fromUserAccount.getBalance();
    if (senderBalance < amount) {
        return res.status(400).json({ message: `Insufficient funds, Current balance is ${senderBalance}. Requested amount is ${amount}` });
    }

    // 5. Create transaction with PENDING status
    const session = await mongoose.startSession();
    session.startTransaction();

    let transaction;
    try {
        transaction = (await tranactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: 'PENDING'
        }], { session }))[0];

        // 6. Create ledger entry for sender (DEBIT)
        await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: 'DEBIT'
        }], { session });

        await (() => {
            return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        })();
        // 7. Create ledger entry for receiver (CREDIT)
        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: 'CREDIT'
        }], { session });

        transaction = await tranactionModel.findOneAndUpdate({ _id: transaction._id }, { status: 'COMPLETED' }, { session });

        // 9. Commit mongoDB session
        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        return res.status(400).json({ message: 'Transaction is pending ' });
    }

    // 10. Send email notification (This is a placeholder, implement email sending logic here)
    await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);

    res.status(201).json({ message: 'Transaction completed successfully', transaction });
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(404).json({ message: 'Invalid toAccount' });
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(404).json({ message: 'System user account not found' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    const transaction = new tranactionModel({
        fromAccount: fromUserAccount._id,
        toAccount: toUserAccount._id,
        amount,
        idempotencyKey,
        status: 'PENDING'
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type: 'DEBIT'
    }], { session });
    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount,
        transaction: transaction._id,
        type: 'CREDIT'
    }], { session });

    transaction.status = 'COMPLETED';
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Initial funds transaction completed successfully', transaction });
}

module.exports = { createTransaction, createInitialFundsTransaction };