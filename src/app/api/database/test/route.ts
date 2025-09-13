import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/database/connection';

export async function GET() {
  try {
    const connected = await testConnection();
    
    if (connected) {
      return NextResponse.json({ 
        success: true, 
        message: '✅ Database connected successfully!',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: '❌ Database connection failed' 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: '❌ Database error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
