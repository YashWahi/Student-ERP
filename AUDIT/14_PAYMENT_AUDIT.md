# Payment Audit — EduERP Pro

## Online Payment Integration
- **Service**: `razorpayService.js`
- **Gateway**: Razorpay Checkout SDK (`https://checkout.razorpay.com/v1/checkout.js`)
- **Verification**: `verifyPaymentSignature` validates transaction details before marking fee ledger records as `Paid`.
- **Receipts**: Automatic triggering of `generateFeeReceiptPDF()` on payment completion.
