"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateAccount = void 0;
const BadRequestError_1 = require("../common/errors/BadRequestError");
const user_model_1 = require("../modules/Users/user.model");
const mailer_1 = require("./mailer");
const activateAccount = async (email) => {
    if (!email) {
        throw new BadRequestError_1.BadRequestError("Email is required");
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await user_model_1.UserModel.findOne({ email: normalizedEmail });
    if (!user) {
        throw new BadRequestError_1.BadRequestError("User not found");
    }
    await mailer_1.transporter.sendMail({
        from: "Support Team",
        to: normalizedEmail,
        subject: "Account Activation",
        html: `<p>Hello,</p><p>Click the link to activate your account.</p> <br/>
    <a href="https://yourapp.com/activate?email=${encodeURIComponent(normalizedEmail)}">Activate Account</a>`,
    });
    user.isActivated = true;
    await user.save();
    return true;
};
exports.activateAccount = activateAccount;
//# sourceMappingURL=activateAccount.js.map