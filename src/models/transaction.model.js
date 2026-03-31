const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Transaction must have a source account']
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Transaction must have a destination account']
    },
    status: {
        type: String,
        enum: {
            values: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
            message: 'Status can be either PENDING, COMPLETED, FAILED, or REVERSED'
        },
        default: 'PENDING'
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: [0, 'Transaction cannot be negative']
    },
    idempotencyKey: {
        type: String,
        required: [true, 'Idempotency key is required for transaction'],
        unique: true
    }
}, { timestamps: true });

const transactionModel = mongoose.model('Transaction', transactionSchema);

module.exports = transactionModel;