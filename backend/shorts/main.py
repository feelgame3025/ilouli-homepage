#!/usr/bin/env python3
"""
YouTube Shorts 자동 생성 파이프라인
CLI 진입점
"""
import asyncio
import sys
import time
from pathlib import Path
from datetime import datetime
from typing import Optional

import click

from config import OUTPUT_DIR, OPENAI_API_KEY, KLING_API_KEY
from content_generator import ContentGenerator, MockContentGenerator
from video_generator import VideoGenerator, MockVideoGenerator
from tts_generator import TTSGenerator, MockTTSGenerator
from video_editor import VideoEditor


class ShortsPipeline:
    """YouTube Shorts 자동 생성 파이프라인"""

    def __init__(self, use_mock: bool = False):
        """
        Args:
            use_mock: True면 Mock 생성기 사용 (API 비용 절약)
        """
        self.use_mock = use_mock

        # Mock 모드일 때는 모든 생성기를 Mock으로 사용
        if use_mock:
            self.content_gen = MockContentGenerator()
            self.video_gen = MockVideoGenerator()
            self.tts_gen = MockTTSGenerator()
        else:
            self.content_gen = ContentGenerator()
            self.video_gen = VideoGenerator()
            self.tts_gen = TTSGenerator()

        # 영상 편집기
        self.editor = VideoEditor()

    async def generate(self, topic: str, output_name: Optional[str] = None) -> dict:
        """
        주제로부터 YouTube Shorts 생성

        Args:
            topic: 주제 (한국어)
            output_name: 출력 파일명 (없으면 자동 생성)

        Returns:
            {
                "output_path": "/path/to/final.mp4",
                "english": "...",
                "korean": "...",
                "duration": 10.0,
                "cost_estimate": 282  # 원
            }
        """
        start_time = time.time()
        print(f"\n{'='*60}")
        print(f"YouTube Shorts 생성 시작")
        print(f"주제: {topic}")
        print(f"Mock 모드: {self.use_mock}")
        print(f"{'='*60}\n")

        # 1단계: 콘텐츠 생성
        print("[1/4] 콘텐츠 생성 중...")
        content = self.content_gen.generate(topic)
        print(f"  English: {content['english']}")
        print(f"  Korean: {content['korean']}")

        # 2단계: 비디오 생성
        print("\n[2/4] 비디오 생성 중...")
        video_result = await self.video_gen.generate(content["video_prompt"])
        print(f"  Video: {video_result['video_path']}")

        # 3단계: TTS 생성
        print("\n[3/4] 음성 생성 중...")
        tts_result = self.tts_gen.generate(content["english"])
        print(f"  Audio: {tts_result['audio_path']}")

        # 4단계: 최종 렌더링
        print("\n[4/4] 영상 렌더링 중...")

        if output_name:
            output_path = str(OUTPUT_DIR / f"{output_name}.mp4")
        else:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_topic = topic.replace(" ", "_")[:20]
            output_path = str(OUTPUT_DIR / f"shorts_{safe_topic}_{timestamp}.mp4")

        render_result = self.editor.render(
            video_path=video_result["video_path"],
            voice_path=tts_result["audio_path"],
            english_text=content["english"],
            korean_text=content["korean"],
            output_path=output_path
        )

        elapsed = time.time() - start_time

        # 비용 추정 (PRD 기준)
        cost_estimate = 0 if self.use_mock else 282  # 원

        result = {
            "output_path": render_result["output_path"],
            "english": content["english"],
            "korean": content["korean"],
            "video_prompt": content["video_prompt"],
            "duration": render_result["duration"],
            "cost_estimate": cost_estimate,
            "elapsed_seconds": elapsed,
        }

        print(f"\n{'='*60}")
        print(f"생성 완료!")
        print(f"  출력: {result['output_path']}")
        print(f"  길이: {result['duration']:.1f}초")
        print(f"  소요시간: {elapsed:.1f}초")
        print(f"  예상비용: ₩{cost_estimate}")
        print(f"{'='*60}\n")

        return result

    def generate_sync(self, topic: str, output_name: str = None) -> dict:
        """동기 버전의 generate 메서드"""
        return asyncio.run(self.generate(topic, output_name))


