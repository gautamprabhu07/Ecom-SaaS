import Nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";

dotenv.config();

console.log({
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SERVICE: process.env.SMTP_SERVICE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "LOADED" : "MISSING",
});

const transporter = Nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: Number(process.env.SMTP_PORT),
   service: process.env.SMTP_SERVICE,
   auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
   },
});

//Render an EJS template and send an email
const renderEmailTemplate = async (templateName: string, data: Record<string,any>): Promise<string> => {
   const templatePath = path.join(
   process.cwd(),
   "apps",
   "auth-service",
   "src",
   "utils",
   "email-templates",
   `${templateName}.ejs`,
);

return ejs.renderFile(templatePath, data);

};

//send an email using nodemailer
export const sendEmail = async (to: string, subject: string, templateName: string, data: Record<string, any>) => {
   try
   {
      const html = await renderEmailTemplate(templateName, data);

      await transporter.sendMail({
         from: `<${process.env.SMTP_USER}>`,
         to,
         subject,
         html,
      });
      return true;
   }
   catch (error) {
      console.error("Error sending email:", error);
      return false;
   }
};
