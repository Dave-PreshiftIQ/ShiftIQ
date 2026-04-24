import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL?? 'http://localhost:4000';

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const { userId, getToken } = await auth();
  const token = userId ? await getToken() : null;

  const url = `${API_URL}/api/${params.path.join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (!['host', 'connection'].includes(k.toLowerCase())) headers[k] = v; });
  if (token) headers['authorization'] = `Bearer ${token}`;

  const init: RequestInit = { method: req.method, headers };
  if (!['GET', 'HEAD'].includes(req.method)) init.body = await req.text();

  const res = await fetch(url, init);
  const body = await res.text();
  return new Response(body, { status: res.status, headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' } });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
