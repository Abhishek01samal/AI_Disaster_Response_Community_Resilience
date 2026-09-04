import { registrationMail } from "../emails/registration-mail.js";
import { otpMail } from "../emails/send-otp.js";
import { verificationMail } from "../emails/verify-email.js";
import { oauthWelcomeMail } from "../emails/oauth-welcome-mail.js";
import { transporter } from "../lib/nodemailer.js";
import logger from "../lib/logger.js";

const sendRegistrationMail = async (
  username: string,
  email: string,
  verifyLink: string
) => {
  try {
    const { html, plainText } = await registrationMail(
      username,
      verifyLink
    );

    const info = await transporter.sendMail({
      from: '"ResQ Support" <support@resq.org>',
      to: email,
      subject: "Welcome to ResQ",
      text: plainText,
      html: html,
    });

    // console.log("Message sent: %s", info.messageId);
  } catch (err) {
    logger.error("Error while sending mail:", err);
  }
};

const sendVerificationMail = async (
  username: string,
  email: string,
  verifyLink: string
) => {
  try {
    const { html, plainText } = await verificationMail(
      username,
      verifyLink
    );

    const info = await transporter.sendMail({
      from: '"ResQ Support" <support@resq.org>',
      to: email,
      subject: "Verify your email for ResQ",
      text: plainText,
      html: html,
    });

    // console.log("Message sent: %s", info.messageId);
  } catch (err) {
    logger.error("Error while sending mail:", err);
  }
};

const sendOtpMail = async (email: string, otp: string) => {
  try {
    const { html, plainText } = await otpMail(email, otp);

    const info = await transporter.sendMail({
      from: '"ResQ Support" <support@resq.org>',
      to: email,
      subject: "Your ResQ Verification Code",
      text: plainText,
      html: html,
    });

    // console.log("Message sent: %s", info.messageId);
  } catch (err) {
    logger.error("Error while sending mail:", err);
  }
};

const sendOauthWelcomeMail = async (
  username: string,
  email: string,
  provider: string,
  dashboardLink: string
) => {
  try {
    const { html, plainText } = await oauthWelcomeMail(
      username,
      provider,
      dashboardLink
    );

    const info = await transporter.sendMail({
      from: '"ResQ Support" <support@resq.org>',
      to: email,
      subject: `Welcome to ResQ - ${provider} Login`,
      text: plainText,
      html: html,
    });

    // console.log("Message sent: %s", info.messageId);
  } catch (err) {
    logger.error("Error while sending mail:", err);
  }
};

export {
  sendRegistrationMail,
  sendVerificationMail,
  sendOtpMail,
  sendOauthWelcomeMail,
};
