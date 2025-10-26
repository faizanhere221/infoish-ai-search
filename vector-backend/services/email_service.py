# vector-backend/services/email_service.py
import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails to influencers"""
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_name = os.getenv("SMTP_FROM_NAME", "Infoishai Team")
        
        if not self.smtp_email or not self.smtp_password:
            logger.warning("⚠️ Email credentials not configured - emails will not be sent")
    
    def send_welcome_email(self, email: str, username: str, full_name: str, temp_password: str) -> bool:
        """
        Send welcome email with temporary password to new influencer
        
        Args:
            email: Influencer's email address
            username: Influencer's username
            full_name: Influencer's full name
            temp_password: Temporary password for first login
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            if not self.smtp_email or not self.smtp_password:
                logger.error("❌ Email credentials not configured")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.smtp_email}>"
            msg['To'] = email
            msg['Subject'] = "🎉 Welcome to Infoishai - Your Influencer Account is Ready!"
            
            # Email body (HTML)
            html_body = self._create_welcome_email_html(
                username=username,
                full_name=full_name,
                email=email,
                temp_password=temp_password
            )
            
            # Plain text fallback
            text_body = self._create_welcome_email_text(
                username=username,
                full_name=full_name,
                email=email,
                temp_password=temp_password
            )
            
            # Attach both versions
            part1 = MIMEText(text_body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_email, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"✅ Welcome email sent successfully to {email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication failed: {e}")
            logger.error("Check your SMTP_EMAIL and SMTP_PASSWORD in .env file")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error sending email to {email}: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error sending email to {email}: {e}")
            return False
    
    def _create_welcome_email_html(self, username: str, full_name: str, email: str, temp_password: str) -> str:
        """Create HTML email template"""
        login_url = os.getenv("FRONTEND_URL", "https://infoishai.com") + "/influencer/login"
        dashboard_url = os.getenv("FRONTEND_URL", "https://infoishai.com") + "/influencer/dashboard"
        
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Infoishai</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                                🎉 Welcome to Infoishai!
                            </h1>
                            <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                                Your influencer profile is now live
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 30px 20px;">
                            <p style="margin: 0 0 15px; font-size: 18px; color: #1f2937; line-height: 1.6;">
                                Hi <strong>{full_name}</strong>,
                            </p>
                            <p style="margin: 0 0 15px; font-size: 16px; color: #4b5563; line-height: 1.6;">
                                Congratulations! Your influencer profile has been successfully created on Infoishai, Pakistan's leading influencer discovery platform. Brands can now discover and connect with you!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Credentials Box -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 15px; font-size: 20px; color: #92400e;">
                                            🔐 Your Login Credentials
                                        </h2>
                                        <p style="margin: 0 0 10px; font-size: 14px; color: #78350f;">
                                            <strong>⚠️ IMPORTANT:</strong> Save these credentials in a safe place!
                                        </p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
                                            <tr>
                                                <td style="padding: 10px; background-color: #ffffff; border-radius: 8px; margin-bottom: 10px;">
                                                    <p style="margin: 0 0 5px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Username
                                                    </p>
                                                    <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 600;">
                                                        {username}
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px; background-color: #ffffff; border-radius: 8px; margin-top: 10px;">
                                                    <p style="margin: 0 0 5px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Email
                                                    </p>
                                                    <p style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 600;">
                                                        {email}
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px; background-color: #ffffff; border-radius: 8px; margin-top: 10px;">
                                                    <p style="margin: 0 0 5px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Temporary Password
                                                    </p>
                                                    <p style="margin: 0; font-size: 18px; color: #dc2626; font-weight: bold; font-family: 'Courier New', monospace; background-color: #fee2e2; padding: 8px; border-radius: 6px; display: inline-block;">
                                                        {temp_password}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 15px 0 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                                            💡 <strong>Security Tip:</strong> Change this temporary password immediately after your first login for better security.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Next Steps -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h3 style="margin: 0 0 15px; font-size: 18px; color: #1f2937;">
                                📋 Next Steps
                            </h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; color: #ffffff; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">
                                                        1
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 600;">
                                                        Login to your dashboard
                                                    </p>
                                                    <p style="margin: 5px 0 0; font-size: 14px; color: #6b7280;">
                                                        Use your email and temporary password above
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; color: #ffffff; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">
                                                        2
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 600;">
                                                        Change your password
                                                    </p>
                                                    <p style="margin: 5px 0 0; font-size: 14px; color: #6b7280;">
                                                        Update to a secure password you'll remember
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; color: #ffffff; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">
                                                        3
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 600;">
                                                        Complete your profile
                                                    </p>
                                                    <p style="margin: 5px 0 0; font-size: 14px; color: #6b7280;">
                                                        Keep your follower counts and content updated
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="40" valign="top">
                                                    <div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; color: #ffffff; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">
                                                        4
                                                    </div>
                                                </td>
                                                <td style="padding-left: 15px;">
                                                    <p style="margin: 0; font-size: 15px; color: #1f2937; font-weight: 600;">
                                                        Get discovered by brands
                                                    </p>
                                                    <p style="margin: 5px 0 0; font-size: 14px; color: #6b7280;">
                                                        Your profile will appear in search within 24 hours
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 0 30px 40px;" align="center">
                            <a href="{login_url}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                🚀 Login to Dashboard
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                                <strong>Need help?</strong> Contact us at 
                                <a href="mailto:support@infoishai.com" style="color: #3b82f6; text-decoration: none;">support@infoishai.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                This email was sent to {email} because you registered as an influencer on Infoishai.
                            </p>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #9ca3af;">
                                © {datetime.now().year} Infoishai. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
    
    def _create_welcome_email_text(self, username: str, full_name: str, email: str, temp_password: str) -> str:
        """Create plain text email fallback"""
        login_url = os.getenv("FRONTEND_URL", "https://infoishai.com") + "/influencer/login"
        
        return f"""
🎉 Welcome to Infoishai!

Hi {full_name},

Congratulations! Your influencer profile has been successfully created on Infoishai, Pakistan's leading influencer discovery platform.

🔐 YOUR LOGIN CREDENTIALS
================================
Username: {username}
Email: {email}
Temporary Password: {temp_password}
================================

⚠️ IMPORTANT: Save these credentials in a safe place and change your password after first login!

📋 NEXT STEPS:

1. Login to your dashboard
   Visit: {login_url}
   
2. Change your password
   Update to a secure password you'll remember
   
3. Complete your profile
   Keep your follower counts and content updated
   
4. Get discovered by brands
   Your profile will appear in search within 24 hours

NEED HELP?
Contact us at support@infoishai.com

© {datetime.now().year} Infoishai. All rights reserved.

---
This email was sent to {email} because you registered as an influencer on Infoishai.
        """


# Create singleton instance
email_service = EmailService()