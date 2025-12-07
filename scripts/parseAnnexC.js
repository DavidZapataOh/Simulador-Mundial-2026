/**
 * Script to parse Annex C from FIFA regulations PDF
 * Extracts the third-place matrix (495 options)
 * Run with: node scripts/parseAnnexC.js
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse/lib/pdf-parse');

// Groups in order
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// Generate all 495 combinations of 4 missing groups in lexicographic order
function generateMissingCombos() {
    const combos = [];
    for (let i = 0; i < GROUPS.length; i++) {
        for (let j = i + 1; j < GROUPS.length; j++) {
            for (let k = j + 1; k < GROUPS.length; k++) {
                for (let l = k + 1; l < GROUPS.length; l++) {
                    combos.push([GROUPS[i], GROUPS[j], GROUPS[k], GROUPS[l]]);
                }
            }
        }
    }
    return combos;
}

async function parsePDF() {
    const pdfPath = path.join(__dirname, '../docs/FWC26_Competition Regulations_EN.pdf');
    console.log('Reading PDF from:', pdfPath);

    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);

    console.log('PDF has', data.numpages, 'pages');
    console.log('Searching for Annex C table...');

    // Write raw text to file for inspection
    const rawTextPath = path.join(__dirname, 'pdf_raw_text.txt');
    fs.writeFileSync(rawTextPath, data.text);
    console.log('Raw PDF text saved to:', rawTextPath);

    // Parse the table data
    const lines = data.text.split('\n');
    const tableRows = [];

    // Pattern: option number followed by 8 third-place IDs (3A-3L)
    // May have spaces or be compact
    const rowPattern = /^(\d{1,3})\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])\s+(3[A-L])/;

    for (const line of lines) {
        const match = line.match(rowPattern);
        if (match) {
            const option = parseInt(match[1], 10);
            if (option >= 1 && option <= 495) {
                tableRows.push({
                    option,
                    values: [match[2], match[3], match[4], match[5], match[6], match[7], match[8], match[9]]
                });
            }
        }
    }

    console.log('Found', tableRows.length, 'rows with standard pattern');

    if (tableRows.length < 495) {
        // Try alternative parsing - look for dense 3X patterns
        console.log('Trying alternative parsing...');

        // Find lines with multiple 3X patterns
        const denseLines = lines.filter(line => {
            const matches = line.match(/3[A-L]/g);
            return matches && matches.length >= 8;
        });

        console.log('Found', denseLines.length, 'lines with 8+ third-place patterns');

        // Try to extract from these lines
        for (const line of denseLines) {
            // Extract all 3X patterns
            const thirdPlaceMatches = line.match(/3[A-L]/g);
            if (thirdPlaceMatches && thirdPlaceMatches.length >= 8) {
                // Try to find the option number
                const numMatch = line.match(/^(\d{1,3})/);
                if (numMatch) {
                    const option = parseInt(numMatch[1], 10);
                    if (option >= 1 && option <= 495 && !tableRows.find(r => r.option === option)) {
                        // Take exactly 8 values
                        tableRows.push({
                            option,
                            values: thirdPlaceMatches.slice(0, 8)
                        });
                    }
                }
            }
        }

        console.log('After alternative parsing:', tableRows.length, 'rows');
    }

    // Sort by option
    tableRows.sort((a, b) => a.option - b.option);

    if (tableRows.length === 495) {
        generateTSFile(tableRows);
    } else {
        console.log('\n=== Could not find all 495 rows ===');
        console.log('Check pdf_raw_text.txt and look for Annex C section');

        // Show some samples from the raw text
        const annexIdx = data.text.toLowerCase().indexOf('annex');
        if (annexIdx !== -1) {
            console.log('\n--- Text near "annex" ---');
            console.log(data.text.substring(annexIdx, annexIdx + 1500));
        }

        // Look for "Option" or numbered rows
        const optionLines = lines.filter(l => l.includes('Option') || /^\s*\d{1,3}\s+/.test(l)).slice(0, 20);
        console.log('\n--- Sample lines with numbers ---');
        optionLines.forEach(l => console.log(l));
    }
}

function generateTSFile(rows) {
    const missingCombos = generateMissingCombos();

    console.log('\n=== Generating TypeScript file ===');
    console.log('Missing combos generated:', missingCombos.length);

    // Build the matrix
    const matrix = rows.map(row => ({
        option: row.option,
        missingGroups: missingCombos[row.option - 1],
        assignments: {
            "1A": row.values[0],
            "1B": row.values[1],
            "1D": row.values[2],
            "1E": row.values[3],
            "1G": row.values[4],
            "1I": row.values[5],
            "1K": row.values[6],
            "1L": row.values[7],
        }
    }));

    // Generate TypeScript file content
    let tsContent = `/**
 * Third Place Matrix - FIFA World Cup 2026
 * Generated from FIFA Competition Regulations Annex C
 * 495 combinations for eight best third-placed teams
 */