@click.group()
def cli():
    """YouTube Shorts 자동 생성 파이프라인"""
    pass


@cli.command()
@click.argument("topic")
@click.option("--output", "-o", help="출력 파일명 (확장자 제외)")
@click.option("--mock", is_flag=True, help="Mock 모드 (API 호출 없이 테스트)")
def generate(topic: str, output: str, mock: bool):
    """
    주제로부터 YouTube Shorts 생성

    TOPIC: 영상 주제 (한국어)
    """
    # API 키 확인
    if not mock:
        if not OPENAI_API_KEY:
            click.echo("Error: OPENAI_API_KEY가 설정되지 않았습니다.", err=True)
            click.echo("  .env 파일에 OPENAI_API_KEY=... 추가하세요.", err=True)
            sys.exit(1)
        if not KLING_API_KEY:
            click.echo("Warning: KLING_API_KEY가 설정되지 않았습니다.", err=True)
            click.echo("  비디오 생성에 Mock 모드를 사용합니다.", err=True)

    pipeline = ShortsPipeline(use_mock=mock)

    try:
        result = pipeline.generate_sync(topic, output)
        click.echo(f"\n성공! 출력 파일: {result['output_path']}")
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument("topics", nargs=-1)
@click.option("--mock", is_flag=True, help="Mock 모드")
def batch(topics: tuple, mock: bool):
    """
    여러 주제로 배치 생성

    TOPICS: 영상 주제들 (공백으로 구분)
    """
    if not topics:
        click.echo("Error: 주제를 입력하세요.", err=True)
        sys.exit(1)

    pipeline = ShortsPipeline(use_mock=mock)
    results = []

    for i, topic in enumerate(topics, 1):
        click.echo(f"\n[{i}/{len(topics)}] 처리 중: {topic}")
        try:
            result = pipeline.generate_sync(topic)
            results.append({"topic": topic, "success": True, **result})
        except Exception as e:
            click.echo(f"  Error: {e}", err=True)
            results.append({"topic": topic, "success": False, "error": str(e)})

    # 결과 요약
    click.echo(f"\n{'='*60}")
    click.echo("배치 생성 결과:")
    success = sum(1 for r in results if r["success"])
    click.echo(f"  성공: {success}/{len(topics)}")

    for r in results:
        status = "성공" if r["success"] else "실패"
        click.echo(f"  - {r['topic']}: {status}")


@cli.command()
def check():
    """환경 설정 확인"""
    click.echo("환경 설정 확인 중...\n")

    # API 키 확인
    click.echo("API 키:")
    click.echo(f"  OPENAI_API_KEY: {'설정됨' if OPENAI_API_KEY else '미설정'}")
    click.echo(f"  KLING_API_KEY: {'설정됨' if KLING_API_KEY else '미설정'}")

    # FFmpeg 확인
    click.echo("\nFFmpeg:")
    try:
        import subprocess
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        version = result.stdout.split("\n")[0]
        click.echo(f"  {version}")
    except FileNotFoundError:
        click.echo("  설치되지 않음!")

    # 디렉토리 확인
    click.echo("\n디렉토리:")
    from config import OUTPUT_DIR, TEMP_DIR, BGM_DIR
    click.echo(f"  OUTPUT_DIR: {OUTPUT_DIR} (존재: {OUTPUT_DIR.exists()})")
    click.echo(f"  TEMP_DIR: {TEMP_DIR} (존재: {TEMP_DIR.exists()})")
    click.echo(f"  BGM_DIR: {BGM_DIR} (파일 수: {len(list(BGM_DIR.glob('*')))})")


if __name__ == "__main__":
    cli()
