import os


class Settings:
    APP_NAME: str = "PHCode AI Service"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")

    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "qwen2.5:0.5b")

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5000"))


settings = Settings()
