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
        "Welcome to ResQ 👋",
        `Your account has been successfully created using ${provider}.`,
        "You're all set to access ResQ and stay informed with actionable emergency intelligence.",
      ],

      action: {
        instructions: "Click below to access your ResQ dashboard:",
        button: {
          color: "#0B3D91",
          text: "Go to ResQ Dashboard",
          link: dashboardLink,
        },
      },

      outro: [
        "With ResQ, you can:",
        "",
        "✔ Monitor flood risk and changing conditions",
        "✔ Understand potential population and infrastructure impact",
        "✔ View emergency-response insights",
        "✔ Access actionable recommendations for critical situations",
        "",
        "Your account is fully activated and ready to use.",
        "",
        "Stay informed. Stay prepared. Stay safe. 💙",
        "",
        "— Team ResQ",
      ],
    },
  };

  // Generate an HTML email with the provided contents
  const html = mailGenerator.generate(email);

  // Generate the plaintext version of the email
  const plainText = mailGenerator.generatePlaintext(email);

  return { html, plainText };
};
