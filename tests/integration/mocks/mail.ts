//Records emails instead of sending them. Mapped over both services' mail helpers by jest.integration.config.js.
export interface SentEmail {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export const sentEmails: SentEmail[] = [];
//set to true to make every send fail, like an SMTP outage
export const mailBehavior = { fail: false };

export const sendEmail = async (to: string, subject: string, template: string, data: Record<string, unknown> = {}) => {
  if (mailBehavior.fail) throw new Error('smtp down');
  sentEmails.push({ to, subject, template, data });
};

export default { sendEmail };
