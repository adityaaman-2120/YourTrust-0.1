import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PaymentMethod from '@/models/PaymentMethod';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const method = await PaymentMethod.findByIdAndDelete(id);
    if (!method) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Payment method deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete Payment Method Error:', error);
    return NextResponse.json({ error: 'Failed to delete payment method', details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const currentMethod = await PaymentMethod.findById(id);
    if (!currentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    if (body.isDefault) {
      // Set all other payment methods for this user to isDefault: false
      await PaymentMethod.updateMany(
        { userId: currentMethod.userId },
        { $set: { isDefault: false } }
      );
    }

    const updated = await PaymentMethod.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({ method: updated }, { status: 200 });
  } catch (error: any) {
    console.error('Update Payment Method Error:', error);
    return NextResponse.json({ error: 'Failed to update payment method', details: error.message }, { status: 500 });
  }
}

