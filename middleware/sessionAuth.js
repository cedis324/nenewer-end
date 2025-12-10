/**
 * middleware/sessionAuth.js
 * 
 * 세션 기반 관리자 인증 미들웨어
 * req.session.isAdmin이 true일 때만 통과
 * API 요청은 JSON 401, HTML 페이지 요청은 경고 후 메인으로 리다이렉트
 */

export default function sessionAuth(req, res, next) {
    // 세션에 isAdmin이 true로 설정되어 있는지 확인
    if (req.session && req.session.isAdmin === true) {
        return next();
    }

    // 요청 헤더의 Accept를 통해 HTML 페이지 접근인지 판별
    const accept = req.headers.accept || '';
    const isHtml = accept.includes('text/html');

    if (isHtml) {
        // HTML 요청: 경고창 띄우고 메인으로 리다이렉트하는 간단한 페이지 반환
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(401).send(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>인증 필요</title></head>
<body><script>alert('로그인하십시오');location.replace('/');</script></body></html>`);
    }

    // API 요청: JSON 401 반환
    return res.status(401).json({ ok: false, message: '로그인이 필요합니다.' });
}
