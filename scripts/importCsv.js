/**
 * Import wrestler rankings from a CSV file
 * This is a practical alternative to web scraping.
 */
import fs from 'fs';
import csv from 'csv-parser';
import readline from 'readline';
import { initDatabase, Wrestler } from '../src/database.js';

async function importFromCsv(csvFile = 'wrestlers.csv') {
  /**
   * Import wrestlers from a CSV file.
   *
   * CSV Format:
   * rank,name,school,weight_class,grade,source
   * 1,Spencer Lee,Iowa,125,SR,FloWrestling
   * 2,Patrick Glory,Princeton,125,JR,FloWrestling
   * ...
   *
   * Note: grade is optional and should be one of: FR, SO, JR, SR
   */
  console.log(`Importing wrestlers from ${csvFile}...`);

  try {
    await initDatabase();

    // Check if file exists
    if (!fs.existsSync(csvFile)) {
      console.log(`❌ File not found: ${csvFile}`);
      console.log('\nCreate a CSV file with this format:');
      console.log('rank,name,school,weight_class,grade,source');
      console.log('1,Spencer Lee,Iowa,125,SR,Manual');
      console.log('2,Patrick Glory,Princeton,125,JR,Manual');
      console.log('...');
      console.log('\nNote: grade is optional and should be one of: FR, SO, JR, SR');
      process.exit(1);
    }

    // Check existing data
    const existingCount = await Wrestler.count();
    if (existingCount > 0) {
      const shouldDelete = await askQuestion(`Delete ${existingCount} existing records? (y/n): `);
      if (shouldDelete.toLowerCase() === 'y') {
        await Wrestler.destroy({ where: {}, truncate: true });
        console.log(`✓ Cleared ${existingCount} existing records`);
      }
    }

    // Import new data
    const wrestlers = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (row) => {
          // Normalize grade to match enum values
          let grade = row.grade ? row.grade.trim().toUpperCase() : null;
          if (grade && !['FR', 'SO', 'JR', 'SR'].includes(grade)) {
            console.warn(`Warning: Invalid grade "${row.grade}" for ${row.name}, skipping grade`);
            grade = null;
          }

          wrestlers.push({
            rank: parseInt(row.rank),
            name: row.name,
            school: row.school,
            weight_class: row.weight_class,
            grade: grade,
            source: row.source || 'CSV Import'
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Bulk insert
    await Wrestler.bulkCreate(wrestlers);
    console.log(`✅ Successfully imported ${wrestlers.length} wrestlers from CSV`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

function createSampleCsv() {
  /**
   * Create a sample CSV file
   */
  const sampleData = [
    ['rank', 'name', 'school', 'weight_class', 'grade', 'source'],
    [1, 'Spencer Lee', 'Iowa', '125', 'SR', 'Manual'],
    [1, 'Nick Suriano', 'Rutgers', '133', 'SR', 'Manual'],
    [2, 'Daton Fix', 'Oklahoma State', '133', 'JR', 'Manual'],
    [1, 'Austin DeSanto', 'Iowa', '141', 'SR', 'Manual'],
    [2, 'Jaydin Eierman', 'Iowa', '141', 'JR', 'Manual'],
    [1, 'Yianni Diakomihalis', 'Cornell', '149', 'SR', 'Manual'],
    [1, 'David Carr', 'Iowa State', '157', 'SO', 'Manual'],
    [1, 'Alex Marinelli', 'Iowa', '165', 'SR', 'Manual'],
    [1, 'Carter Starocci', 'Penn State', '174', 'SO', 'Manual'],
    [2, 'Michael Kemerer', 'Iowa', '174', 'SR', 'Manual'],
    [1, 'Aaron Brooks', 'Penn State', '184', 'JR', 'Manual'],
    [1, 'Myles Amine', 'Michigan', '197', 'SR', 'Manual'],
    [1, 'Gable Steveson', 'Minnesota', '285', 'FR', 'Manual']
  ];

  const csvContent = sampleData.map(row => row.join(',')).join('\n');
  fs.writeFileSync('wrestlers_sample.csv', csvContent, 'utf-8');

  console.log('✓ Created wrestlers_sample.csv');
  console.log('Edit this file with your own data, then run:');
  console.log('  node scripts/importCsv.js wrestlers_sample.csv');
  console.log('\nNote: grade column is optional but should be one of: FR, SO, JR, SR');
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.length > 0) {
  if (args[0] === 'create') {
    createSampleCsv();
  } else {
    importFromCsv(args[0]);
  }
} else {
  importFromCsv();
}
