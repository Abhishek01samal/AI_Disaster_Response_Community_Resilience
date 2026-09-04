import { mailGenerator } from "../lib/mailgen.js";

export const verificationMail = async (
  username: string,
  verifyLink: string
) => {
  const email = {
    body: {
      name: username,

      intro: ["Please verify your email address to continue."],

      action: {
        instructions: "Click the button below to verify your email:",
        button: {
          color: "#0B3D91",
          text: "Verify Email",
          link: verifyLink,
        },
      },

      outro: [
        "This link will expire in 10 minutes.",
        "If you didn’t request this, you can ignore this email.",
        "",
        "Or copy and paste this link into your browser:",
        verifyLink,
      ],
    },
  };

  const html = mailGenerator.generate(email);
  const plainText = mailGenerator.generatePlaintext(email);

  return { html, plainText };
};
