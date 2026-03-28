let nodemailer = require('nodemailer');

// Cấu hình Mailtrap SMTP (thay bằng thông tin từ Mailtrap của bạn)
let transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: '6db1eead27095d',
        pass: '4fcc787dadaa6e'
    }
});

module.exports = {
    sendWelcomeEmail: async function (toEmail, username, plainPassword) {
        let mailOptions = {
            from: '"No Reply" <no-reply@example.com>',
            to: toEmail,
            subject: 'Chào mừng bạn đến với hệ thống',
            html: `
                <h2>Xin chào ${username},</h2>
                <p>Tài khoản của bạn đã được tạo thành công.</p>
                <p><strong>Tên đăng nhập:</strong> ${username}</p>
                <p><strong>Mật khẩu:</strong> ${plainPassword}</p>
                <p>Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.</p>
            `
        };
        console.log('[mailHandler] Đang gửi mail tới:', toEmail)
        let info = await transporter.sendMail(mailOptions);
        console.log('[mailHandler] Gửi thành công - MessageId:', info.messageId, '| Preview:', info.response)
        return info
    }
};
