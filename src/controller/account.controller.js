const Account = require('../models/account.model');

async function createAccount(req, res) {
    const user = req.user;

    const account = await Account.create({
        user: user._id
    })

    res.status(201).json({
        account: account
    })
}

async function getAccounts(req, res) {

    const accounts = await Account.find({
        user: req.user._id
    })

    res.status(200).json({
        accounts
    })
}

async function getAccountBalance(req, res) {
    const { accountId } = req.params;

    const account = await Account.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({ message: 'Account not found' });
    }

    const balance = await account.getBalance();


    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}

module.exports = {
    createAccount,
    getAccounts,
    getAccountBalance
}

