import Mailgen from "mailgen";

// Configure Mailgen with ResQ branding and product information
export const mailGenerator = new Mailgen({
  theme: "default",

  product: {
    // Appears in the header & footer of emails
    name: "ResQ",

    // ResQ application/website
    link: process.env.FRONTEND_URL || "http://localhost:3000",

    // Optional product logo
    // logo: "https://your-resq-domain.com/logo.png",

    copyright: `© ${new Date().getFullYear()} ResQ. All rights reserved.`,
  },
});
