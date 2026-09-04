import { mailGenerator } from "../lib/mailgen.js";

export const otpMail = async (userEmail: string, otp: string) => {
  const email = {
    body: {
      name: userEmail,

      intro: [
        "Your ResQ verification code is here 🔐",
        "You recently requested a One-Time Password (OTP) to verify your account or complete a secure action on ResQ.",
        "Use the verification code below to continue:",
        `<div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; letter-spacing: 5px; color: #0B3D91;">
            ${otp}
          </span>
        </div>`,
      ],

      outro: [
        "This verification code is valid for 10 minutes.",
        "For your security, never share this code with anyone.",
        "If you didn't request this code, you can safely ignore this email and your ResQ account will remain secure.",
        "",
        "Stay informed. Stay prepared. Stay safe. 💙",
        "",
        "— Team ResQ",
      ],
    },
  };

  const html = mailGenerator.generate(email);

  const plainText = mailGenerator.generatePlaintext(email);

  return { html, plainText };
};
