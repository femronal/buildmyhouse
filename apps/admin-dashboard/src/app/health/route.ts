import { NextResponse } from 'next/server';

/**
 * Health check endpoint for ALB/ECS. Returns 200 so load balancer
 * health checks pass. Does not require auth.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
