import { mailGenerator } from "../lib/mailgen.js";

export const registrationMail = async (
  username: string,
  verifyLink: string
) => {
  const email = {
    body: {
      name: username,

      intro: [
        "Welcome to ResQ 👋",
        "Your ResQ account has been successfully created.",
        "You're now ready to access a platform built to turn changing flood conditions into actionable emergency intelligence.",
      ],

      action: {
        instructions:
          "Verify your email address to activate your ResQ account:",
        button: {
          color: "#0B3D91",
          text: "Verify My Account",
          link: verifyLink,
        },
      },

      outro: [
        "With ResQ, you can:",
        "",
        "✔ Monitor flood risk and changing conditions",
        "✔ Understand potential population and infrastructure impact",
        "✔ Access emergency-response insights",
        "✔ Explore actionable recommendations for critical situations",
        "",
        "If you didn't create a ResQ account, you can safely ignore this email.",
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
