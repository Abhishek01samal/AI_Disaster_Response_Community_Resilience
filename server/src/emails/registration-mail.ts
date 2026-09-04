import { mailGenerator } from "../lib/mailgen.js";

export const registrationMail = async (
  username: string,
  verifyLink: string
) => {
  const email = {
    body: {
      name: username,

      intro: [
        "Welcome to Auth System 👋",
        "Your account has been successfully created.",
        "Please verify your email to activate your account and get started.",
      ],

      action: {
        instructions: "Click below to verify your account:",
        button: {
          color: "#0B3D91",
          text: "Verify My Account",
          link: verifyLink,
        },
      },

      outro: [
        "What you can do after verification:",
        "",
        "✔ Securely access your account",
        "✔ Use protected features",
        "✔ Manage your profile and settings",
        "",
        "If you didn’t create this account, you can safely ignore this email.",
        "",
        "Need help? Just reply to this email — we’re here for you 💙",
      ],
    },
  };

  // Generate an HTML email with the provided contents
  const html = mailGenerator.generate(email);

  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const plainText = mailGenerator.generatePlaintext(email);
  return { html, plainText };
};
