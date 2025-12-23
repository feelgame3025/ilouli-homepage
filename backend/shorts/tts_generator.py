"""
TTS 음성 생성 모듈 - OpenAI TTS를 사용하여 영어 음성 생성
"""
import time
from pathlib import Path
from typing import Optional
from openai import OpenAI

from config import OPENAI_API_KEY, OPENAI_CONFIG, RETRY_CONFIG, TEMP_DIR


class TTSGenerator:
    """OpenAI TTS를 사용하여 텍스트를 음성으로 변환"""

    # 사용 가능한 음성 옵션
    VOICES = {
        "alloy": "중성적, 활기찬",
        "echo": "남성적, 깊은",
        "fable": "영국식, 이야기체",
        "onyx": "남성적, 권위있는",
        "nova": "여성적, 밝고 친근한",  # 아동용 추천
        "shimmer": "여성적, 차분하고 부드러운",
    }

    def __init__(self, api_key: Optional[str] = None):
        self.client = OpenAI(api_key=api_key or OPENAI_API_KEY)
        self.model = OPENAI_CONFIG["tts_model"]
        self.default_voice = OPENAI_CONFIG["tts_voice"]
        self.default_speed = OPENAI_CONFIG["tts_speed"]

    def generate(
        self,
        text: str,
        output_path: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None
    ) -> dict:
        """
        텍스트를 음성으로 변환

        Args:
            text: 변환할 텍스트 (영어)
            output_path: 저장 경로 (없으면 자동 생성)
            voice: 음성 종류 (alloy, echo, fable, onyx, nova, shimmer)
            speed: 속도 (0.25 ~ 4.0, 기본 0.9)

        Returns:
            {
                "audio_path": "/path/to/audio.mp3",
                "duration": 3.2,  # 예상 길이
                "text": "I see a big elephant!"
            }
        """
        voice = voice or self.default_voice
        speed = speed or self.default_speed

        if output_path is None:
            output_path = str(TEMP_DIR / f"voice_{int(time.time())}.mp3")

        retry_config = RETRY_CONFIG["tts"]
        last_error = None

        for attempt in range(retry_config["max_retries"]):
            try:
                response = self.client.audio.speech.create(
                    model=self.model,
                    voice=voice,
                    input=text,
                    speed=speed,
                    response_format="mp3"
                )

                # 파일로 저장
                Path(output_path).parent.mkdir(parents=True, exist_ok=True)
                response.stream_to_file(output_path)

                # 음성 길이 추정 (정확한 값은 ffprobe로 확인 필요)
                estimated_duration = self._estimate_duration(text, speed)

                print(f"[TTSGenerator] 음성 생성 완료: {output_path}")

                return {
                    "audio_path": output_path,
                    "duration": estimated_duration,
                    "text": text
                }

            except Exception as e:
                last_error = e
                if attempt < retry_config["max_retries"] - 1:
                    wait = retry_config["backoff_seconds"][attempt]
                    print(f"[TTSGenerator] 에러 발생, {wait}초 후 재시도... ({attempt + 1})")
                    time.sleep(wait)

        raise Exception(f"TTS 생성 실패: {last_error}")

    def _estimate_duration(self, text: str, speed: float) -> float:
        """
        텍스트 길이로 음성 길이 추정
        평균 영어 발화 속도: 약 150 단어/분 = 2.5 단어/초
        """
        word_count = len(text.split())
        base_duration = word_count / 2.5  # 기본 속도 기준
        return base_duration / speed  # 속도 보정

    def get_voice_for_content(self, category: str) -> str:
        """콘텐츠 카테고리에 맞는 음성 추천"""
        voice_map = {
            "animals": "nova",      # 밝고 친근한
            "food": "nova",
            "family": "shimmer",    # 차분한
            "nature": "shimmer",
            "activities": "alloy",  # 활기찬
            "emotions": "nova",
            "school": "fable",      # 이야기체
            "weather": "nova",
        }
        return voice_map.get(category, "nova")


class MockTTSGenerator:
    """테스트용 Mock TTS 생성기"""

    def __init__(self, api_key: Optional[str] = None):
        pass

    def generate(
        self,
        text: str,
        output_path: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None
    ) -> dict:
        """더미 음성 파일 생성"""
        print(f"[MockTTSGenerator] 더미 음성 생성 중...")
        print(f"[MockTTSGenerator] Text: {text}")

        if output_path is None:
            output_path = str(TEMP_DIR / f"mock_voice_{int(time.time())}.mp3")

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # FFmpeg 없이 빈 파일 생성 (테스트용)
        duration = len(text.split()) / 2.5  # 단어 수 기반 예상 길이
        Path(output_path).touch()
        print(f"[MockTTSGenerator] 더미 파일 생성: {output_path}")

        return {
            "audio_path": output_path,
            "duration": duration,
            "text": text
        }


# CLI 테스트
if __name__ == "__main__":
    # Mock 생성기로 테스트
    generator = MockTTSGenerator()

    test_text = "I see a big elephant at the zoo!"

    print(f"\n{'='*50}")
    print("Testing MockTTSGenerator")
    print('='*50)

    result = generator.generate(test_text)
    print(f"Audio Path: {result['audio_path']}")
    print(f"Duration: {result['duration']:.2f}s")
    print(f"Text: {result['text']}")
