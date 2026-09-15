import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('kannaya_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, name: true, email: true, role: true, allowedModules: true },
      });
      if (dbUser) {
        return NextResponse.json({ authenticated: true, user: dbUser });
      }
    }

    return NextResponse.json({ authenticated: true, user: sessionUser });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
