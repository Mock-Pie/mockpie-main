from enum import Enum

class ErrorMessage(str, Enum):
    """
    Standard exception response messages used across the application.
    Using Enum provides both type safety and string values.
    """
    
    # Authentication errors
    INVALID_CREDENTIALS = "Invalid username or password"
    AUTHENTICATION_REQUIRED = "Authentication required"
    INVALID_TOKEN = "Invalid or expired token"
    INSUFFICIENT_PERMISSIONS = "Insufficient permissions to perform this action"
    TOKEN_EXPIRED = "Token has expired"
    INVALID_REFRESH_TOKEN = "Invalid refresh token"
    INVALID_OTP = "Invalid OTP provided"
    EXPIRED_OTP = "OTP has expired. Please request a new one."
    FAILED_TO_CREATE_RESET_PASSWORD_OTP = "Failed to create password reset otp"
    FAILED_TO_SEND_RESET_PASSWORD_EMAIL = "Failed to send password reset email"
    RESET_PASSWORD_SESSIION_EXPIRED='Session expired. Please request a new password reset or re-verify your email.'
    FAILED_TO_RESET_PASSWORD = "Failed to reset password"
    EMAIL_ALREADY_VERIFIED = "Email is already verified"
    FAILED_TO_CREATE_VERIFICATION_OTP = "Failed to create verification OTP"
    FAILED_TO_SEND_VERIFICATION_EMAIL = "Failed to send verification email"
    
    # User related errors
    USER_NOT_FOUND = "User not found or deleted"
    USER_ALREADY_EXISTS = "User with this email already exists"
    USERNAME_TAKEN = "Username already taken"
    EMAIL_TAKEN = "Email address already registered"
    PHONE_TAKEN = "Phone number already registered"
    INVALID_PASSWORD = "Password does not meet security requirements"
    PASSWORD_MISMATCH = "Passwords do not match"
    EMAIL_DOES_NOT_EXIST = "Email address does not exist"
    EMAIL_NOT_VERIFIED = "Email address not verified"
    DELETED_USER_EXISTS_WITH_THIS_EMAIL = "A deleted user exists with this email address. Please wait 30 days before registering with this email again."
    DELETED_USER_EXISTS_WITH_THIS_USERNAME = "A deleted user exists with this username. Please wait 30 days before using this username again."
    DELETED_USER_EXISTS_WITH_THIS_PHONE = "A deleted user exists with this phone number. Please wait 30 days before registering with this phone number again."
    RETRIVAL_FAILED = "Error reactivating user and associated data"
    NO_DELETED_USER_FOUND = "No deleted user found with this email address"
    RESTORE_ACCOUNT_DENIED = "Cannot restore accounts deleted more than 30 days ago"
    FAILED_TO_CREATE_RESTORATION_OTP = 'Failed to create restoration OTP'
    FAILED_TO_SEND_RESTORATION_OTP_EMAIL = 'Failed to send restoration OTP email'
    
    # Presentation related errors
    PRESENTATION_NOT_FOUND = "Presentation not found"
    PRESENTATION_ACCESS_DENIED = "Access to this presentation is denied"
    UPLOAD_FAILED = "Failed to upload presentation"
    INVALID_FILE_FORMAT = "Invalid file format. Please upload a supported video format"
    FILE_TOO_LARGE = "File size exceeds maximum allowed limit"
    TOPIC_EMPTY = "Topic cannot be empty"
    VIDEO_NOT_FOUND = "Video file not found"
    
    # Upcoming presentation related errors
    UPCOMING_PRESENTATION_NOT_FOUND = "Upcoming presentation not found or already deleted"
    
    # Analysis related errors
    ANALYSIS_NOT_FOUND = "Analysis not found"
    ANALYSIS_IN_PROGRESS = "Analysis is still in progress"
    ANALYSIS_FAILED = "Analysis failed to complete"
    NO_VOICE_DETECTED = "No voice detected in the presentation"
    NO_PERSON_DETECTED = "No person detected in the presentation"
    
    # Feedback related errors
    FEEDBACK_NOT_FOUND = "Feedback not found"
    FEEDBACK_ALREADY_SUBMITTED = "Feedback already submitted for this presentation"
    INVALID_RATING = "Rating must be between 1 and 5"
    
    # Database errors
    DATABASE_ERROR = "Database operation failed"
    TRANSACTION_FAILED = "Transaction failed to complete"
    INTEGRITY_ERROR = "Database integrity constraint violation"
    
    # Resource errors
    RESOURCE_NOT_FOUND = "Requested resource not found"
    RESOURCE_EXISTS = "Resource already exists"
    RESOURCE_IN_USE = "Resource is currently in use"
    
    # Rate limiting
    RATE_LIMIT_EXCEEDED = "Rate limit exceeded. Please try again later"
    
    # General errors
    BAD_REQUEST = "Bad request"
    INTERNAL_SERVER_ERROR = "Internal server error"
    SERVICE_UNAVAILABLE = "Service temporarily unavailable"
    NOT_IMPLEMENTED = "This feature is not yet implemented"
    VALIDATION_ERROR = "Validation error in request data"
    
    # Media processing errors
    MEDIA_PROCESSING_FAILED = "Failed to process media file"
    INVALID_MEDIA_FORMAT = "Invalid media format"
    CORRUPTED_MEDIA = "Media file appears to be corrupted"
    TRANSCRIPTION_FAILED = "Speech transcription failed"
    
    # API related errors
    API_ERROR = "Error communicating with external API"
    ENDPOINT_NOT_FOUND = "API endpoint not found"
    METHOD_NOT_ALLOWED = "HTTP method not allowed for this endpoint"
    TOO_MANY_REQUESTS = "Too many requests"
    
    # Redis errors
    REDIS_CONNECTION_ERROR = "Failed to connect to Redis"
    
    # Upcoming presentation errors
    INVALID_UPCOMING_PRESENTATION_DATE = "Upcoming presentation date must be in the future"
    
    # Format errors
    INVALID_DATE_FORMAT = "Invalid date format. Use ISO format: YYYY-MM-DDTHH:MM:SS"
    