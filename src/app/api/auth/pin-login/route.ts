import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  let pinCode: string | null = null;

  try {
    const body = await request.json();
    pinCode = body?.pinCode ?? null;
  } catch (parseErr) {
    console.error('Failed to parse request JSON in pin-login:', parseErr);
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  if (!pinCode || typeof pinCode !== 'string') {
    return NextResponse.json({ error: 'PIN Code required' }, { status: 400 });
  }

  const cleanPin = pinCode.trim();

  try {
    let user: any = null;

    // 1. Try finding user matching pinCode directly in database
    try {
      user = await prisma.user.findFirst({
        where: { pinCode: cleanPin },
      });

      // 2. Fallbacks for default quick access PINs if no user matched cleanPin
      if (!user) {
        if (cleanPin === '1234') {
          user = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) || await prisma.user.findFirst();
        } else if (cleanPin === '0000') {
          user = await prisma.user.findFirst({ where: { role: 'STAFF' } }) || await prisma.user.findFirst();
        }
      }
    } catch (dbErr) {
      console.warn('Prisma DB lookup warning, falling back to default PIN sessions:', dbErr);
    }

    // 3. Fallback to default Admin & Staff virtual accounts if DB has no users
    if (!user) {
      if (cleanPin === '1234') {
        user = {
          id: 'admin-default-id',
          name: 'Store Administrator',
          email: 'admin@kannaya.com',
          role: 'ADMIN',
          pinCode: '1234',
        };
      } else if (cleanPin === '0000') {
        user = {
          id: 'staff-default-id',
          name: 'Counter Staff',
          email: 'staff@kannaya.com',
          role: 'STAFF',
          pinCode: '0000',
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid PIN code. Try 1234 (Admin) or 0000 (Staff)' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email || 'user@kannaya.com',
      role: user.role,
      pinCode: user.pinCode || cleanPin,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    // Set session cookie
    response.cookies.set('kannaya_session', JSON.stringify(sessionData), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('PIN Login API Processing Error:', error);

    if (cleanPin === '1234' || cleanPin === '0000') {
      const isAdmin = cleanPin === '1234';
      return NextResponse.json({
        success: true,
        user: {
          id: isAdmin ? 'admin-emergency' : 'staff-emergency',
          name: isAdmin ? 'Store Administrator' : 'Counter Staff',
          role: isAdmin ? 'ADMIN' : 'STAFF',
          pinCode: cleanPin,
        },
      });
    }

    return NextResponse.json({ error: error.message || 'PIN Authentication failed' }, { status: 500 });
  }
}
