import fs from 'fs';
import path from 'path';
import { extractMCBRawTransactions } from '../services/parsers/mcbRawParser';
import { ParsedTransaction } from '../services/types';

/**
 * Script to test MCB Raw data parser with a specific text file
 * Usage: ts-node testMcbRawParser.ts <path-to-text-file>
 */

async function runTest() {
  // Get file path from command line args
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Please provide a path to the text file');
    console.log('Usage: ts-node testMcbRawParser.ts <path-to-text-file>');
    process.exit(1);
  }
  
  console.log(`Testing MCB Raw Parser with file: ${filePath}`);
  
  try {
    // Read the file content
    const text = fs.readFileSync(path.resolve(filePath), 'utf8');
    
    console.log(`File loaded. Content length: ${text.length} characters`);
    console.log(`First 100 characters:\n${text.substring(0, 100)}...`);
    
    // Process the text with MCB raw parser
    console.log('\nRunning MCB Raw parser...');
    const transactions = extractMCBRawTransactions(text);
    
    // Output results
    console.log(`\nParser found ${transactions.length} transactions\n`);
    
    if (transactions.length > 0) {
      console.log('First 3 transactions:');
      transactions.slice(0, 3).forEach((tx: ParsedTransaction, i: number) => {
        console.log(`\nTransaction #${i + 1}:`);
        console.log(JSON.stringify(tx, null, 2));
      });
      
      // Save to output file for inspection
      const outputPath = path.join(path.dirname(filePath), 'raw-parser-output.json');
      fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2));
      console.log(`\nAll transactions saved to: ${outputPath}`);
    } else {
      console.log('No transactions found. Check logs for more details.');
    }
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Run the test
runTest(); 