# 에셋 관리 규칙 (Asset Management Rules)

## 원칙

사용자 업로드 파일(`backend/uploads/`)을 앱 에셋으로 사용할 때는 반드시 별도 위치에 복사해서 사용한다.

## 저장 위치

| 구분 | 위치 | 용도 |
|------|------|------|
| 사용자 업로드 | `backend/uploads/` | 임시 저장, 사용자가 삭제 가능 |
| 앱 에셋 | `frontend/public/assets/` 또는 `backend/assets/` | 앱에서 사용하는 고정 리소스 |

## 에셋 적용 워크플로우

1. 사용자가 업로드한 파일 중 에셋으로 사용할 파일 선택
2. 해당 파일을 `assets/` 폴더로 복사
3. 코드에서 복사된 경로 참조
4. 원본 uploads 파일은 사용자가 삭제 가능
5. 에셋 폴더의 파일은 앱에서 안정적으로 사용

## 예시

```javascript
// 고스톱 화투 이미지
// 복사 전: https://api.ilouli.com/api/files/view/filename.png (uploads 폴더)
// 복사 후: /assets/hwatu/1-1.png (고정 에셋)
```
