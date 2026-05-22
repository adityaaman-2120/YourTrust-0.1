import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agreement from '@/models/Agreement';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { sendEmail, emailTemplates } from '@/lib/email';
import { sendNotification } from '@/lib/firebase-admin';
import { analyzeTrustScoreWithHistory } from '@/lib/near-ai';

// GET all agreements for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Find agreements where user is either lender or borrower
    // Check both lenderId and borrowerId fields
    const agreements = await Agreement.find({
      $or: [
        { lenderId: userId },
        { borrowerId: userId },
        { borrowerEmail: { $exists: true } } // Fallback for old agreements
      ],
    }).sort({ createdAt: -1 });

    // Filter to only include agreements where user is actually involved
    const userAgreements = agreements.filter(agreement => {
      return agreement.lenderId === userId || agreement.borrowerId === userId;
    });

    return NextResponse.json({ agreements: userAgreements }, { status: 200 });
  } catch (error: any) {
    console.error('Get Agreements Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreements', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new agreement
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      lenderId,
      lenderName,
      lenderEmail,
      borrowerName,
      borrowerEmail,
      borrowerPhone,
      dealType = 'money',
      amount,
      purpose,
      dueDate,
      bufferDays,
      witnessName,
      witnessEmail,
      witnessPhone,
      proofFile,
      assetName,
      assetCategory,
      assetCondition,
      estimatedValue,
      instructions,
      assetPhotos,
    } = body;

    if (!lenderId || !lenderName || !lenderEmail || !borrowerName || !borrowerEmail || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (dealType === 'money' && !amount) {
      return NextResponse.json(
        { error: 'Amount is required for money lending' },
        { status: 400 }
      );
    }

    if (dealType === 'asset' && !assetName) {
      return NextResponse.json(
        { error: 'Asset name is required for asset lending' },
        { status: 400 }
      );
    }

    // VALIDATION: Check if borrower exists in the database
    const borrowerUser = await User.findOne({ email: borrowerEmail });
    if (!borrowerUser) {
      return NextResponse.json(
        {
          error: 'Borrower not found',
          message: `${borrowerEmail} is not registered on YourTrust. They must create an account first.`
        },
        { status: 404 }
      );
    }

    // VALIDATION: Check if witness exists in the database (if provided)
    if (witnessEmail) {
      const witnessUser = await User.findOne({ email: witnessEmail });
      if (!witnessUser) {
        return NextResponse.json(
          {
            error: 'Witness not found',
            message: `${witnessEmail} is not registered on YourTrust. They must create an account first.`
          },
          { status: 404 }
        );
      }
    }

    // Create timeline
    const timeline = [
      { event: 'Agreement Created', date: new Date(), completed: true },
      { event: 'Witness Approved', date: witnessEmail ? null : new Date(), completed: !witnessEmail },
      { event: dealType === 'money' ? 'Money Sent' : 'Asset Delivered', date: proofFile ? new Date() : null, completed: !!proofFile },
      { event: dealType === 'money' ? 'Payment Received' : 'Asset Returned', date: null, completed: false },
    ];

    // NEAR AI Trust Score Analysis with Full History
    let aiAnalysis = null;
    try {
      console.log('[NEAR AI] Analyzing trust score with borrower history...');
      aiAnalysis = await analyzeTrustScoreWithHistory(
        amount,
        borrowerName,
        borrowerUser.uid,
        borrowerEmail,
        purpose || 'Not specified',
        dueDate,
        lenderName,
        lenderId,
        lenderEmail
      );
      if (aiAnalysis) {
        console.log('[NEAR AI] Trust analysis result:', aiAnalysis);
      }
    } catch (aiError: any) {
      console.error('[NEAR AI] Trust analysis failed:', aiError.message);
    }

    // Create agreement
    const agreementData: any = {
      lenderId,
      lenderName,
      lenderEmail,
      borrowerId: borrowerUser.uid,
      borrowerName,
      borrowerEmail,
      borrowerPhone,
      dealType,
      amount: amount || 0,
      purpose,
      dueDate: new Date(dueDate),
      type: 'lent',
      status: witnessEmail ? 'pending_witness' : 'active',
      bufferDays: bufferDays || 3,
      witnessName,
      witnessEmail,
      witnessPhone,
      witnessApproved: !witnessEmail,
      lenderProof: proofFile ? {
        fileName: proofFile.fileName,
        fileUrl: proofFile.fileUrl,
        uploadedAt: new Date(),
      } : undefined,
    }

    if (dealType === 'asset') {
      agreementData.assetName = assetName || '';
      agreementData.assetCategory = assetCategory || '';
      agreementData.assetCondition = assetCondition || '';
      agreementData.estimatedValue = estimatedValue || amount || 0;
      agreementData.instructions = instructions || '';
      agreementData.assetPhotos = assetPhotos || [];
    }

    agreementData.timeline = timeline;
    agreementData.aiMessages = [
      {
        role: 'system',
        content: 'YourTrust AI Mediator is ready to help with this agreement.',
        timestamp: new Date(),
      },
    ];
    agreementData.aiAnalysis = aiAnalysis || undefined;
    agreementData.borrowerCreditReport = aiAnalysis?.borrowerCreditReport ? {
      totalAgreements: aiAnalysis.borrowerCreditReport.totalAgreements,
      onTimeRate: aiAnalysis.borrowerCreditReport.onTimeRate,
      lateCount: aiAnalysis.borrowerCreditReport.lateCount,
      totalAmount: aiAnalysis.borrowerCreditReport.totalAmount,
      avgAmount: aiAnalysis.borrowerCreditReport.avgAmount,
    } : {
      totalAgreements: 0,
      onTimeRate: 100,
      lateCount: 0,
      totalAmount: 0,
      avgAmount: 0,
    };
    agreementData.lenderCreditReport = aiAnalysis?.lenderCreditReport ? {
      totalAgreements: aiAnalysis.lenderCreditReport.totalAgreements,
      avgAmount: aiAnalysis.lenderCreditReport.avgAmount,
      totalAmount: aiAnalysis.lenderCreditReport.totalAmount,
    } : {
      totalAgreements: 0,
      avgAmount: 0,
      totalAmount: 0,
    };

    const agreement = await Agreement.create(agreementData);

    const displayValue = dealType === 'asset' ? (estimatedValue || amount || 0) : amount;
    const displayName = dealType === 'asset' ? (assetName || 'item') : `₹${displayValue}`;

    // Update lender's stats
    await User.findOneAndUpdate(
      { uid: lenderId },
      {
        $inc: { totalLent: displayValue, agreementCount: 1 },
      }
    );

    // Update borrower's stats
    await User.findOneAndUpdate(
      { uid: borrowerUser.uid },
      {
        $inc: { totalBorrowed: displayValue, agreementCount: 1 },
      }
    );

    // Create notification for lender
    await Notification.create({
      userId: lenderId,
      type: 'agreement_created',
      title: dealType === 'asset' ? 'Asset Agreement Created' : 'Agreement Created',
      description: dealType === 'asset'
        ? `You created an asset agreement with ${borrowerName} for ${assetName || 'item'}`
        : `You created an agreement with ${borrowerName} for ₹${amount}`,
      agreementId: agreement._id.toString(),
    });

    // Create notification for borrower
    await Notification.create({
      userId: borrowerUser.uid,
      type: 'agreement_created',
      title: dealType === 'asset' ? 'New Asset Agreement' : 'New Lending Agreement',
      description: dealType === 'asset'
        ? `${lenderName} created an asset agreement with you for ${assetName || 'item'}`
        : `${lenderName} created a lending agreement with you for ₹${amount}`,
      agreementId: agreement._id.toString(),
    });

    // Send email to borrower
    const borrowerEmailTemplate = emailTemplates.agreementRequest(
      lenderName,
      borrowerName,
      displayValue,
      dueDate,
      agreement._id.toString()
    );
    await sendEmail({
      to: borrowerEmail,
      subject: borrowerEmailTemplate.subject,
      html: borrowerEmailTemplate.html,
    });

    // Send email to witness if provided
    if (witnessEmail && witnessName) {
      const witnessEmailTemplate = emailTemplates.witnessApprovalRequest(
        lenderName,
        borrowerName,
        witnessName,
        agreement._id.toString()
      );
      await sendEmail({
        to: witnessEmail,
        subject: witnessEmailTemplate.subject,
        html: witnessEmailTemplate.html,
      });
    }

    // Send Push Notification to Borrower
    if (borrowerUser.fcmToken) {
      await sendNotification(
        borrowerUser.fcmToken,
        "New Lending Agreement",
        `${lenderName} created a lending agreement with you for ₹${amount}`
      );
    }

    return NextResponse.json(
      { message: 'Agreement created successfully', agreement },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create Agreement Error:', error);
    return NextResponse.json(
      { error: 'Failed to create agreement', details: error.message },
      { status: 500 }
    );
  }
}
