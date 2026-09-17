import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const defaultRolePermissions = {
  SUPER_ADMIN: ['super_admin', 'users', 'settings'],
  ADMIN: [
    'dashboard',
    'billing',
    'invoices',
    'customers',
    'expenses',
    'products',
    'categories',
    'racks',
    'suppliers',
    'users',
    'whatsapp',
    'ai_assistant',
    'reports',
    'settings',
  ],
  STAFF: ['dashboard', 'billing', 'invoices', 'customers', 'products', 'racks'],
  BILLING_STAFF: ['dashboard', 'billing', 'invoices', 'customers'],
  INVENTORY_STAFF: ['dashboard', 'products', 'categories', 'racks', 'suppliers'],
};

export async function GET() {
  try {
    let config = await prisma.permissionConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.permissionConfig.create({
        data: {
          id: 'default',
          rolePermissions: defaultRolePermissions,
        },
      });
    }

    return NextResponse.json(config.rolePermissions || defaultRolePermissions);
  } catch (error: any) {
    console.error('Permissions GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rolePermissions } = body;

    if (!rolePermissions || typeof rolePermissions !== 'object') {
      return NextResponse.json({ error: 'Invalid rolePermissions object' }, { status: 400 });
    }

    const updatedConfig = await prisma.permissionConfig.upsert({
      where: { id: 'default' },
      update: { rolePermissions },
      create: {
        id: 'default',
        rolePermissions,
      },
    });

    return NextResponse.json({
      success: true,
      message: '✅ Role permissions matrix updated successfully.',
      rolePermissions: updatedConfig.rolePermissions,
    });
  } catch (error: any) {
    console.error('Permissions PUT Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update permissions' }, { status: 500 });
  }
}
