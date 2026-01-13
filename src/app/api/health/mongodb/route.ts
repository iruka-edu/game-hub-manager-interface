import { NextResponse } from 'next/server';
import { getMongoClient, isConnected, forceReconnect } from '@/lib/mongodb';

/**
 * GET /api/health/mongodb
 * Check MongoDB connection health
 */
export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check if current connection is alive
    const isCurrentlyConnected = await isConnected();
    
    if (!isCurrentlyConnected) {
      console.log('[Health Check] MongoDB connection is down, attempting to reconnect...');
      await forceReconnect();
    }
    
    // Test the connection with a simple operation
    const { db } = await getMongoClient();
    await db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      message: 'MongoDB connection is working',
      responseTime: `${responseTime}ms`,
      reconnected: !isCurrentlyConnected,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Health Check] MongoDB connection failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'MongoDB connection failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/health/mongodb
 * Force reconnect to MongoDB
 */
export async function POST() {
  try {
    console.log('[Health Check] Force reconnecting to MongoDB...');
    const startTime = Date.now();
    
    const { db } = await forceReconnect();
    await db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'reconnected',
      message: 'MongoDB reconnection successful',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Health Check] MongoDB reconnection failed:', error);
    
    return NextResponse.json({
      status: 'failed',
      message: 'MongoDB reconnection failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}