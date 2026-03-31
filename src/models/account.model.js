const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Account must be associated with a user'],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'CLOSED', 'FROZEN'],
            message: 'Status can be either ACTIVE, CLOSED, or FROZEN'
        },
        default: 'ACTIVE'
    },
    currency: {
        type: String,
        required: [true, 'Currency is required for creating an account'],
        default: 'SYP'
    }
}, { timestamps: true });

accountSchema.methods.getBalance = async function () {
    const balanceData = await mongoose.model('Ledger').aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', 'DEBIT'] },
                            '$amount',
                            0]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', 'CREDIT'] },
                            '$amount',
                            0]
                    }
                }
            },
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ['$totalCredit', '$totalDebit'] }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0;
    }

    return balanceData[0].balance;
}

accountSchema.index({ user: 1, status: 1 });
const accountModel = mongoose.model('Account', accountSchema);

module.exports = accountModel;