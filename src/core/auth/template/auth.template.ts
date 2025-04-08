export const authEmailTemplate = (code: string): string => {
    return `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: #FE9142;
                    padding: 20px;
                }
                .email-container {
                    max-width: 600px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    margin: 0 auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .email-header {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333333;
                    margin-bottom: 20px;
                }
                .email-body {
                    font-size: 16px;
                    color: #555555;
                    line-height: 1.6;
                }
                .verification-code-container {
                    background-color: #FE9142;
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: bold;
                    padding: 15px 0;
                    border-radius: 8px;
                    margin: 20px 0;
                    width: 50%;
                    margin-left: auto;
                    margin-right: auto;
                }
                .footer {
                    font-size: 12px;
                    color: #888888;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">테커집 인증 코드</div>
                <div class="email-body">
                    아래의 인증 코드를 사용하여 이메일 인증을 완료하세요.<br>
                    <div class="verification-code-container">
                        ${code}
                    </div>
                    인증 코드는 <strong>5분간 유효</strong>합니다.
                </div>
                <div class="footer">
                    본 메일은 테커 회원 인증을 위해 발송된 이메일입니다.<br>
                    이메일 인증에 문제가 있다면, 관리자에게 문의주세요.
                </div>
            </div>
        </body>
        </html>
    `;
};
