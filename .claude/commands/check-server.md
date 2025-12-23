---
description: 서버 상태 확인 (PM2, Nginx)
---

서버 상태를 확인해줘:

1. PM2 상태: `pm2 status`
2. PM2 로그 (최근 20줄): `pm2 logs ilouli-api --lines 20`
3. Nginx 상태: `systemctl status nginx`
4. 포트 사용 현황: `netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000|4000)'`

문제가 있으면 해결 방법을 제안해줘.
