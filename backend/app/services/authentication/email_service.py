import asyncio
from concurrent.futures import ThreadPoolExecutor
from email.message import EmailMessage
import smtplib
import logging

from backend.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    _executor = ThreadPoolExecutor(max_workers=5)  # Limit concurrent email operations
    
    # Keep a pool of SMTP connections
    _smtp_pool = None  # Initialize a connection pool
    
    @staticmethod
    async def send_otp_email(email: str, otp: str, is_registration: bool = True):
        # Create a subject based on operation type
        subject = "Email Verification" if is_registration else "Password Reset Request"
        
        # Schedule the email sending as a background task
        asyncio.create_task(
            EmailService._send_email_background(email, otp, subject, is_registration)
        )
        
        return True
    
    @staticmethod
    async def send_restore_account_otp_email(email: str, otp: str):
        """Send OTP email for account restoration"""
        subject = "Account Restoration Request - MockPie"
        
        # Schedule the email sending as a background task
        asyncio.create_task(
            EmailService._send_restore_email_background(email, otp, subject)
        )
        
        return True
    
    @staticmethod
    async def _send_email_background(email: str, otp: str, subject: str, is_registration: bool):
        """Send email in background without blocking the main request handler"""
        try:
            # Create email message
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = settings.smtp_username
            msg["To"] = email

            plain_text = f"""
            {'Welcome to MockPie' if is_registration else 'Password Reset Request for MockPie'}
            
            Your verification code is: {otp}
            
            {'Please verify your email to complete registration.' if is_registration else 'Please use this code to reset your password.'}
            
            This code will expire in 10 minutes.
            """

            msg.set_content(plain_text)

            # Run SMTP operations in a thread pool to avoid blocking
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                EmailService._executor,
                EmailService._send_smtp_email,
                msg,
            )
            
            logger.info(f"Email sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            # Email failure doesn't need to affect the user experience
            # Just log it for troubleshooting
    
    @staticmethod
    async def _send_restore_email_background(email: str, otp: str, subject: str):
        """Send restore account email in background without blocking the main request handler"""
        try:
            # Create email message
            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = settings.smtp_username
            msg["To"] = email

            plain_text = f"""
            Account Restoration Request - MockPie
            
            You have requested to restore your deleted MockPie account.
            
            Your verification code is: {otp}
            
            Please use this code to verify your identity and restore your account.
            
            This code will expire in 10 minutes.
            
            If you did not request this restoration, please ignore this email.
            """

            msg.set_content(plain_text)

            # Run SMTP operations in a thread pool to avoid blocking
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                EmailService._executor,
                EmailService._send_smtp_email,
                msg,
            )
            
            logger.info(f"Restore account email sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send restore account email: {str(e)}")
            # Email failure doesn't need to affect the user experience
            # Just log it for troubleshooting
    
    @staticmethod
    def _send_smtp_email(msg):
        """Run in threadpool - synchronous SMTP code using Mailtrap"""
        try:
            # Log Mailtrap connection
            print(f"Connecting to Mailtrap: {settings.smtp_server}:{settings.smtp_port}")
            
            with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
                # Comment out or conditionally enable in dev only
                # server.set_debuglevel(1)
                server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(msg)
                print("Email sent successfully to Mailtrap!")
                return True
        except Exception as e:
            print(f"Mailtrap SMTP Error: {str(e)}")
            print(f"Would have sent email to: {msg['To']}")
            print(f"Subject: {msg['Subject']}")
            print(f"Content: {msg.get_content()}")
            return False  # Return False on error but don't raise