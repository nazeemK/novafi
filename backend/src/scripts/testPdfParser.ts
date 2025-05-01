import fs from 'fs';
import path from 'path';
import { extractMCBTransactions } from '../services/parsers/mcbParser';
import { extractMCBRawTransactions } from '../services/parsers/mcbRawParser';
import { ParsedTransaction } from '../services/types';

/**
 * Script to test parsing MCB statements directly from PDF files
 * Usage: ts-node testPdfParser.ts <path-to-pdf-file>
 */

// Try to load the pdf-parse module
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch (error) {
  console.error('pdf-parse module not found. Please install it with: npm install pdf-parse');
  process.exit(1);
}

async function runTest() {
  // Get file path from command line args
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Please provide a path to the PDF file');
    console.log('Usage: ts-node testPdfParser.ts <path-to-pdf-file>');
    process.exit(1);
  }
  
  if (!filePath.toLowerCase().endsWith('.pdf')) {
    console.error('The file must be a PDF file (.pdf extension)');
    process.exit(1);
  }
  
  console.log(`Testing PDF parser with file: ${filePath}`);
  
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(path.resolve(filePath));
    
    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const data = await pdfParse(dataBuffer);
    
    // Get the text content
    const text = data.text;
    
    console.log(`PDF text extracted. Content length: ${text.length} characters`);
    console.log(`First 100 characters:\n${text.substring(0, 100)}...`);
    
    // Save extracted text for debugging
    const textFilePath = filePath.replace('.pdf', '.txt');
    fs.writeFileSync(textFilePath, text);
    console.log(`Text content saved to: ${textFilePath} for inspection`);
    
    // Process with both parsers for comparison
    console.log('\n=== Running MCB parser ===');
    const transactions = extractMCBTransactions(text);
    
    console.log(`\nMCB Parser found ${transactions.length} transactions\n`);
    
    if (transactions.length > 0) {
      console.log('First 3 transactions:');
      transactions.slice(0, 3).forEach((tx: ParsedTransaction, i: number) => {
        console.log(`\nTransaction #${i + 1}:`);
        console.log(JSON.stringify(tx, null, 2));
      });
      
      // Save to output file for inspection
      const outputPath = path.join(path.dirname(filePath), 'mcb-parser-output.json');
      fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2));
      console.log(`\nAll transactions saved to: ${outputPath}`);
    } else {
      console.log('No transactions found with MCB parser.');
    }
    
    // Try the raw parser as well
    console.log('\n\n=== Running MCB Raw parser ===');
    const rawTransactions = extractMCBRawTransactions(text);
    
    console.log(`\nMCB Raw Parser found ${rawTransactions.length} transactions\n`);
    
    if (rawTransactions.length > 0) {
      console.log('First 3 transactions from raw parser:');
      rawTransactions.slice(0, 3).forEach((tx: ParsedTransaction, i: number) => {
        console.log(`\nTransaction #${i + 1}:`);
        console.log(JSON.stringify(tx, null, 2));
      });
      
      // Save to output file for inspection
      const rawOutputPath = path.join(path.dirname(filePath), 'mcb-raw-parser-output.json');
      fs.writeFileSync(rawOutputPath, JSON.stringify(rawTransactions, null, 2));
      console.log(`\nAll raw transactions saved to: ${rawOutputPath}`);
    } else {
      console.log('No transactions found with MCB Raw parser.');
    }
    
  } catch (error) {
    console.error('Error processing PDF file:', error);
    if (error instanceof Error && error.message.includes('pdf-parse')) {
      console.error('\nMake sure you have installed the pdf-parse package:');
      console.error('npm install pdf-parse');
    }
  }
}

// Run the test
runTest(); 