import Mailgen from "mailgen";

// Configure mailgen by setting a theme and your product info
export const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    // Appears in header & footer of e-mails
    name: "Auth System",
    link: "https://mailgen.js/",
    // Optional product logo
    // logo: 'https://mailgen.js/img/logo.png'
    copyright: `© ${new Date().getFullYear()} Auth System`,
  },
});
