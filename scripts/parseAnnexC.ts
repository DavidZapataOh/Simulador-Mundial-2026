/**
 * Script to parse Annex C from FIFA regulations PDF
 * Extracts the third-place matrix (495 options)
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Types
type GroupLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
type ThirdPlaceId = `3${GroupLetter}`;
type MissingGroups = [GroupLetter, GroupLetter, GroupLetter, GroupLetter];

interface ThirdPlaceAssignments {
  "1A": ThirdPlaceId;
  "1B": ThirdPlaceId;
  "1D": ThirdPlaceId;
  "1E": ThirdPlaceId;
  "1G": ThirdPlaceId;
  "1I": ThirdPlaceId;
  "1K": ThirdPlaceId;
  "1L": ThirdPlaceId;
}

interface ThirdPlaceOption {
  option: number;
  missingGroups: MissingGroups;
  assignments: ThirdPlaceAssignments;
}

// Generate all 495 combinations of 4 missing groups in lexicographic order
const GROUPS: GroupLetter[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

function generateMissingCombos(): MissingGroups[] {
  const combos: MissingGroups[] = [];
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
  const dataBuffer = fs.readFileSync(pdfPath);
  
  const data = await pdf(dataBuffer);
  
  // Extract text
  const text = data.text;
  
  // Find Annex C section
  console.log('Searching for Annex C...');
  
  // Write raw text to file for manual inspection
  fs.writeFileSync(path.join(__dirname, 'pdf_raw_text.txt'), text);
  console.log('Raw PDF text saved to scripts/pdf_raw_text.txt');
  
  // Parse the table data
  // Each row should have: option_number followed by 8 values like 3A, 3B, etc.
  const lines = text.split('\n');
  const tableRows: { option: number; values: string[] }[] = [];
  
  // Look for lines that start with a number 1-495 followed by 8 third-place IDs
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
  
  console.log(`Found ${tableRows.length} rows`);
  
  if (tableRows.length === 495) {
    generateTSFile(tableRows);
  } else {
    console.log('Did not find 495 rows. Check pdf_raw_text.txt for manual inspection.');
    // Try alternative parsing
    alternativeParsing(text);
  }
}

function alternativeParsing(text: string) {
  // Try to find the Annex C section and parse differently
  const annexCStart = text.indexOf('ANNEX');
  if (annexCStart !== -1) {
    const annexCText = text.substring(annexCStart);
    console.log('\n--- Annex C section preview ---');
    console.log(annexCText.substring(0, 2000));
  }
  
  // Look for sequences of third-place IDs
  const thirdPlacePattern = /3[A-L]/g;
  const matches = text.match(thirdPlacePattern);
  console.log(`\nTotal 3X patterns found: ${matches?.length || 0}`);
  
  // We expect 495 * 8 = 3960 third-place IDs
  if (matches && matches.length >= 3960) {
    console.log('Enough patterns found. Attempting structured extraction...');
    
    // Find section with dense third-place IDs
    const lines = text.split('\n').filter(line => {
      const count = (line.match(/3[A-L]/g) || []).length;
      return count >= 8; // Lines with 8+ third-place IDs are likely table rows
    });
    
    console.log(`Found ${lines.length} lines with 8+ third-place patterns`);
    
    // Try to extract from these lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`Sample line ${i}: ${lines[i]}`);
    }
  }
}

function generateTSFile(rows: { option: number; values: string[] }[]) {
  const missingCombos = generateMissingCombos();
  
  // Sort by option number
  rows.sort((a, b) => a.option - b.option);
  
  const matrix: ThirdPlaceOption[] = rows.map(row => ({
    option: row.option,
    missingGroups: missingCombos[row.option - 1],
    assignments: {
      "1A": row.values[0] as ThirdPlaceId,
      "1B": row.values[1] as ThirdPlaceId,
      "1D": row.values[2] as ThirdPlaceId,
      "1E": row.values[3] as ThirdPlaceId,
      "1G": row.values[4] as ThirdPlaceId,
      "1I": row.values[5] as ThirdPlaceId,
      "1K": row.values[6] as ThirdPlaceId,
      "1L": row.values[7] as ThirdPlaceId,
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
    tsContent += `  { option: ${opt.option}, missingGroups: ["${opt.missingGroups.join('", "')}"], assignments: { "1A": "${opt.assignments["1A"]}", "1B": "${opt.assignments["1B"]}", "1D": "${opt.assignments["1D"]}", "1E": "${opt.assignments["1E"]}", "1G": "${opt.assignments["1G"]}", "1I": "${opt.assignments["1I"]}", "1K": "${opt.assignments["1K"]}", "1L": "${opt.assignments["1L"]}" } },\n`;
  }

  tsContent += `];

// Helper to find the correct option based on which 8 groups have advancing third-place teams
export function findThirdPlaceOption(qualifyingGroups: GroupLetter[]): ThirdPlaceOption | undefined {
  if (qualifyingGroups.length !== 8) return undefined;
  
  const sortedQualifying = [...qualifyingGroups].sort();
  const allGroups: GroupLetter[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const missingGroups = allGroups.filter(g => !sortedQualifying.includes(g)).sort();
  
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
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, tsContent);
  console.log(`Generated ${outputPath}`);
  console.log(`Total options: ${matrix.length}`);
  
  // Sanity checks
  console.log('\n--- Sanity Checks ---');
  console.log(`First option: ${JSON.stringify(matrix[0])}`);
  console.log(`Last option: ${JSON.stringify(matrix[matrix.length - 1])}`);
}

parsePDF().catch(console.error);
