const express = require('express');
const router = express.Router();
const bankStatementController = require('../controllers/bankStatementController');

// Get all bank statements
router.get('/', bankStatementController.getAllBankStatements);

// Get all transactions
router.get('/transactions', bankStatementController.getAllTransactions);

// Get a specific bank statement by ID
router.get('/:id', bankStatementController.getBankStatementById);

// Upload and process a bank statement
router.post('/upload', bankStatementController.uploadBankStatement);

module.exports = router; 