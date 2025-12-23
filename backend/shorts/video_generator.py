"""
비디오 생성 모듈 - Kling AI를 사용하여 AI 비디오 생성
"""
import asyncio
import time
from pathlib import Path
from typing import Optional
import httpx

from config import KLING_API_KEY, KLING_CONFIG, RETRY_CONFIG, TEMP_DIR


class VideoGenerator:
    """Kling AI를 사용하여 텍스트로부터 비디오 생성"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or KLING_API_KEY
        self.base_url = KLING_CONFIG["base_url"]
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def generate(
        self,
        prompt: str,
        duration: int = None,
        output_path: Optional[str] = None
    ) -> dict:
        """
        텍스트 프롬프트로부터 비디오 생성

        Args:
            prompt: 비디오 생성 프롬프트
            duration: 비디오 길이 (초)
            output_path: 저장 경로 (없으면 자동 생성)

        Returns:
            {
                "video_path": "/path/to/video.mp4",
                "duration": 10.0,
                "task_id": "kling_xyz789"
            }
        """
        duration = duration or KLING_CONFIG["duration"]

        retry_config = RETRY_CONFIG["video_generation"]
        last_error = None

        for attempt in range(retry_config["max_retries"]):
            try:
                # 1. 비디오 생성 요청
                task_id = await self._create_task(prompt, duration)
                print(f"[VideoGenerator] 생성 작업 시작: {task_id}")

                # 2. 완료 대기
                result = await self._poll_task(task_id)
                print(f"[VideoGenerator] 생성 완료: {result['video_url'][:50]}...")

                # 3. 비디오 다운로드
                if output_path is None:
                    output_path = str(TEMP_DIR / f"video_{task_id}.mp4")

                video_path = await self._download_video(result["video_url"], output_path)
                print(f"[VideoGenerator] 다운로드 완료: {video_path}")

                return {
                    "video_path": video_path,
                    "duration": result.get("duration", duration),
                    "task_id": task_id
                }

            except Exception as e:
                last_error = e
                if attempt < retry_config["max_retries"] - 1:
                    wait = retry_config["backoff_seconds"][attempt]
                    print(f"[VideoGenerator] 에러 발생, {wait}초 후 재시도... ({attempt + 1})")
                    await asyncio.sleep(wait)

        raise Exception(f"비디오 생성 실패: {last_error}")

    async def _create_task(self, prompt: str, duration: int) -> str:
        """비디오 생성 작업 생성"""
        payload = {
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": KLING_CONFIG["aspect_ratio"],
            "model": KLING_CONFIG["model"],
            "cfg_scale": 0.5,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/videos/text-to-video",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            # API 응답 형식에 따라 task_id 추출
            task_id = data.get("task_id") or data.get("id") or data.get("data", {}).get("task_id")
            if not task_id:
                raise Exception(f"task_id를 찾을 수 없음: {data}")

            return task_id

    async def _poll_task(self, task_id: str, max_wait: int = 300) -> dict:
        """작업 완료까지 폴링"""
        poll_interval = 5  # 5초마다 확인
        max_attempts = max_wait // poll_interval

        async with httpx.AsyncClient(timeout=30) as client:
            for attempt in range(max_attempts):
                response = await client.get(
                    f"{self.base_url}/tasks/{task_id}",
                    headers=self.headers
                )
                response.raise_for_status()
                result = response.json()

                # API 응답 형식에 따라 상태 추출
                status = result.get("status") or result.get("data", {}).get("status")

                if status == "completed" or status == "succeed":
                    output = result.get("output") or result.get("data", {}).get("output", {})
                    video_url = output.get("video_url") or output.get("url")
                    if video_url:
                        return {
                            "video_url": video_url,
                            "duration": output.get("duration")
                        }
                    raise Exception(f"video_url을 찾을 수 없음: {result}")

                elif status == "failed" or status == "error":
                    error_msg = result.get("error") or result.get("message") or "알 수 없는 에러"
                    raise Exception(f"비디오 생성 실패: {error_msg}")

                # 진행 상황 출력
                progress = result.get("progress", 0)
                print(f"[VideoGenerator] 생성 중... {progress}% ({attempt * poll_interval}s)")

                await asyncio.sleep(poll_interval)

        raise TimeoutError(f"비디오 생성 타임아웃 ({max_wait}초)")

    async def _download_video(self, video_url: str, save_path: str) -> str:
        """생성된 비디오 다운로드"""
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.get(video_url)
            response.raise_for_status()

            Path(save_path).parent.mkdir(parents=True, exist_ok=True)
            with open(save_path, "wb") as f:
                f.write(response.content)

            return save_path

    def generate_sync(self, prompt: str, duration: int = None, output_path: str = None) -> dict:
        """동기 버전의 generate 메서드"""
        return asyncio.run(self.generate(prompt, duration, output_path))


class MockVideoGenerator:
    """
    테스트용 Mock 비디오 생성기
    실제 API 호출 없이 더미 비디오 생성
    """

    def __init__(self, api_key: Optional[str] = None):
        pass

    async def generate(
        self,
        prompt: str,
        duration: int = 10,
        output_path: Optional[str] = None
    ) -> dict:
        """더미 비디오 생성 (테스트용) - FFmpeg로 실제 비디오 생성"""
        import subprocess
        print(f"[MockVideoGenerator] 테스트용 비디오 생성 중...")
        print(f"[MockVideoGenerator] Prompt: {prompt[:100]}...")

        if output_path is None:
            output_path = str(TEMP_DIR / f"mock_video_{int(time.time())}.mp4")

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # FFmpeg로 테스트용 컬러바 비디오 생성 (9:16 세로)
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c=blue:size=1080x1920:duration={duration}:rate=30",
            "-f", "lavfi",
            "-i", f"sine=frequency=440:duration={duration}",
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac",
            "-shortest",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[MockVideoGenerator] FFmpeg 경고: {result.stderr[:200] if result.stderr else 'none'}")

        print(f"[MockVideoGenerator] 테스트 비디오 생성: {output_path}")

        return {
            "video_path": output_path,
            "duration": duration,
            "task_id": f"mock_{int(time.time())}"
        }

    def generate_sync(self, prompt: str, duration: int = None, output_path: str = None) -> dict:
        """동기 버전"""
        return asyncio.run(self.generate(prompt, duration or 10, output_path))


# CLI 테스트
if __name__ == "__main__":
    # Mock 생성기로 테스트
    generator = MockVideoGenerator()

    test_prompt = "A cute cartoon elephant waving its trunk happily at a colorful zoo, kawaii style, bright colors"

    print(f"\n{'='*50}")
    print("Testing MockVideoGenerator")
    print('='*50)

    result = generator.generate_sync(test_prompt)
    print(f"Video Path: {result['video_path']}")
    print(f"Duration: {result['duration']}")
    print(f"Task ID: {result['task_id']}")
