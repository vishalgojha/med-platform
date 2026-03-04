import twilio from "twilio";
import type { MessagingAdapter } from "../messaging/interface.js";

export class TenantTwilioMessagingAdapter implements MessagingAdapter {
  private readonly client;
  private readonly fromNumber: string;

  constructor(input: { accountSid: string; authToken: string; fromNumber: string }) {
    this.client = twilio(input.accountSid, input.authToken);
    this.fromNumber = input.fromNumber;
  }

  async send(message: { to: string; body: string; channel: "sms" | "whatsapp" }): Promise<{ id: string }> {
    const to = message.channel === "whatsapp" ? `whatsapp:${message.to}` : message.to;
    const from = message.channel === "whatsapp" ? `whatsapp:${this.fromNumber}` : this.fromNumber;
    const result = await this.client.messages.create({
      to,
      from,
      body: message.body
    });
    return { id: result.sid };
  }
}