// All possible group letters in 2026
export type GroupLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

// The ID of a third-placed team from a group, e.g. "3A", "3B", ...
export type ThirdPlaceId = \`3\${GroupLetter}\`;

// Groups that do NOT have a qualifying 3rd place, sorted alphabetically
export type MissingGroups = [GroupLetter, GroupLetter, GroupLetter, GroupLetter];

// Mapping from 1st-place team to the 3rd-place team they face in the Round of 32
export interface ThirdPlaceAssignments {
  "1A": ThirdPlaceId;
  "1B": ThirdPlaceId;
  "1D": ThirdPlaceId;
  "1E": ThirdPlaceId;
  "1G": ThirdPlaceId;
  "1I": ThirdPlaceId;
  "1K": ThirdPlaceId;
  "1L": ThirdPlaceId;
}

// One row/option from Annex C
export interface ThirdPlaceOption {
  option: number;            // 1..495, as in the Annex C table
  missingGroups: MissingGroups;
  assignments: ThirdPlaceAssignments;
}

// Entire matrix = all 495 options
export type ThirdPlaceMatrix = ThirdPlaceOption[];

// The complete matrix from Annex C
export const THIRD_PLACE_MATRIX: ThirdPlaceMatrix = [
`;

    for (const opt of matrix) {
        const mg = opt.missingGroups;
        const a = opt.assignments;
        tsContent += `  { option: ${opt.option}, missingGroups: ["${mg[0]}", "${mg[1]}", "${mg[2]}", "${mg[3]}"], assignments: { "1A": "${a["1A"]}", "1B": "${a["1B"]}", "1D": "${a["1D"]}", "1E": "${a["1E"]}", "1G": "${a["1G"]}", "1I": "${a["1I"]}", "1K": "${a["1K"]}", "1L": "${a["1L"]}" } },\n`;
    }

    tsContent += `];

// Helper to find the correct option based on which 8 groups have advancing third-place teams
export function findThirdPlaceOption(qualifyingGroups: GroupLetter[]): ThirdPlaceOption | undefined {
  if (qualifyingGroups.length !== 8) return undefined;
  
  const sortedQualifying = [...qualifyingGroups].sort();
  const allGroups: GroupLetter[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const missingGroups = allGroups.filter(g => !sortedQualifying.includes(g)).sort() as MissingGroups;
  
  if (missingGroups.length !== 4) return undefined;
  
  return THIRD_PLACE_MATRIX.find(opt => 
    opt.missingGroups[0] === missingGroups[0] &&
    opt.missingGroups[1] === missingGroups[1] &&
    opt.missingGroups[2] === missingGroups[2] &&
    opt.missingGroups[3] === missingGroups[3]
  );
}
`;

    // Ensure directory exists
    const outputPath = path.join(__dirname, '../src/data/thirdPlaceMatrix.ts');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, tsContent);
    console.log('Generated:', outputPath);
    console.log('Total options:', matrix.length);

    // Sanity checks
    console.log('\n=== Sanity Checks ===');
    console.log('First option:', JSON.stringify(matrix[0]));
    console.log('Second option:', JSON.stringify(matrix[1]));
    console.log('Third option:', JSON.stringify(matrix[2]));
    console.log('...');
    console.log('493rd option:', JSON.stringify(matrix[492]));
    console.log('494th option:', JSON.stringify(matrix[493]));
    console.log('Last option:', JSON.stringify(matrix[494]));
}

parsePDF().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
