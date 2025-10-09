import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Email provider types
type EmailProvider = 'resend' | 'smtp';

// Email configuration interface
interface EmailConfig {
  provider: EmailProvider;
  from: string;
  resend?: {
    apiKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

// Email template data
interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// OTP email template data
interface OTPEmailData {
  email: string;
  code: string;
  purpose: 'signup' | 'login' | 'reset';
  name?: string;
}

class EmailService {
  private config: EmailConfig;
  private resendClient?: Resend;
  private smtpTransporter?: nodemailer.Transporter;

  constructor() {
    this.config = this.loadConfig();
    this.initializeProvider();
  }

  private loadConfig(): EmailConfig {
    const provider = (process.env.EMAIL_PROVIDER || 'smtp') as EmailProvider;
    const from = process.env.EMAIL_FROM || 'noreply@aifirstacademy.com';

    const config: EmailConfig = {
      provider,
      from,
    };

    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        config.resend = { apiKey };
      } else {
        console.warn('RESEND_API_KEY not configured');
      }
    } else if (provider === 'smtp') {
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || '587');
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (host && user && pass) {
        config.smtp = {
          host,
          port,
          secure: port === 465, // true for 465, false for other ports
          auth: { user, pass },
        };
      } else {
        console.warn('SMTP configuration incomplete - some credentials missing');
      }
    }

    return config;
  }

  private initializeProvider(): void {
    if (this.config.provider === 'resend' && this.config.resend) {
      this.resendClient = new Resend(this.config.resend.apiKey);
      console.log('Email service initialized with Resend');
    } else if (this.config.provider === 'smtp' && this.config.smtp) {
      this.smtpTransporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: this.config.smtp.auth,
      });
      console.log('Email service initialized with SMTP');
    } else {
      console.warn('Email service not configured - emails will not be sent');
      console.warn('Please configure either RESEND_API_KEY or SMTP settings in your .env file');
    }
  }

  // Send email using the configured provider
  async sendEmail(data: EmailData): Promise<void> {
    try {
      if (this.config.provider === 'resend' && this.resendClient) {
        await this.sendWithResend(data);
        console.log(`Email sent successfully to ${data.to} via ${this.config.provider}`);
      } else if (this.config.provider === 'smtp' && this.smtpTransporter) {
        await this.sendWithSMTP(data);
        console.log(`Email sent successfully to ${data.to} via ${this.config.provider}`);
      } else {
        // In development, just log the email instead of failing
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 EMAIL (Development Mode):');
          console.log(`To: ${data.to}`);
          console.log(`Subject: ${data.subject}`);
          console.log('Configure email settings in .env to send real emails');
          return;
        }
        throw new Error('Email provider not properly configured');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // In development, fall back to console logging instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 EMAIL FALLBACK (Development Mode):');
        console.log(`To: ${data.to}`);
        console.log(`Subject: ${data.subject}`);
        console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log('Email would be sent in production with proper configuration');
        return;
      }
      
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendWithResend(data: EmailData): Promise<void> {
    if (!this.resendClient) {
      throw new Error('Resend client not initialized');
    }

    const result = await this.resendClient.emails.send({
      from: this.config.from,
      to: [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
    }
  }

  private async sendWithSMTP(data: EmailData): Promise<void> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    await this.smtpTransporter.sendMail({
      from: this.config.from,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });
  }

  // Send OTP email with predefined template
  async sendOTPEmail(data: OTPEmailData): Promise<void> {
    const subject = this.getOTPSubject(data.purpose);
    const { html, text } = this.generateOTPTemplate(data);

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  private getOTPSubject(purpose: string): string {
    switch (purpose) {
      case 'signup':
        return 'Welcome! Verify your AI-First Academy account';
      case 'login':
        return 'Sign in to AI-First Academy';
      case 'reset':
        return 'Reset your AI-First Academy password';
      default:
        return 'Verify your AI-First Academy account';
    }
  }

  private generateOTPTemplate(data: OTPEmailData): { html: string; text: string } {
    const { code, purpose, name, email } = data;
    const greeting = name ? `Hi ${name}` : 'Hi there';
    
    let message: string;
    let instructions: string;

    switch (purpose) {
      case 'signup':
        message = 'Welcome to AI-First Academy! Please verify your account to get started.';
        instructions = 'Use this code to complete your registration:';
        break;
      case 'login':
        message = 'Sign in to your AI-First Academy account.';
        instructions = 'Use this code to complete your sign-in:';
        break;
      case 'reset':
        message = 'We received a request to reset your password.';
        instructions = 'Use this code to reset your password:';
        break;
      default:
        message = 'Verify your AI-First Academy account.';
        instructions = 'Use this verification code:';
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.getOTPSubject(purpose)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 20px;
            color: #1a202c;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4a5568;
          }
          .instructions {
            font-size: 16px;
            margin-bottom: 20px;
            color: #2d3748;
            font-weight: 500;
          }
          .otp-code {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
          .otp-digits {
            font-family: 'Monaco', 'Consolas', 'Roboto Mono', monospace;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #2b6cb0;
            margin: 0;
          }
          .otp-label {
            font-size: 14px;
            color: #718096;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .warning {
            background-color: #fef5e7;
            border-left: 4px solid #f6ad55;
            padding: 15px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #744210;
            font-size: 14px;
          }
          .footer {
            background-color: #f7fafc;
            padding: 20px 30px;
            text-align: center;
            color: #718096;
            font-size: 14px;
          }
          .footer a {
            color: #4299e1;
            text-decoration: none;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AI-First Academy</h1>
          </div>
          <div class="content">
            <div class="greeting">${greeting},</div>
            <div class="message">${message}</div>
            <div class="instructions">${instructions}</div>
            
            <div class="otp-code">
              <div class="otp-digits">${code}</div>
              <div class="otp-label">Verification Code</div>
            </div>
            
            <div class="warning">
              <p><strong>Security Notice:</strong> This code will expire in 10 minutes. If you didn't request this, please ignore this email and consider changing your password.</p>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>AI-First Academy | <a href="https://aifirstacademy.com">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${greeting},
      
      ${message}
      
      ${instructions}
      
      Your verification code: ${code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this, please ignore this email.
      
      AI-First Academy
      https://aifirstacademy.com
    `;

    return { html, text };
  }

  // Test email connectivity
  async testConnection(): Promise<boolean> {
    try {
      if (this.config.provider === 'smtp' && this.smtpTransporter) {
        await this.smtpTransporter.verify();
        console.log('SMTP connection test successful');
        return true;
      } else if (this.config.provider === 'resend' && this.resendClient) {
        // Resend doesn't have a direct test method, so we'll just check if the client exists
        console.log('Resend client initialized successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Get current configuration (for debugging)
  getConfig(): Partial<EmailConfig> {
    return {
      provider: this.config.provider,
      from: this.config.from,
      // Don't expose secrets
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types for use in other modules
export type { EmailData, OTPEmailData, EmailProvider };
