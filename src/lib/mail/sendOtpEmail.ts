import { createMailTransport } from "./nodemailerClient";

export const sendOtpEmail = async (params: {
  toEmail: string;
  otp: string;
  purposeLabel: string;
}) => {
  const transport = createMailTransport();

  const from = process.env.SMTP_FROM_EMAIL;
  if (!from) throw new Error("Missing SMTP_FROM_EMAIL");

  const mail = await transport.sendMail({
    from,
    to: params.toEmail,
    subject: `Your verification code (${params.purposeLabel})`,
    text: `Your OTP code is: ${params.otp}. It expires in 10 minutes.`,
  });

  return { messageId: mail.messageId };
};

