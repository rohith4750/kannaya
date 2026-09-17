import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, role, oldPin, newPin } = await request.json();

    if (!newPin || typeof newPin !== 'string' || newPin.trim().length !== 4) {
      return NextResponse.json(
        { error: 'New PIN must be a 4-digit numeric code' },
        { status: 400 }
      );
    }

    const cleanNewPin = newPin.trim();

    // Verify user exists by exact userId or role match
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    
    if (!user && role) {
      user = await prisma.user.findFirst({ where: { role: role as any } });
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Update user's pinCode in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { pinCode: cleanNewPin },
    });

    return NextResponse.json({
      success: true,
      message: `Security PIN updated successfully to ${cleanNewPin}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        pinCode: updatedUser.pinCode,
      },
    });
  } catch (error: any) {
    console.error('Update PIN API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update security PIN' },
      { status: 500 }
    );
  }
}
