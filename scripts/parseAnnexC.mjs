/**
 * Script to parse Annex C from FIFA regulations PDF
 * Using pdfjs-dist for parsing
 * Run with: node --experimental-vm-modules scripts/parseAnnexC.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await getDocument({ data }).promise;

    console.log('PDF has', pdf.numPages, 'pages');
    console.log('Extracting text from all pages...');

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    // Save raw text
    const rawTextPath = path.join(__dirname, 'pdf_raw_text.txt');
    fs.writeFileSync(rawTextPath, fullText);
    console.log('Raw PDF text saved to:', rawTextPath);

    // Parse the table data
    const tableRows = [];

    // Split by whitespace and look for patterns
    const tokens = fullText.split(/\s+/);

    // Find sequences: number (1-495) followed by 8 third-place IDs (3A-3L)
    for (let i = 0; i < tokens.length - 8; i++) {
        const num = parseInt(tokens[i], 10);
        if (num >= 1 && num <= 495) {
            // Check if next 8 tokens are all 3X patterns
            const next8 = tokens.slice(i + 1, i + 9);
            if (next8.every(t => /^3[A-L]$/.test(t))) {
                if (!tableRows.find(r => r.option === num)) {
                    tableRows.push({
                        option: num,
                        values: next8
                    });
                }
            }
        }
    }

    console.log('Found', tableRows.length, 'rows');

    // Sort by option
    tableRows.sort((a, b) => a.option - b.option);

    if (tableRows.length === 495) {
        generateTSFile(tableRows);
    } else {
        console.log('\n=== Did not find all 495 rows ===');
        console.log('Found options:', tableRows.map(r => r.option).join(', '));

        // Show some context
        const annexIdx = fullText.toLowerCase().indexOf('annex');
        if (annexIdx !== -1) {
            console.log('\n--- Text near "annex" ---');
            console.log(fullText.substring(annexIdx, annexIdx + 2000));
        }
    }
}

function generateTSFile(rows) {
    const missingCombos = generateMissingCombos();

    console.log('\n=== Generating TypeScript file ===');

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

    const outputPath = path.join(__dirname, '../src/data/thirdPlaceMatrix.ts');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, tsContent);
    console.log('Generated:', outputPath);
    console.log('Total options:', matrix.length);

    console.log('\n=== Sanity Checks ===');
    console.log('First 3 options:');
    console.log(JSON.stringify(matrix[0], null, 2));
    console.log(JSON.stringify(matrix[1], null, 2));
    console.log(JSON.stringify(matrix[2], null, 2));
    console.log('\nLast 3 options:');
    console.log(JSON.stringify(matrix[492], null, 2));
    console.log(JSON.stringify(matrix[493], null, 2));
    console.log(JSON.stringify(matrix[494], null, 2));
}

parsePDF().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
