import Mailgen from "mailgen";
import nodemailer from "nodemailer";

// Initialize Mailgen
const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Project Management",
    link: process.env.FRONTEND_URL || "http://localhost:3000",
  },
});

// Send email utility
export const sendEmail = async ({ email, subject, mailgenContent }) => {
  if (!email || !subject || !mailgenContent) {
    throw new Error("Missing parameters for sending email");
  }

  // Generate HTML & Plain text email
  const emailHtml = mailGenerator.generate(mailgenContent);
  const emailText = mailGenerator.generatePlaintext(mailgenContent);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  // Prepare mail options
  const mailOptions = {
    from: process.env.MAIL_FROM || "no-reply@projectmanagement.com",
    to: email,
    subject,
    text: emailText,
    html: emailHtml,
  };

  // Send mail
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed");
  }
};

// Mailgen content for email verification
export const emailVerificationMailgenContent = (username, verificationUrl) => {
  if (!username || !verificationUrl) {
    throw new Error("Missing parameters for email verification content");
  }

  return {
    body: {
      name: username,
      intro: "Welcome to our platform! We're excited to have you on board.",
      action: {
        instructions:
          "To get started with your new account, please verify your email address by clicking the button below.",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro: "If you didn't create an account, no further action is required.",
    },
  };
};

// Mailgen content for password reset
export const forgetPasswordMailgenContent = (username, passwordResetUrl) => {
  if (!username || !passwordResetUrl) {
    throw new Error("Missing parameters for password reset content");
  }

  return {
    body: {
      name: username,
      intro: "We're sorry to hear that you've forgotten your password.",
      action: {
        instructions: "To reset your password, please click the button below.",
        button: {
          color: "#22BC66",
          text: "Reset your password",
          link: passwordResetUrl,
        },
      },
      outro: "If you didn't create an account, no further action is required.",
    },
  };
};
