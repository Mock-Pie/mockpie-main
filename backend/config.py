from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str
    app_url: str
    debug: bool
    database_url: str
    postgres_user: str
    postgres_password: str
    postgres_db: str
    secret_key: str

    class Config:
        env_file = ".env"


settings = Settings()
