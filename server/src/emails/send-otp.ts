import { mailGenerator } from "../lib/mailgen.js";

export const otpMail = async (userEmail: string, otp: string) => {
  const email = {
    body: {
      name: userEmail,

      intro: [
        "You recently requested a One-Time Password (OTP) to verify your account or complete a secure action.",
        "Your verification code is below:",
        `<div style="text-align: center; margin: 30px 0;"><span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; letter-spacing: 5px; color: #333;">${otp}</span></div>`,
      ],

      outro: [
        "This code is valid for 10 minutes.",
        "If you didn't request this code, you can safely ignore this email and your account will remain secure.",
        "",
        "Need help? Just reply to this email — we're here for you 💙",
      ],
    },
  };

  const html = mailGenerator.generate(email);
  const plainText = mailGenerator.generatePlaintext(email);

  return { html, plainText };
};
