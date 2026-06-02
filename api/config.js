export default function handler(req, res) {
  const keysConfigured = !(!process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    isSandboxMode: !keysConfigured,
    status: 'online'
  });
}
