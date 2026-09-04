import { mailGenerator } from "../lib/mailgen.js";

export const verificationMail = async (
  username: string,
  verifyLink: string
) => {
  const email = {
    body: {
      name: username,

      intro: [
        "Welcome to ResQ 👋",
        "Please verify your email address to activate your account and continue using ResQ.",
      ],

      action: {
        instructions: "Click the button below to verify your email:",
        button: {
          color: "#0B3D91",
          text: "Verify My Email",
          link: verifyLink,
        },
      },

      outro: [
        "This verification link will expire in 10 minutes.",
        "If you didn't request this verification, you can safely ignore this email.",
        "",
        "Or copy and paste the following link into your browser:",
        verifyLink,
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
