// app/api/debug-env/route.ts   (temporary)
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    jwtSecretPresent: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
