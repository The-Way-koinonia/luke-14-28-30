const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const UPDATES_DIR = path.join(process.cwd(), 'data/updates');

// Helper Functions
function parseKeyValue(str) {
  // Parses "key=value" into { key: 'value' }
  const parts = str.split('=');
  if (parts.length < 2) {
    throw new Error(`Invalid key=value format: ${str}`);
  }
  const key = parts[0].trim();
  const value = parts.slice(1).join('=').trim(); // Handle values containing =
  
  // Try to parse as number if possible, but keep string if it starts with 0 and length > 1 (e.g. 01)
  // or if it's meant to be a string.
  // For simplicity, strict number check:
  const numValue = Number(value);
  return {
    [key]: (isNaN(numValue) || value === '') ? value : numValue
  };
}

function parseWhere(whereStr) {
  if (!whereStr) return {};
  return whereStr.split(',').reduce((acc, pair) => {
    return { ...acc, ...parseKeyValue(pair) };
  }, {});
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    _: [],
    version: null,
    description: null,
    table: null,
    operation: null,
    where: null,
    set: null,
    data: null,
    update: [], // For multiple updates
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      if (key === 'update') {
        // format: --update table where_clause set_clause
        if (i + 3 < args.length) {
          parsed.update.push({
            table: args[++i],
            where: args[++i],
            data: args[++i] 
          });
        }
      } else {
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('--')) {
          parsed[key] = nextArg;
          i++;
        } else {
          parsed[key] = true;
        }
      }
    } else {
      parsed._.push(arg);
    }
  }
  return parsed;
}

// Main logic
async function main() {
  try {
    const args = parseArgs();

    // Check if interactive mode is needed
    if (process.argv.length <= 2) {
      console.log('Interactive mode not yet implemented. Please use command line arguments.');
      process.exit(0);
    }

    // Validation
    if (!args.version) throw new Error('Missing --version');
    if (!args.description) throw new Error('Missing --description');

    const version = parseInt(args.version, 10);
    if (isNaN(version)) throw new Error('Version must be a number');

    const changes = [];

    // correct parsing for single operation
    if (args.table && args.operation) {
        let change = {
            table: args.table,
            operation: args.operation
        };

        if (args.operation === 'update') {
            if (!args.where) throw new Error('UPDATE operation requires --where');
            if (!args.set && !args.data) throw new Error('UPDATE operation requires --set or --data');
            change.where = parseWhere(args.where);
            change.data = parseWhere(args.set || args.data);
        } else if (args.operation === 'insert') {
             if (!args.data) throw new Error('INSERT operation requires --data');
             change.data = parseWhere(args.data);
        } else if (args.operation === 'delete') {
            if (!args.where) throw new Error('DELETE operation requires --where');
            change.where = parseWhere(args.where);
        }
        changes.push(change);
    }

    // handle multiple updates via --update
    if (args.update && args.update.length > 0) {
        args.update.forEach(u => {
            changes.push({
                table: u.table,
                operation: 'update',
                where: parseWhere(u.where),
                data: parseWhere(u.data)
            });
        });
    }

    if (changes.length === 0) {
        throw new Error('No changes specified. Use --table/--operation or --update');
    }

    const outputFile = path.join(UPDATES_DIR, `update-v${version}.json`);
    
    // Ensure directory exists
    if (!fs.existsSync(UPDATES_DIR)) {
        fs.mkdirSync(UPDATES_DIR, { recursive: true });
    }

    if (fs.existsSync(outputFile)) {
        // Simple overwrite check (for CLI automation, maybe just fail or warn)
        console.warn(`Warning: Output file ${outputFile} already exists and will be overwritten.`);
    }

    const output = {
        version: version,
        description: args.description,
        created_at: new Date().toISOString(),
        created_by: process.env.USER || 'developer',
        changes: changes
    };

    // Summary
    console.log(`Creating delta update v${version}:`);
    console.log(`  Description: ${output.description}`);
    console.log(`  Changes: ${changes.length}`);
    changes.forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.operation.toUpperCase()} ${c.table}`);
        if (c.where) console.log(`       WHERE ${JSON.stringify(c.where)}`);
        if (c.data) console.log(`       DATA ${JSON.stringify(c.data)}`);
    });

    const jsonStr = JSON.stringify(output, null, 2);
    console.log(`\nOutput file: ${outputFile}`);
    console.log(`Size: ${jsonStr.length} bytes`);

    fs.writeFileSync(outputFile, jsonStr);
    console.log('\n✅ Delta update file created successfully.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
