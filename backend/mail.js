import Mailgen from "mailgen";


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