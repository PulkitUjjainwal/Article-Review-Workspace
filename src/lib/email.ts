import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from './logger';

// Escape HTML special characters to prevent email template breaking
function escapeHtml(text: string): string {
  if (!text) return '';
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

export interface SendInvitationEmailParams {
  to: string;
  projectName: string;
  inviterName: string;
  inviteUrl: string;
  hasAccount?: boolean;
}

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

export interface SendEmailVerificationParams {
  to: string;
  verificationUrl: string;
  userName?: string;
}

// Create SES client (initialized lazily to ensure env vars are loaded)
function getSESClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_SES_REGION || 'us-west-2';

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
  }

  return new SESClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function sendProjectInvitation({
  to,
  projectName,
  inviterName,
  inviteUrl,
  hasAccount = false,
}: SendInvitationEmailParams) {
  // Check if AWS credentials are configured
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials are not configured');
    throw new Error('Email service is not configured. Please add AWS credentials to your environment variables.');
  }

  if (!process.env.AWS_SES_SENDER) {
    console.error('AWS_SES_SENDER is not configured');
    throw new Error('Email sender address is not configured.');
  }

  try {
    // Only log in development - contains sensitive URLs and email addresses
    logger.debug('Sending invitation email to:', to);
    logger.debug('Project:', projectName);
    logger.debug('Invite URL:', inviteUrl);
    logger.debug('Using sender:', process.env.AWS_SES_SENDER);
    logger.debug('AWS Region:', process.env.AWS_SES_REGION);

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Project Invitation</h1>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi there! 👋
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${escapeHtml(inviterName)}</strong> has invited you to collaborate on the project
              <strong style="color: #667eea;">"${escapeHtml(projectName)}"</strong> in Article Review Workspace.
            </p>

            <p style="font-size: 16px; margin-bottom: 30px;">
              ${hasAccount
                ? 'Log in to your account to see this invitation and accept it from your dashboard. Or click the button below:'
                : 'Click the button below to accept the invitation and start reviewing articles:'}
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${inviteUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Accept Invitation
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteUrl}" style="color: #667eea; word-break: break-all;">${inviteUrl}</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              This invitation will expire in 7 days.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
            <p>Article Review Workspace - Systematic Literature Review Platform</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Project Invitation

Hi there!

${inviterName} has invited you to collaborate on the project "${projectName}" in Article Review Workspace.

Accept your invitation by visiting this link:
${inviteUrl}

This invitation will expire in 7 days.

---
Article Review Workspace - Systematic Literature Review Platform
    `;

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_SENDER,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: `You've been invited to join "${projectName}"`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const sesClient = getSESClient();
    const response = await sesClient.send(command);

    logger.info('Invitation email sent successfully:', response.MessageId);
    return { id: response.MessageId };
  } catch (error: any) {
    logger.error('Error sending invitation email via AWS SES:', error.message);
    logger.debug('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      name: error.name,
    });

    // Provide helpful error messages
    if (error.code === 'MessageRejected') {
      throw new Error('Email rejected. Please verify the sender email address is verified in AWS SES.');
    } else if (error.code === 'InvalidParameterValue') {
      throw new Error(`Invalid email parameter: ${error.message}`);
    } else if (error.code === 'CredentialsError' || error.name === 'CredentialsProviderError') {
      throw new Error('AWS credentials are invalid or expired.');
    }

    throw new Error(`Email service error: ${error.message || 'Unknown error occurred'}`);
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: SendPasswordResetEmailParams) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials are not configured');
    throw new Error('Email service is not configured. Please add AWS credentials to your environment variables.');
  }

  if (!process.env.AWS_SES_SENDER) {
    console.error('AWS_SES_SENDER is not configured');
    throw new Error('Email sender address is not configured.');
  }

  try {
    // Only log in development - contains sensitive URLs and email addresses
    logger.debug('Sending password reset email to:', to);
    logger.debug('Reset URL:', resetUrl);

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${userName ? `Hi ${escapeHtml(userName)},` : 'Hi there,'}
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password for your Article Review Workspace account.
            </p>

            <p style="font-size: 16px; margin-bottom: 30px;">
              Click the button below to reset your password:
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              This password reset link will expire in 1 hour.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
            <p>Article Review Workspace - Systematic Literature Review Platform</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Password Reset

${userName ? `Hi ${userName},` : 'Hi there,'}

We received a request to reset your password for your Article Review Workspace account.

Reset your password by visiting this link:
${resetUrl}

This password reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Article Review Workspace - Systematic Literature Review Platform
    `;

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_SENDER,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Reset Your Password - Article Review Workspace',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const sesClient = getSESClient();
    const response = await sesClient.send(command);

    logger.info('Password reset email sent successfully:', response.MessageId);
    return { id: response.MessageId };
  } catch (error: any) {
    logger.error('Error sending password reset email via AWS SES:', error.message);
    logger.debug('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      name: error.name,
    });

    if (error.code === 'MessageRejected') {
      throw new Error('Email rejected. Please verify the sender email address is verified in AWS SES.');
    } else if (error.code === 'InvalidParameterValue') {
      throw new Error(`Invalid email parameter: ${error.message}`);
    } else if (error.code === 'CredentialsError' || error.name === 'CredentialsProviderError') {
      throw new Error('AWS credentials are invalid or expired.');
    }

    throw new Error(`Email service error: ${error.message || 'Unknown error occurred'}`);
  }
}

export async function sendEmailVerification({
  to,
  verificationUrl,
  userName,
}: SendEmailVerificationParams) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials are not configured');
    throw new Error('Email service is not configured. Please add AWS credentials to your environment variables.');
  }

  if (!process.env.AWS_SES_SENDER) {
    console.error('AWS_SES_SENDER is not configured');
    throw new Error('Email sender address is not configured.');
  }

  try {
    // Only log in development - contains sensitive URLs and email addresses
    logger.debug('Sending email verification to:', to);
    logger.debug('Verification URL:', verificationUrl);

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${userName ? `Hi ${escapeHtml(userName)},` : 'Hi there,'}
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for signing up for Article Review Workspace! We're excited to have you on board.
            </p>

            <p style="font-size: 16px; margin-bottom: 30px;">
              To complete your registration and start collaborating on research projects, please verify your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 40px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Verify Email Address
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              This verification link will expire in 24 hours.
            </p>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you didn't create an account with Article Review Workspace, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
            <p>Article Review Workspace - Systematic Literature Review Platform</p>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Verify Your Email

${userName ? `Hi ${userName},` : 'Hi there,'}

Thank you for signing up for Article Review Workspace! We're excited to have you on board.

To complete your registration and start collaborating on research projects, please verify your email address by visiting this link:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Article Review Workspace, you can safely ignore this email.

---
Article Review Workspace - Systematic Literature Review Platform
    `;

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_SENDER,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Verify Your Email Address - Article Review Workspace',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const sesClient = getSESClient();
    const response = await sesClient.send(command);

    logger.info('Email verification sent successfully:', response.MessageId);
    return { id: response.MessageId };
  } catch (error: any) {
    logger.error('Error sending email verification via AWS SES:', error.message);
    logger.debug('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      name: error.name,
    });

    if (error.code === 'MessageRejected') {
      throw new Error('Email rejected. Please verify the sender email address is verified in AWS SES.');
    } else if (error.code === 'InvalidParameterValue') {
      throw new Error(`Invalid email parameter: ${error.message}`);
    } else if (error.code === 'CredentialsError' || error.name === 'CredentialsProviderError') {
      throw new Error('AWS credentials are invalid or expired.');
    }

    throw new Error(`Email service error: ${error.message || 'Unknown error occurred'}`);
  }
}

// Test function to verify AWS SES is working
export async function sendTestEmail(to: string) {
  try {
    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_SENDER!,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Test Email from Article Review Workspace',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <h1>Email Configuration Test</h1>
              <p>If you're reading this, your AWS SES integration is working correctly! ✅</p>
              <p>You can now send project invitations.</p>
              <p><strong>Sender:</strong> ${process.env.AWS_SES_SENDER}</p>
              <p><strong>Region:</strong> ${process.env.AWS_SES_REGION}</p>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Email Configuration Test\n\nIf you're reading this, your AWS SES integration is working correctly!\n\nYou can now send project invitations.\n\nSender: ${process.env.AWS_SES_SENDER}\nRegion: ${process.env.AWS_SES_REGION}`,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const sesClient = getSESClient();
    const response = await sesClient.send(command);
    logger.info('Test email sent successfully:', response.MessageId);

    return { success: true, data: { id: response.MessageId } };
  } catch (error: any) {
    logger.error('Test email failed:', error.message);
    return { success: false, error: error.message };
  }
}
