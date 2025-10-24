const nodemailer = require('nodemailer');

// For development - create a test account (no real email credentials needed)
let transporter;

// If no email credentials provided, create a test account
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('No email credentials found. Creating test account...');
  
  // For development, use ethereal.email (fake SMTP service)
  nodemailer.createTestAccount().then((testAccount) => {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Test email account created:');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
  });
} else {
  // For production with real email credentials
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

exports.sendVerificationEmail = async (email, code) => {
  try {
    // If transporter is not ready yet (test account creation), wait a bit
    if (!transporter) {
      setTimeout(() => {
        exports.sendVerificationEmail(email, code);
      }, 1000);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'society@management.com',
      to: email,
      subject: 'Email Verification - Society Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Thank you for registering with Society Management System.</p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; background: #f8f9fa; padding: 15px 30px; border-radius: 8px; display: inline-block;">
                ${code}
              </span>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">Enter this code on the verification page to complete your registration.</p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">This code will expire in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Best regards,<br>Society Management Team</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // For test accounts, log the preview URL
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't throw error to prevent registration from failing
    console.log('Email sending failed, but user registration completed');
  }
};

exports.sendPaymentConfirmation = async (email, amount, month, year) => {
  try {
    if (!transporter) {
      setTimeout(() => {
        exports.sendPaymentConfirmation(email, amount, month, year);
      }, 1000);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'society@management.com',
      to: email,
      subject: 'Payment Confirmation - Society Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Payment Confirmed ✅</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">Your maintenance payment has been received successfully.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Amount:</strong></td>
                  <td style="padding: 8px 0; color: #333; text-align: right;">₹${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Period:</strong></td>
                  <td style="padding: 8px 0; color: #333; text-align: right; text-transform: capitalize;">${month} ${year}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Date:</strong></td>
                  <td style="padding: 8px 0; color: #333; text-align: right;">${new Date().toLocaleDateString()}</td>
                </tr>
              </table>
            </div>
            <p style="color: #28a745; font-size: 16px; text-align: center; font-weight: bold;">Thank you for your timely payment!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Best regards,<br>Society Management Team</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
      console.log('Payment confirmation preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('Payment confirmation email sent to:', email);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
};