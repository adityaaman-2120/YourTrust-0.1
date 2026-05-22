import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * PaymentMethod represents how a user wants to RECEIVE money.
 * This is shown to borrowers so they know where to send repayments.
 *
 * Types:
 *  - upi:  details = { upiId: string, qrImageUrl?: string }
 *  - bank: details = { accountHolder: string, accountNumber: string, ifsc: string, bankName: string }
 *
 * Note: Cards are NOT included — P2P repayments are done via UPI or bank transfer only.
 */
export interface IPaymentMethod extends Document {
  userId: string;
  type: 'upi' | 'bank';
  label: string;
  details: Record<string, string>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['upi', 'bank'],
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: Map,
      of: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);

export default PaymentMethod;
