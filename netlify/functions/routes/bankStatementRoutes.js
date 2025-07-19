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

// Delete routes
router.delete('/transactions/:id', bankStatementController.deleteBankTransaction);
router.post('/transactions/bulk-delete', bankStatementController.deleteBankTransactions);

module.exports = router; 