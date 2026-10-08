import nodemailer from "nodemailer";

import { requireMailConfig } from "../../config/env";

export const createMailTransport = () => {
  requireMailConfig();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

