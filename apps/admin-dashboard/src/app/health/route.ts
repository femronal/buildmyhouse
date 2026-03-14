import { NextResponse } from 'next/server';

/**
 * Health check endpoint for ALB/ECS. Returns 200 so load balancer
 * health checks pass. Does not require auth.
 * Binds to 0.0.0.0 via Dockerfile so ALB can reach this.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
