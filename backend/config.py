from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    app_name: str
    app_url: str
    debug: bool
    database_url: str
    postgres_user: str
    postgres_password: str
    postgres_db: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    model_config = SettingsConfigDict(env_file=str(Path(__file__).parent / ".env"))

settings = Settings()
