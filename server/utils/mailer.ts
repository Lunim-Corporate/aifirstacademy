import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const DATA_DIR = path.resolve(process.cwd(), "server/data");
const OUTBOX_FILE = path.join(DATA_DIR, "outbox.json");

export interface OutboxMail {
  id: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  createdAt: string;
  sentVia?: string;
  error?: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readOutbox(): OutboxMail[] {
  ensureDataDir();
  if (!fs.existsSync(OUTBOX_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(OUTBOX_FILE, "utf-8")) as OutboxMail[];
  } catch {
    return [];
  }
}

function writeOutbox(mails: OutboxMail[]) {
  ensureDataDir();
  fs.writeFileSync(OUTBOX_FILE, JSON.stringify(mails, null, 2), "utf-8");
}

// Email service configurations
interface EmailConfig {
  name: string;
  enabled: boolean;
  send: (mail: OutboxMail) => Promise<boolean>;
}

// 1. Resend API Service (Production Ready)
const resendService: EmailConfig = {
  name: "Resend",
  enabled: !!process.env.RESEND_API_KEY,
  async send(mail: OutboxMail): Promise<boolean> {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const from = process.env.RESEND_FROM_EMAIL || 'AI-First Academy <no-reply@aifirstacademy.com>';
      
      await resend.emails.send({
        from,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      
      console.log(`✅ Email sent via Resend to ${mail.to}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Resend failed:`, error?.message || error);
      return false;
    }
  }
};

// 2. Ethereal Email Service (Development/Testing)
let etherealTransporter: nodemailer.Transporter | null = null;
const etherealService: EmailConfig = {
  name: "Ethereal",
  enabled: false, // Disabled due to package conflict
  async send(mail: OutboxMail): Promise<boolean> {
    try {
      if (!etherealTransporter) {
        // Disabled ethereal service due to package conflict
        console.log('❌ Ethereal service disabled due to package conflict');
        return false;
      }
      
      const info = await etherealTransporter.sendMail({
        from: 'AI-First Academy <no-reply@aifirstacademy.com>',
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      
      console.log(`✅ Email sent via Ethereal to ${mail.to}`);
      console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Ethereal failed:`, error?.message || error);
      return false;
    }
  }
};

// 3. SMTP Service (Custom SMTP servers)
let smtpTransporter: nodemailer.Transporter | null = null;
const smtpService: EmailConfig = {
  name: "SMTP",
  enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  async send(mail: OutboxMail): Promise<boolean> {
    try {
      if (!smtpTransporter) {
        const host = process.env.SMTP_HOST!;
        const port = Number(process.env.SMTP_PORT || 587);
        const user = process.env.SMTP_USER!;
        const pass = process.env.SMTP_PASS!;
        const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
        
        smtpTransporter = nodemailer.createTransporter({
          host,
          port,
          secure,
          auth: { user, pass },
        });
      }
      
      const from = process.env.SMTP_FROM || `AI-First Academy <no-reply@${process.env.SMTP_HOST}>`;
      
      await smtpTransporter.sendMail({
        from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      
      console.log(`✅ Email sent via SMTP to ${mail.to}`);
      return true;
    } catch (error: any) {
      console.error(`❌ SMTP failed:`, error?.message || error);
      return false;
    }
  }
};

// 4. Gmail Service (Using app passwords)
let gmailTransporter: nodemailer.Transporter | null = null;
const gmailService: EmailConfig = {
  name: "Gmail",
  enabled: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
  async send(mail: OutboxMail): Promise<boolean> {
    try {
      if (!gmailTransporter) {
        gmailTransporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER!,
            pass: process.env.GMAIL_APP_PASSWORD!,
          },
        });
      }
      
      await gmailTransporter.sendMail({
        from: process.env.GMAIL_USER!,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      
      console.log(`✅ Email sent via Gmail to ${mail.to}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Gmail failed:`, error?.message || error);
      return false;
    }
  }
};

// 5. Console Service (Always available for development)
const consoleService: EmailConfig = {
  name: "Console",
  enabled: true, // Always enabled as last resort
  async send(mail: OutboxMail): Promise<boolean> {
    const border = "*".repeat(60);
    const innerBorder = "-".repeat(58);
    
    console.log(`\n${border}`);
    console.log(`🎯 OTP EMAIL - DEVELOPMENT MODE`);
    console.log(`${innerBorder}`);
    console.log(`📧 To: ${mail.to}`);
    console.log(`📝 Subject: ${mail.subject}`);
    console.log(`${innerBorder}`);
    
    // Extract OTP code from the email content
    const otpMatch = mail.text.match(/Your code: (\d{6})/i);
    if (otpMatch) {
      console.log(`🔑 OTP CODE: ${otpMatch[1]}`);
      console.log(`⏰ Expires in: 10 minutes`);
    }
    
    console.log(`${innerBorder}`);
    console.log(`📋 Full Content:`);
    console.log(mail.text);
    console.log(`${border}\n`);
    
    return true;
  }
};

// Email service priority order (first available service will be used)
const emailServices = [resendService, gmailService, smtpService, etherealService, consoleService];

export async function sendMail(mail: OutboxMail): Promise<boolean> {
  const border = "=".repeat(48);
  console.info(`\n${border}`);
  console.info(`📧 Attempting to send email to: ${mail.to}`);
  console.info(`📝 Subject: ${mail.subject}`);
  console.info(border);
  
  // Try each email service in order
  for (const service of emailServices) {
    if (service.enabled) {
      console.log(`🔄 Trying ${service.name}...`);
      try {
        const success = await service.send(mail);
        if (success) {
          // Update mail record and save to outbox with success status
          mail.sentVia = service.name;
          const mails = readOutbox();
          mails.push(mail);
          writeOutbox(mails);
          
          console.info(`✅ Email successfully sent via ${service.name}`);
          console.info(border);
          return true;
        }
      } catch (error: any) {
        console.error(`❌ ${service.name} failed:`, error?.message || error);
        continue;
      }
    } else {
      console.log(`⏭️  ${service.name} not configured, skipping...`);
    }
  }
  
  // If all services fail, save to outbox with error
  mail.error = "All email services failed";
  const mails = readOutbox();
  mails.push(mail);
  writeOutbox(mails);
  
  // Still log to console as fallback
  console.warn(`⚠️  All email services failed. Email logged to outbox and console:`);
  console.info(`📧 To: ${mail.to}`);
  console.info(`📝 Subject: ${mail.subject}`);
  console.info(`📋 Content: ${mail.text}`);
  console.info(border);
  
  return false; // Indicate failure but don't throw error
}
