const parserUtils = require('./utils');

/**
 * Extract transactions from MCB bank statement text content. V7
 * Handles concatenated dates and amounts, missing description parts on the main line.
 * @param {string} text Bank statement text content
 * @returns {Array} Array of parsed transactions
 */
function extractMCBTransactions(text) {
    const transactions = [];
    // Normalize line endings and trim/filter lines
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
                    .map(line => line.trim())
                    .filter(line => line);

    console.info(`MCB Parser V7: --- Starting Processing ---`);
    console.info(`MCB Parser V7: Processing ${lines.length} non-empty lines.`);

    // Regex V7: Matches optional space between dates, optional description part, optional debit, optional credit, mandatory balance
    // Groups: 1:TransDate, 2:ValueDate, 3:Optional DescPart1, 4:Optional Debit, 5:Optional Credit, 6:Balance
    // Crucially uses \s* for optional spacing and makes description part non-greedy and optional
    const dataLineRegex = /^(\d{2}\/\d{2}\/\d{4})\s*(\d{2}\/\d{2}\/\d{4})\s*(.*?)\s*([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})$/;

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
            console.info(`\nMCB Parser V7: Matched data line ${i + 1}: "${line}"`);
            // Adjusted group indices based on the new regex V7
            const [, transDateStr, valueDateStr, descriptionPart1, debitStrRaw, creditStrRaw, balanceStr] = match;

            console.info(`  -> Raw Matches: Date1='${transDateStr}', Date2='${valueDateStr}', DescPart1='${descriptionPart1}', DebitRaw='${debitStrRaw}', CreditRaw='${creditStrRaw}', BalanceRaw='${balanceStr}'`);

            const date = parserUtils.parseDate(transDateStr);
            const balance = parserUtils.parseAmount(balanceStr);

            // --- Refined Logic to determine Debit/Credit V7 ---
            let debit = 0;
            let credit = 0;

            // MCB Debit is typically in the first amount column (Group 4), Credit in the second (Group 5)
            if (debitStrRaw) {
                debit = parserUtils.parseAmount(debitStrRaw);
                console.info(`  -> Parsed Debit (Group 4): ${debit}`);
            }
            if (creditStrRaw) {
                credit = parserUtils.parseAmount(creditStrRaw);
                 console.info(`  -> Parsed Credit (Group 5): ${credit}`);
            }

            // Determine the actual transaction amount and type
            const amount = Math.max(debit, credit);
            // If both are > 0, debit usually takes precedence if it exists, otherwise credit. If only one > 0, use that type.
            const type = debit > 0 ? 'debit' : (credit > 0 ? 'credit' : 'debit'); // Default to debit if both somehow 0 but amount > 0 (unlikely)

             if (amount === 0) {
                  console.warn(`  -> Skipping line ${i+1} due to zero transaction amount calculated (Debit=${debit}, Credit=${credit}).`);
                  continue;
             }
             console.info(`  -> Calculated: Amount=${amount}, Type=${type}, Balance=${balance}`);

            // --- Description, Reference, Destinatory Extraction ---
            // Start with the description part captured from the main line (if any)
            let combinedDescription = descriptionPart1 || '';

            // Look for the details on the *following* lines
            let detailsLines = [];
            let nextLineIndex = i + 1;
            while (nextLineIndex < lines.length && !lines[nextLineIndex].match(dataLineRegex)) {
                 const nextLine = lines[nextLineIndex];
                 if (nextLine.match(/Page\s*:\s*\d+|Balance c\/f|Opening Balance/i) || nextLine.startsWith('---')) {
                    console.info(`  -> Stopping detail read at line ${nextLineIndex + 1}: Footer/Header found.`);
                    break;
                 }
                 detailsLines.push(nextLine);
                 console.info(`  -> Reading detail line ${nextLineIndex + 1}: "${nextLine}"`);
                 nextLineIndex++;
            }
            // Update the main loop index
            i = nextLineIndex - 1;

            // Prepend the captured description part to the joined detail lines
            const fullDetails = (combinedDescription + ' ' + detailsLines.join(' ')).replace(/\s+/g, ' ').trim();
            console.info(`  -> Combined Details: "${fullDetails}"`);

            let description = fullDetails; // Default description
            let reference = '';
            let destinatory = '';

            // --- Reference and Destinatory Extraction Logic (Unchanged) ---
            const refMatch = fullDetails.match(referenceRegex);
            if (refMatch && refMatch[0]) {
                reference = refMatch[0].trim();
                const refIndex = fullDetails.indexOf(reference);
                const textBeforeRef = fullDetails.substring(0, refIndex).trim();
                let textAfterRef = fullDetails.substring(refIndex + reference.length).trim();

                description = (textBeforeRef ? textBeforeRef + ' ' : '') + reference;

                const separatorMatch = textAfterRef.match(separatorRegex);
                if (separatorMatch && separatorMatch.index !== undefined) {
                    const partBeforeSep = textAfterRef.substring(0, separatorMatch.index).trim();
                    const potentialDest = textAfterRef.substring(separatorMatch.index + separatorMatch[0].length).trim();
                     description += (partBeforeSep ? ' ' + partBeforeSep : '') + separatorMatch[0];
                     if (potentialDest) {
                         destinatory = potentialDest;
                     }
                     textAfterRef = '';
                }

                 if (textAfterRef) {
                    const firstWordAfterRef = textAfterRef.split(' ')[0]?.toUpperCase();
                    if (firstWordAfterRef && (destinatoryKeywords.includes(firstWordAfterRef) || textAfterRef.match(/^[A-Z\s.&'-]+(?:LTD|CO LTD|CO|LIMITED)$/i) || textAfterRef.match(/^(?:MR|MRS|MS|MISS)\s+[A-Z]/i))) {
                       destinatory = textAfterRef;
                    } else {
                        description += ' ' + textAfterRef;
                    }
                }
            } else {
                description = fullDetails;
            }

            // Final cleanups
            description = description.replace(/\s+/g, ' ').trim();
            reference = reference.replace(/\s+/g, ' ').trim();
            destinatory = destinatory.replace(/\s+/g, ' ').trim();

            // If description ended up empty but reference exists, use reference as description
            if (!description && reference) {
                description = reference;
            }

            const transaction = {
                date,
                description,
                amount,
                type,
                balance,
                reference,
                destinatory,
                category: parserUtils.getCategoryFromDescription(description || reference)
            };

            console.info(`  -> FINAL Parsed Tx V7: Date=${transaction.date.toISOString().split('T')[0]} | D='${transaction.description}' | R='${transaction.reference}' | Dest='${transaction.destinatory}' | Amt=${transaction.amount} ${transaction.type} | Bal=${transaction.balance}`);
            transactions.push(transaction);
        } else {
            // Log lines that *don't* match the main regex for debugging, filtering out common headers/footers
             const ignorePatterns = /Page\s*:\s*\d+|Balance c\/f|Opening Balance|Account Number|Current Account Statement|Statement from|BIC:|IBAN:|BRN:|TRANS\s+DATE|VALUE\s+DATE|TRANSACTION DETAILS|DEBIT|CREDIT|BALANCE/i;
            if (!line.match(ignorePatterns) && line.length > 5) {
                 console.warn(`MCB Parser V7: Line ${i+1} did not match dataLineRegex: "${line}"`);
            }
        }
    }

    console.info(`MCB Parser V7: --- Finished Processing. Extracted ${transactions.length} transactions. ---`);
    if(transactions.length === 0 && lines.length > 10) { // Added check for minimum lines to avoid false errors on empty files
      console.error("MCB Parser V7 FAILED TO EXTRACT ANY TRANSACTIONS despite having content. Review logs and PDF text.");
    }
    return transactions;
}

module.exports = { extractMCBTransactions }; 