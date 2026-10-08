"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = void 0;
const nodemailerClient_1 = require("./nodemailerClient");
const sendOtpEmail = async (params) => {
    const transport = (0, nodemailerClient_1.createMailTransport)();
    const from = process.env.SMTP_FROM_EMAIL;
    if (!from)
        throw new Error("Missing SMTP_FROM_EMAIL");
    const mail = await transport.sendMail({
        from,
        to: params.toEmail,
        subject: `Your verification code (${params.purposeLabel})`,
        text: `Your OTP code is: ${params.otp}. It expires in 10 minutes.`,
    });
    return { messageId: mail.messageId };
};
exports.sendOtpEmail = sendOtpEmail;
//# sourceMappingURL=sendOtpEmail.js.map