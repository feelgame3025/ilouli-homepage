"""
영상 편집 모듈 - FFmpeg를 사용하여 최종 영상 렌더링
"""
import os
import random
import subprocess
from pathlib import Path
from typing import Optional, List

from config import (
    SUBTITLE_CONFIG, AUDIO_CONFIG, VIDEO_CONFIG,
    BGM_DIR, OUTPUT_DIR, TEMP_DIR
)


class VideoEditor:
    """FFmpeg를 사용하여 비디오, 음성, BGM, 자막을 합성"""

    def __init__(self, font_path: Optional[str] = None, skip_ffmpeg_check: bool = False):
        self.font_path = font_path or SUBTITLE_CONFIG["font"]
        self.ffmpeg_available = False
        if not skip_ffmpeg_check:
            self._check_ffmpeg()

    def _check_ffmpeg(self):
        """FFmpeg 설치 확인"""
        try:
            result = subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                self.ffmpeg_available = True
            else:
                print("[VideoEditor] Warning: FFmpeg가 설치되어 있지 않습니다.")
        except FileNotFoundError:
            print("[VideoEditor] Warning: FFmpeg가 설치되어 있지 않습니다. 'apt install ffmpeg'로 설치하세요.")

    def render(
        self,
        video_path: str,
        voice_path: str,
        english_text: str,
        korean_text: str,
        bgm_path: Optional[str] = None,
        output_path: Optional[str] = None
    ) -> dict:
        """
        최종 영상 렌더링

        Args:
            video_path: 비디오 파일 경로
            voice_path: 음성 파일 경로
            english_text: 영어 자막
            korean_text: 한국어 자막
            bgm_path: BGM 파일 경로 (없으면 BGM 풀에서 랜덤 선택)
            output_path: 출력 파일 경로

        Returns:
            {
                "output_path": "/path/to/final.mp4",
                "duration": 10.0,
                "success": True
            }
        """
        # 출력 경로 설정
        if output_path is None:
            import time
            output_path = str(OUTPUT_DIR / f"shorts_{int(time.time())}.mp4")

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # FFmpeg 없으면 Mock 결과 반환
        if not self.ffmpeg_available:
            print("[VideoEditor] FFmpeg 없음 - Mock 결과 반환")
            print(f"  - Video: {video_path}")
            print(f"  - Voice: {voice_path}")
            print(f"  - English: {english_text}")
            print(f"  - Korean: {korean_text}")

            # 더미 파일 생성 (비디오 복사)
            import shutil
            if Path(video_path).exists():
                shutil.copy(video_path, output_path)
            else:
                Path(output_path).touch()

            return {
                "output_path": output_path,
                "duration": 10.0,
                "success": True,
                "mock": True
            }

        # BGM 선택
        if bgm_path is None:
            bgm_path = self._select_bgm()

        print(f"[VideoEditor] 렌더링 시작...")
        print(f"  - Video: {video_path}")
        print(f"  - Voice: {voice_path}")
        print(f"  - BGM: {bgm_path or 'None'}")

        # 자막 텍스트 이스케이프 (FFmpeg용)
        english_escaped = self._escape_text(english_text)
        korean_escaped = self._escape_text(korean_text)

        # 자막 필터 생성
        subtitle_filter = self._build_subtitle_filter(english_escaped, korean_escaped)

        # FFmpeg 명령어 구성
        if bgm_path and Path(bgm_path).exists():
            cmd = self._build_command_with_bgm(
                video_path, voice_path, bgm_path,
                subtitle_filter, output_path
            )
        else:
            cmd = self._build_command_without_bgm(
                video_path, voice_path,
                subtitle_filter, output_path
            )

        # FFmpeg 실행
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            print(f"[VideoEditor] 렌더링 완료: {output_path}")

            # 출력 파일 정보
            duration = self._get_video_duration(output_path)

            return {
                "output_path": output_path,
                "duration": duration,
                "success": True
            }

        except subprocess.CalledProcessError as e:
            print(f"[VideoEditor] FFmpeg 에러: {e.stderr}")
            raise RuntimeError(f"영상 렌더링 실패: {e.stderr}")

    def _escape_text(self, text: str) -> str:
        """FFmpeg 자막용 텍스트 이스케이프"""
        # 특수문자 이스케이프
        text = text.replace("\\", "\\\\")
        text = text.replace(":", "\\:")
        text = text.replace("'", "\\'")
        text = text.replace('"', '\\"')
        return text

    def _build_subtitle_filter(self, english: str, korean: str) -> str:
        """자막 오버레이 필터 생성"""
        cfg = SUBTITLE_CONFIG

        # 폰트 파일 존재 확인
        font_file = cfg["font"]
        if not Path(font_file).exists():
            # 기본 폰트 사용
            font_file = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

        # 영어 자막 (위)
        english_filter = (
            f"drawtext=fontfile='{font_file}':"
            f"text='{english}':"
            f"fontsize={cfg['english_size']}:"
            f"fontcolor={cfg['english_color']}:"
            f"borderw={cfg['border_width']}:"
            f"bordercolor=black:"
            f"x=(w-text_w)/2:"
            f"y=h-{cfg['position_y_english']}"
        )

        # 한국어 자막 (아래)
        korean_filter = (
            f"drawtext=fontfile='{font_file}':"
            f"text='{korean}':"
            f"fontsize={cfg['korean_size']}:"
            f"fontcolor={cfg['korean_color']}:"
            f"borderw={cfg['border_width']-1}:"
            f"bordercolor=black:"
            f"x=(w-text_w)/2:"
            f"y=h-{cfg['position_y_korean']}"
        )

        return f"{english_filter},{korean_filter}"

    def _build_command_with_bgm(
        self,
        video_path: str,
        voice_path: str,
        bgm_path: str,
        subtitle_filter: str,
        output_path: str
    ) -> List[str]:
        """BGM 포함 FFmpeg 명령어 생성"""
        voice_vol = AUDIO_CONFIG["voice_volume"]
        bgm_vol = AUDIO_CONFIG["bgm_volume"]

        return [
            "ffmpeg", "-y",
            "-i", video_path,           # 0: 비디오
            "-i", voice_path,           # 1: 음성
            "-i", bgm_path,             # 2: BGM
            "-filter_complex",
            f"[1:a]volume={voice_vol}[voice];"
            f"[2:a]volume={bgm_vol}[bgm];"
            f"[voice][bgm]amix=inputs=2:duration=first[audio];"
            f"[0:v]{subtitle_filter}[video]",
            "-map", "[video]",
            "-map", "[audio]",
            "-c:v", VIDEO_CONFIG["codec"],
            "-c:a", VIDEO_CONFIG["audio_codec"],
            "-shortest",
            output_path
        ]

    def _build_command_without_bgm(
        self,
        video_path: str,
        voice_path: str,
        subtitle_filter: str,
        output_path: str
    ) -> List[str]:
        """BGM 없는 FFmpeg 명령어 생성"""
        return [
            "ffmpeg", "-y",
            "-i", video_path,           # 0: 비디오
            "-i", voice_path,           # 1: 음성
            "-filter_complex",
            f"[0:v]{subtitle_filter}[video]",
            "-map", "[video]",
            "-map", "1:a",
            "-c:v", VIDEO_CONFIG["codec"],
            "-c:a", VIDEO_CONFIG["audio_codec"],
            "-shortest",
            output_path
        ]

    def _select_bgm(self) -> Optional[str]:
        """BGM 풀에서 랜덤 선택"""
        bgm_files = list(BGM_DIR.glob("*.mp3")) + list(BGM_DIR.glob("*.wav"))

        if not bgm_files:
            print("[VideoEditor] BGM 파일이 없습니다. BGM 없이 진행합니다.")
            return None

        selected = random.choice(bgm_files)
        print(f"[VideoEditor] BGM 선택: {selected.name}")
        return str(selected)

    def _get_video_duration(self, video_path: str) -> float:
        """비디오 길이 확인"""
        try:
            result = subprocess.run([
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                video_path
            ], capture_output=True, text=True)
            return float(result.stdout.strip())
        except Exception:
            return 0.0


# CLI 테스트
if __name__ == "__main__":
    editor = VideoEditor()

    print(f"\n{'='*50}")
    print("VideoEditor 초기화 완료")
    print(f"Font: {editor.font_path}")
    print(f"BGM Dir: {BGM_DIR}")
    print(f"Output Dir: {OUTPUT_DIR}")
    print('='*50)
