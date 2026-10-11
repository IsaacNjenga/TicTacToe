import { BadRequestError } from "../common/errors/BadRequestError";
import { UserModel } from "../modules/Users/user.model";
import { transporter } from "./mailer";

export const activateAccount = async (email: string): Promise<boolean> => {
  if (!email) {
    throw new BadRequestError("Email is required");
  }
  const normalizedEmail = email.toLowerCase().trim();

  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new BadRequestError("User not found");
  }

  await transporter.sendMail({
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
