import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PaymentMethod from '@/models/PaymentMethod';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const methods = await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    return NextResponse.json({ methods }, { status: 200 });
  } catch (error: any) {
    console.error('Get Payment Methods Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment methods', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.userId || !body.type || !body.label || !body.details) {
      return NextResponse.json({ error: 'userId, type, label, and details are required' }, { status: 400 });
    }

    if (body.isDefault) {
      await PaymentMethod.updateMany({ userId: body.userId }, { $set: { isDefault: false } });
    }

    const method = await PaymentMethod.create(body);
    return NextResponse.json({ method }, { status: 201 });
  } catch (error: any) {
    console.error('Create Payment Method Error:', error);
    return NextResponse.json({ error: 'Failed to create payment method', details: error.message }, { status: 500 });
  }
}
