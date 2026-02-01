import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Directory where delta update JSON files are stored
// Assuming apps/web is CWD, so data is at ../../data
const UPDATES_DIR = path.join(process.cwd(), '../../data/updates');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currentVersionParam = searchParams.get('current_version');
    
    if (!currentVersionParam) {
        return NextResponse.json({ error: 'Missing current_version parameter' }, { status: 400 });
    }

    const currentVersion = parseInt(currentVersionParam, 10);
    
    // Validation
    if (isNaN(currentVersion) || currentVersion < 0) { // Allow 0 or 1 as start
      return NextResponse.json({
        error: 'Invalid current_version parameter'
      }, { status: 400 });
    }
    
    // Ensure directory exists
    if (!fs.existsSync(UPDATES_DIR)) {
        // If no updates directory, nothing to update.
         return NextResponse.json({
            latest_version: currentVersion,
            current_version: currentVersion,
            has_updates: false,
            changes: [],
            description: 'No updates system found'
          });
    }

    // Find all available update files
    const updateFiles = fs.readdirSync(UPDATES_DIR)
      .filter(file => file.startsWith('update-v') && file.endsWith('.json'))
      .map(file => {
        const match = file.match(/update-v(\d+)\.json/);
        return { 
            file, 
            version: match ? parseInt(match[1], 10) : 0 
        };
      })
      .sort((a, b) => a.version - b.version);
    
    // Find latest version
    const latestVersion = updateFiles.length > 0 
      ? updateFiles[updateFiles.length - 1].version 
      : 1;
    
    // Client is up to date
    if (currentVersion >= latestVersion) {
      return NextResponse.json({
        latest_version: latestVersion,
        current_version: currentVersion,
        has_updates: false,
        changes: [],
        description: 'Database is up to date'
      });
    }
    
    // Collect all updates between current and latest
    const updatesToApply = updateFiles.filter(
      update => update.version > currentVersion
    );
    
    // Combine all changes from multiple update files
    const allChanges: any[] = [];
    let combinedDescription: string[] = [];
    
    for (const update of updatesToApply) {
      const filePath = path.join(UPDATES_DIR, update.file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const updateData = JSON.parse(fileContent);
      
      if (updateData.changes && Array.isArray(updateData.changes)) {
          allChanges.push(...updateData.changes);
      }
      if (updateData.description) {
          combinedDescription.push(`v${update.version}: ${updateData.description}`);
      }
    }
    
    // Calculate approximate response size
    const responseData = {
      latest_version: latestVersion,
      current_version: currentVersion,
      has_updates: true,
      changes: allChanges,
      update_size_bytes: JSON.stringify(allChanges).length,
      description: combinedDescription.join('; ')
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error serving database updates:', error);
    return NextResponse.json({
      error: 'Failed to retrieve database updates'
    }, { status: 500 });
  }
}
