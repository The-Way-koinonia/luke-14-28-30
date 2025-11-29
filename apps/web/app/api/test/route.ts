import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await db.query<{ time: Date }>('SELECT NOW() as time');
    
    // Count tables
    const tables = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    
    // Get a few table names
    const tableNames = await db.query<{ tablename: string }>(
      `SELECT tablename 
       FROM pg_tables 
       WHERE schemaname = 'public' 
       LIMIT 5`
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected!',
      timestamp: result[0].time,
      tableCount: tables[0].count,
      sampleTables: tableNames.map(t => t.tablename)
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database connection failed', 
        error: String(error) 
      },
      { status: 500 }
    );
  }
}