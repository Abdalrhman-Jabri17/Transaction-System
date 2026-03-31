const transactionRoutes = require('express').Router();
const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware');
const transactionController = require('../controller/transaction.controller');

transactionRoutes.post('/', authMiddleware, transactionController.createTransaction);

transactionRoutes.post('/system/initial-funds', authSystemUserMiddleware, transactionController.createInitialFundsTransaction);

module.exports = transactionRoutes;
