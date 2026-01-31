import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DatabaseUpdate, DatabaseChange } from '@the-way/types';

// Force dynamic to ensure we check files on every request (though they are static, 
// in a real deployment this might be cached or read from DB)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientVersionParam = searchParams.get('current_version');
    const clientVersion = clientVersionParam ? parseInt(clientVersionParam, 10) : 0;

    // Directory where updates are stored
    // In production (Vercel/Docker), we need to ensure this path is correct. 
    // For now assuming standard Next.js structure.
    const updatesDir = path.join(process.cwd(), 'src/data/updates');
    
    if (!fs.existsSync(updatesDir)) {
      // No updates directory means no updates found yet
       return NextResponse.json({
        latest_version: clientVersion, // No update
        current_version: clientVersion,
        has_updates: false,
        changes: [],
        update_size_bytes: 0,
        description: 'No updates available'
      } as DatabaseUpdate);
    }

    const files = fs.readdirSync(updatesDir).filter(f => f.startsWith('update-v') && f.endsWith('.json'));
    
    // Sort files by version number
    const updates = files.map(file => {
      try {
        const filePath = path.join(updatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (e) {
        console.error(`Failed to parse update file ${file}`, e);
        return null;
      }
    }).filter(u => u !== null)
      .sort((a, b) => a.latest_version - b.latest_version);

    if (updates.length === 0) {
      return NextResponse.json({
        latest_version: clientVersion,
        current_version: clientVersion,
        has_updates: false,
        changes: [],
        update_size_bytes: 0, 
        description: 'No updates found'
      } as DatabaseUpdate);
    }

    const latestUpdate = updates[updates.length - 1];
    const latestVersion = latestUpdate.latest_version;

    if (latestVersion <= clientVersion) {
      return NextResponse.json({
        latest_version: latestVersion,
        current_version: clientVersion,
        has_updates: false,
        changes: [],
        update_size_bytes: 0,
        description: 'Up to date'
      } as DatabaseUpdate);
    }

    // Collect all changes from clientVersion + 1 up to latestVersion
    const relevantUpdates = updates.filter(u => u.latest_version > clientVersion);
    
    let allChanges: DatabaseChange[] = [];
    let combinedDescription = '';

    for (const update of relevantUpdates) {
      if (update.changes) {
        allChanges = [...allChanges, ...update.changes];
      }
      if (update.description) {
        combinedDescription += (combinedDescription ? '; ' : '') + update.description;
      }
    }

    const response: DatabaseUpdate = {
      latest_version: latestVersion,
      current_version: clientVersion,
      has_updates: true,
      changes: allChanges,
      update_size_bytes: JSON.stringify(allChanges).length,
      description: combinedDescription || 'New updates available'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Database update check failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
