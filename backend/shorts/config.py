"""
YouTube Shorts 자동 생성 파이프라인 설정
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 기본 경로
BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "assets"
BGM_DIR = ASSETS_DIR / "bgm"
OUTPUT_DIR = BASE_DIR / "output"
TEMP_DIR = BASE_DIR / "temp"

# 디렉토리 생성
for dir_path in [ASSETS_DIR, BGM_DIR, OUTPUT_DIR, TEMP_DIR]:
    dir_path.mkdir(exist_ok=True)

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
KLING_API_KEY = os.getenv("KLING_API_KEY")

# OpenAI 설정
OPENAI_CONFIG = {
    "model": "gpt-4o-mini",
    "tts_model": "tts-1",
    "tts_voice": "nova",  # alloy, echo, fable, onyx, nova, shimmer
    "tts_speed": 0.9,     # 아동용 약간 느리게
}

# Kling AI 설정
KLING_CONFIG = {
    "base_url": os.getenv("KLING_BASE_URL", "https://api.klingai.com/v1"),
    "model": "kling-v1.5",
    "duration": 10,
    "aspect_ratio": "9:16",
    "timeout": 300,
}

# 비디오 설정
VIDEO_CONFIG = {
    "resolution": (1080, 1920),  # 9:16 비율
    "fps": 30,
    "codec": "libx264",
    "audio_codec": "aac",
}

# 자막 설정
SUBTITLE_CONFIG = {
    "font": "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "english_size": 48,
    "korean_size": 36,
    "english_color": "white",
    "korean_color": "yellow",
    "border_width": 3,
    "position_y_english": 200,  # 하단에서의 거리
    "position_y_korean": 120,
}

# 오디오 설정
AUDIO_CONFIG = {
    "voice_volume": 1.0,
    "bgm_volume": 0.3,
}

# 재시도 설정
RETRY_CONFIG = {
    "content_generation": {
        "max_retries": 3,
        "backoff_seconds": [1, 2, 5],
    },
    "video_generation": {
        "max_retries": 2,
        "backoff_seconds": [10, 30],
    },
    "tts": {
        "max_retries": 3,
        "backoff_seconds": [1, 2, 3],
    }
}

# 품질 검증 설정
QUALITY_CONFIG = {
    "min_sentence_words": 3,
    "max_sentence_words": 15,
    "min_video_duration": 8,
    "max_video_duration": 12,
    "forbidden_words": ["scary", "horror", "blood", "fight", "죽", "무서"],
    "required_style_words": ["cute", "cartoon", "bright"],
}
