import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function POST() {
  try {
    // Instead of reading from file, let's put the migration here directly
    const migrationQueries = [
      // Enable UUID extension
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
      
      // Create users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        subscription_plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create platforms table
      `CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(50) NOT NULL,
        base_url VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Insert platforms data
      `INSERT INTO platforms (name, display_name, base_url) VALUES
      ('instagram', 'Instagram', 'https://instagram.com'),
      ('youtube', 'YouTube', 'https://youtube.com'),
      ('tiktok', 'TikTok', 'https://tiktok.com'),
      ('twitter', 'Twitter/X', 'https://twitter.com'),
      ('facebook', 'Facebook', 'https://facebook.com'),
      ('linkedin', 'LinkedIn', 'https://linkedin.com')
      ON CONFLICT (name) DO NOTHING`,
    ];
    
    // Execute each query
    for (const query of migrationQueries) {
      await executeQuery(query);
      console.log('✅ Migration query executed');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ Database migration completed successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: '❌ Database migration failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}