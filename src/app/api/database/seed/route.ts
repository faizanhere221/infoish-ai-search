import { NextResponse } from 'next/server';
import { runAllSeeds } from '@/lib/database/seed';

export async function POST() {
  try {
    await runAllSeeds();
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ Database seeded successfully!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: '❌ Database seeding failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}