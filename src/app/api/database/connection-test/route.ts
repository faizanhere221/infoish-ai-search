import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        message: '❌ DATABASE_URL not found in environment variables',
        hint: 'Make sure your .env.local file has DATABASE_URL set'
      }, { status: 500 });
    }

    // Parse the URL to check format
    const url = new URL(databaseUrl);
    
    return NextResponse.json({
      success: true,
      message: '✅ DATABASE_URL is properly formatted',
      details: {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        username: url.username,
        // Don't log password for security
        hasPassword: !!url.password
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '❌ Invalid DATABASE_URL format',
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check your connection string format'
    }, { status: 500 });
  }
}