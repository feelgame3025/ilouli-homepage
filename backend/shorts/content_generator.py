"""
콘텐츠 생성 모듈 - GPT-4o-mini를 사용하여 영어 학습 콘텐츠 생성
"""
import json
import time
from typing import Optional
from openai import OpenAI

from config import OPENAI_API_KEY, OPENAI_CONFIG, RETRY_CONFIG, QUALITY_CONFIG


class ContentGenerator:
    """GPT를 사용하여 영어 학습 콘텐츠 생성"""

    def __init__(self, api_key: Optional[str] = None):
        self.client = OpenAI(api_key=api_key or OPENAI_API_KEY)
        self.model = OPENAI_CONFIG["model"]

    def generate(self, topic: str, previous_sentences: list = None) -> dict:
        """
        주제로부터 영어 문장, 한국어 번역, 비디오 프롬프트 생성

        Args:
            topic: 주제 (한국어)
            previous_sentences: 이전에 생성된 문장들 (중복 방지용)

        Returns:
            {
                "english": "I see a big elephant!",
                "korean": "나는 큰 코끼리를 봐요!",
                "video_prompt": "A cute cartoon elephant...",
                "keywords": ["elephant", "big"],
                "category": "animals"
            }
        """
        previous = previous_sentences or []

        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(topic, previous)

        retry_config = RETRY_CONFIG["content_generation"]
        last_error = None

        for attempt in range(retry_config["max_retries"]):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                    max_tokens=500
                )

                content = json.loads(response.choices[0].message.content)

                # 품질 검증
                validated = self._validate_content(content)
                if validated:
                    return validated

                # 검증 실패시 재시도
                print(f"[ContentGenerator] 품질 검증 실패, 재시도 중... ({attempt + 1})")

            except Exception as e:
                last_error = e
                if attempt < retry_config["max_retries"] - 1:
                    wait = retry_config["backoff_seconds"][attempt]
                    print(f"[ContentGenerator] 에러 발생, {wait}초 후 재시도... ({attempt + 1})")
                    time.sleep(wait)

        raise Exception(f"콘텐츠 생성 실패: {last_error}")

    def _build_system_prompt(self) -> str:
        """시스템 프롬프트 생성"""
        return """You are an expert English teacher creating content for 9-year-old Korean children.
Your goal is to make English learning fun and engaging.

RULES:
1. Use simple vocabulary (top 500 most common English words)
2. Sentences should be 4-8 words long
3. Use present simple or present continuous tense
4. Make it enthusiastic and fun (use exclamations!)
5. Video prompts must be child-friendly, cute, and colorful

VIDEO PROMPT RULES:
- MUST include: "cute", "cartoon", "bright colors", "child-friendly"
- Style: kawaii, Pixar-like 3D, or cute 2D animation
- NO scary, dark, or violent elements
- Characters should be expressive and friendly

Always respond in valid JSON format."""

    def _build_user_prompt(self, topic: str, previous: list) -> str:
        """사용자 프롬프트 생성"""
        previous_text = ""
        if previous:
            previous_text = f"\n\nPrevious sentences (avoid similar content):\n- " + "\n- ".join(previous[-5:])

        return f"""Topic: {topic}{previous_text}

Create engaging English learning content for a 9-year-old.

Output JSON:
{{
  "english": "Simple English sentence (4-8 words, enthusiastic)",
  "korean": "Natural Korean translation",
  "video_prompt": "Detailed prompt for AI video generation (cute cartoon style, child-friendly, bright colors)",
  "keywords": ["main", "words"],
  "category": "animals|food|family|nature|activities|emotions|school|weather"
}}"""

    def _validate_content(self, content: dict) -> Optional[dict]:
        """콘텐츠 품질 검증"""
        required_fields = ["english", "korean", "video_prompt"]

        # 필수 필드 확인
        for field in required_fields:
            if field not in content or not content[field]:
                print(f"[ContentGenerator] 필수 필드 누락: {field}")
                return None

        english = content["english"]
        video_prompt = content["video_prompt"].lower()

        # 문장 길이 검증
        word_count = len(english.split())
        if word_count < QUALITY_CONFIG["min_sentence_words"]:
            print(f"[ContentGenerator] 문장이 너무 짧음: {word_count} words")
            return None
        if word_count > QUALITY_CONFIG["max_sentence_words"]:
            print(f"[ContentGenerator] 문장이 너무 김: {word_count} words")
            return None

        # 금지어 확인
        for word in QUALITY_CONFIG["forbidden_words"]:
            if word.lower() in english.lower() or word in video_prompt:
                print(f"[ContentGenerator] 금지어 발견: {word}")
                return None

        # 필수 스타일 키워드 확인
        has_required_style = any(
            word in video_prompt
            for word in QUALITY_CONFIG["required_style_words"]
        )
        if not has_required_style:
            # 자동으로 추가
            content["video_prompt"] += ", cute cartoon style, bright colors, child-friendly"

        # 기본값 설정
        content.setdefault("keywords", [])
        content.setdefault("category", "general")

        return content


class MockContentGenerator:
    """테스트용 Mock 콘텐츠 생성기"""

    MOCK_CONTENTS = [
        {
            "english": "I see a big elephant!",
            "korean": "나는 큰 코끼리를 봐요!",
            "video_prompt": "A cute cartoon elephant waving its trunk happily at a colorful zoo, kawaii style, bright colors, child-friendly animation",
            "keywords": ["elephant", "big", "zoo"],
            "category": "animals"
        },
        {
            "english": "I love my breakfast!",
            "korean": "나는 아침 식사가 좋아요!",
            "video_prompt": "A cute cartoon child happily eating colorful breakfast at a sunny kitchen table, kawaii style, bright colors, child-friendly",
            "keywords": ["breakfast", "food", "morning"],
            "category": "food"
        },
        {
            "english": "The rain is falling down!",
            "korean": "비가 내리고 있어요!",
            "video_prompt": "Cute cartoon children playing in the rain with colorful umbrellas, kawaii style, bright colors, child-friendly, happy atmosphere",
            "keywords": ["rain", "weather", "umbrella"],
            "category": "weather"
        },
    ]

    def __init__(self, api_key=None):
        pass

    def generate(self, topic: str, previous_sentences: list = None) -> dict:
        """Mock 콘텐츠 생성"""
        import random
        content = random.choice(self.MOCK_CONTENTS).copy()
        print(f"[MockContentGenerator] 주제 '{topic}'에 대한 Mock 콘텐츠 생성")
        return content


# CLI 테스트
if __name__ == "__main__":
    # Mock 생성기로 테스트
    generator = MockContentGenerator()

    test_topics = ["동물원에서", "아침 식사", "비 오는 날"]

    for topic in test_topics:
        print(f"\n{'='*50}")
        print(f"Topic: {topic}")
        print('='*50)

        try:
            result = generator.generate(topic)
            print(f"English: {result['english']}")
            print(f"Korean: {result['korean']}")
            print(f"Video Prompt: {result['video_prompt'][:100]}...")
            print(f"Keywords: {result.get('keywords', [])}")
        except Exception as e:
            print(f"Error: {e}")
