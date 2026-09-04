import { mailGenerator } from "../lib/mailgen.js";

export const oauthWelcomeMail = async (
  username: string,
  provider: string,
  dashboardLink: string
) => {
  const email = {
    body: {
      name: username,

      intro: [
        "Welcome to Auth System 👋",
        `Your account has been successfully created using ${provider}.`,
        "You're all set and ready to go!",
      ],

      action: {
        instructions: "Click below to go to your dashboard:",
        button: {
          color: "#0B3D91",
          text: "Go to Dashboard",
          link: dashboardLink,
        },
      },

      outro: [
        "What you can do now:",
        "",
        "✔ Access your personalized dashboard",
        "✔ Update your profile information",
        "✔ Explore all features of Auth System",
        "✔ Manage your account settings",
        "",
        "Your account is fully activated and ready to use. Enjoy!",
        "",
        "If you have any questions or need assistance, just reply to this email — we're here to help 💙",
      ],
    },
  };

  // Generate an HTML email with the provided contents
  const html = mailGenerator.generate(email);

  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  const plainText = mailGenerator.generatePlaintext(email);

  return { html, plainText };
};
