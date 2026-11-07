import { NextRequest } from 'next/server';

const TARGET = (process.env.PARTNER_API_ORIGIN || 'https://api.buildmyhouse.app').replace(/\/+$/, '');

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const dest = `${TARGET}/api/${context.params.path.join('/')}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const response = await fetch(dest, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
