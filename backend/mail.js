import Mailgen from "mailgen";
import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Project Management",
            link: "http://localhost:3000"
        }
    });

    const emailHtml = mailGenerator.generate(options.mailgenContent);

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS
        }
    });

    const mail = {
        from: process.env.MAIL_FROM,
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml
    };

    try {
        await transporter.sendMail(mail);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};


export const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our platform! We're excited to have you on board.",
            action: {
                instructions: "To get started with your new account, please verify your email address by clicking the button below.",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationUrl,
                }
            },
            outro: "If you didn't create an account, no further action is required."
        }
    };
};


export const forgetPasswordMailgenContent = (username, passwordResetUrl) => {
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
                }
            },
            outro: "If you didn't create an account, no further action is required."
        }
    };
};