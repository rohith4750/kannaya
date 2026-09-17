import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const validRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'BILLING_STAFF', 'INVENTORY_STAFF'];

// GET /api/users - List all internal users
export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
        allowedModules: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch internal users' }, { status: 500 });
  }
}

// POST /api/users - Create a new internal user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, pinCode, role, allowedModules } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const assignedRole = validRoles.includes(role) ? role : 'STAFF';
    const assignedPin = pinCode ? pinCode.trim() : (assignedRole === 'ADMIN' || assignedRole === 'SUPER_ADMIN' ? '1234' : '0000');

    if (assignedPin && !/^\d{4}$/.test(assignedPin)) {
      return NextResponse.json(
        { error: 'Security PIN must be exactly 4 digits (e.g. 1234)' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password,
        pinCode: assignedPin,
        role: assignedRole,
        allowedModules: Array.isArray(allowedModules) ? allowedModules : [],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
        allowedModules: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create internal user' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update internal user details or PIN or allowedModules
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, password, pinCode, role, allowedModules } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (pinCode && !/^\d{4}$/.test(pinCode.trim())) {
      return NextResponse.json(
        { error: 'Security PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(password && { password }),
        ...(pinCode && { pinCode: pinCode.trim() }),
        ...(role && { role: validRoles.includes(role) ? role : 'STAFF' }),
        ...(Array.isArray(allowedModules) && { allowedModules }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
        allowedModules: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Users PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete an internal user by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Users DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

