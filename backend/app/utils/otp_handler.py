import random
import string
from datetime import datetime, timedelta

class OTPHandler:
    @staticmethod
    def generate_otp(length=6):
        """Generate a numeric OTP of specified length"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def get_otp_expiry(minutes=10):
        """Get expiry time for OTP"""
        return datetime.now() + timedelta(minutes=minutes)