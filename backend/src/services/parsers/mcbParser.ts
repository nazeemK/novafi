// src/services/parsers/mcbParser.ts
import { parseDate, parseAmount, getCategoryFromDescription } from './utils';
import { ParsedTransaction } from '../types';

/**
 * Extract transactions from MCB bank statement text content. V5
 * Adapted for pdf-parse output where columns might be concatenated.
 * @param text Bank statement text content
 */
export function extractMCBTransactions(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line); // Trim & remove empty lines
    console.info(`MCB Parser V5: --- Starting Processing ---`);
    console.info(`MCB Parser V5: Processing ${lines.length} non-empty lines.`);

    // Regex V5: Matches concatenated dates, optional debit, optional credit, mandatory balance
    // Groups: 1:TransDate, 2:ValueDate(ignored), 3:Optional Debit, 4:Optional Credit, 5:Balance
    const dataLineRegex = /^(\d{2}\/\d{2}\/\d{4})(\d{2}\/\d{2}\/\d{4})([\d,.]*)\s*([\d,.]*)\s*([\d,]+\.\d{2})\s*$/;

    // Reference pattern
    const referenceRegex = /((?:JuicePro Transfer|Instant Payment|Inward Transfer|Cash Cheque|JUICE Payment|Direct Debit Scheme|Merchant Instant Payment|Tax Amount Due|Service Fee|Statement Fee)\s+(?:FT|TT)?[A-Z0-9]+)/i;
    // Separator pattern
    const separatorRegex = /(\\[A-Z]{3})/; // Like \BNK, \BPR etc.
    // Keywords often preceding destinatory names
    const destinatoryKeywords = ['BNK', 'BPR', 'MR', 'MRS', 'MISS', 'MS', 'LTD', 'CO', '&'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(dataLineRegex);

        if (match) {
            console.info(`\nMCB Parser V5: Matched data line ${i + 1}: "${line}"`);
            const [, transDateStr, , debitStrRaw, creditStrRaw, balanceStr] = match;

            const date = parseDate(transDateStr);
            const debit = debitStrRaw ? parseAmount(debitStrRaw) : 0;
            const credit = creditStrRaw ? parseAmount(creditStrRaw) : 0;
            const balance = parseAmount(balanceStr);
            const amount = Math.max(debit, credit);
            const type = credit > 0 ? 'credit' : 'debit';

            if (amount === 0 && credit === 0 && debit === 0) {
                 console.warn(`  -> Skipping line ${i+1} due to zero amount.`);
                 continue;
            }

            // Now, look for the details on the *following* lines
            let fullDetails = '';
            let detailsLines = [];
            let nextLineIndex = i + 1;
            while (nextLineIndex < lines.length && !lines[nextLineIndex].match(dataLineRegex)) {
                 const nextLine = lines[nextLineIndex];
                 // Stop if we hit known non-detail lines
                 if (nextLine.match(/Page :|Balance c\/f|Opening Balance/i) || nextLine.startsWith('---')) break;
                 detailsLines.push(nextLine);
                 console.info(`  -> Reading detail line ${nextLineIndex + 1}: "${nextLine}"`);
                 nextLineIndex++;
            }
            // Crucially, update the main loop index ONLY AFTER processing details
            i = nextLineIndex - 1;

            fullDetails = detailsLines.join(' ').replace(/\s+/g, ' ').trim();
            console.info(`  -> Combined Details: "${fullDetails}"`);


            let description = fullDetails; // Default description
            let reference = '';
            let destinatory = '';

            // --- Reference and Destinatory Extraction from fullDetails ---
            const refMatch = fullDetails.match(referenceRegex);
            if (refMatch && refMatch[0]) {
                reference = refMatch[0].trim();
                const refIndex = fullDetails.indexOf(reference);
                const textBeforeRef = fullDetails.substring(0, refIndex).trim();
                let textAfterRef = fullDetails.substring(refIndex + reference.length).trim();

                // Description starts with text before ref + ref itself
                description = (textBeforeRef ? textBeforeRef + ' ' : '') + reference;

                const separatorMatch = textAfterRef.match(separatorRegex);
                if (separatorMatch && separatorMatch.index !== undefined) {
                    const partBeforeSep = textAfterRef.substring(0, separatorMatch.index).trim();
                    const potentialDest = textAfterRef.substring(separatorMatch.index + separatorMatch[0].length).trim();
                     description += (partBeforeSep ? ' ' + partBeforeSep : '') + separatorMatch[0]; // Add separator to desc
                     if (potentialDest) {
                         destinatory = potentialDest;
                     }
                     textAfterRef = ''; // Consumed
                }

                 if (textAfterRef) {
                    const firstWordAfterRef = textAfterRef.split(' ')[0]?.toUpperCase();
                    if (firstWordAfterRef && (destinatoryKeywords.includes(firstWordAfterRef) || textAfterRef.match(/^[A-Z\s.&'-]+LTD|^[A-Z\s.&'-]+CO LTD|^[MR|MRS|MS|MISS]+\s/i))) {
                       destinatory = textAfterRef; // Assume remaining is destinatory
                       // Decide if description should ONLY be reference if destinatory found? Let's keep it combined for now.
                    } else {
                         // Doesn't look like destinatory, append to description
                        description += ' ' + textAfterRef;
                    }
                }
            } else {
                // No standard reference found
                description = fullDetails;
            }

            // Final cleanups
            description = description.replace(/\s+/g, ' ').trim();
            reference = reference.replace(/\s+/g, ' ').trim();
            destinatory = destinatory.replace(/\s+/g, ' ').trim();

            const transaction: ParsedTransaction = {
                date,
                description,
                amount,
                type,
                balance,
                reference,
                destinatory,
                category: getCategoryFromDescription(description || reference)
            };

            console.info(`  -> FINAL Parsed Tx V5: D='${transaction.description}' | R='${transaction.reference}' | Dest='${transaction.destinatory}' | Amt=${transaction.amount} ${transaction.type} | Bal=${transaction.balance}`);
            transactions.push(transaction);
        }
    }

    console.info(`MCB Parser V5: --- Finished Processing. Extracted ${transactions.length} transactions. ---`);
    if(transactions.length === 0) {
      console.error("MCB Parser V5 FAILED TO EXTRACT TRANSACTIONS. Review logs and PDF text.");
    }
    return transactions;
}