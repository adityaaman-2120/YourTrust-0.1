import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentMethod extends Document {
  userId: string;
  type: 'upi' | 'bank' | 'card';
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
      enum: ['upi', 'bank', 'card'],
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
