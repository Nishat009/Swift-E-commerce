import { NextResponse } from 'next/server';

/**
 * ========================================================================
 * TEMPORARILY COMMENTED OUT: Ready Player Me GLB Avatar Proxy API Route
 * We will be working on 3D avatar features later.
 * ========================================================================
 *
 * export async function GET(request: Request) {
 *   const { searchParams } = new URL(request.url);
 *   const gender = searchParams.get('gender') || 'female';
 *
 *   // Direct URLs to Ready Player Me default rigged GLB avatars
 *   const url = gender === 'female'
 *     ? 'https://models.readyplayer.me/64c2e6f427d35dcab123d4c5.glb'
 *     : 'https://models.readyplayer.me/64c2e64627d35dcab123d4a6.glb';
 *
 *   try {
 *     const res = await fetch(url, {
 *       headers: {
 *         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
 *       },
 *     });
 *
 *     if (!res.ok) {
 *       throw new Error(`Ready Player Me returned status code: ${res.status}`);
 *     }
 *
 *     const arrayBuffer = await res.arrayBuffer();
 *     const buffer = Buffer.from(arrayBuffer);
 *
 *     return new NextResponse(buffer, {
 *       status: 200,
 *       headers: {
 *         'Content-Type': 'model/gltf-binary',
 *         'Cache-Control': 'public, max-age=31536000, immutable',
 *         'Access-Control-Allow-Origin': '*',
 *       },
 *     });
 *   } catch (err: any) {
 *     console.error('Server proxy failed to load RPM avatar:', err);
 *     return NextResponse.json({ error: err.message || 'Failed to proxy model GLB' }, { status: 500 });
 *   }
 * }
 */

export async function GET() {
  return NextResponse.json(
    { message: 'Avatar 3D service is temporarily disabled while working on Dress Room product & model features.' },
    { status: 200 }
  );
}
