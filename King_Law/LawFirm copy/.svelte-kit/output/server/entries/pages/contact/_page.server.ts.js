import { fail } from "@sveltejs/kit";
import sgMail from "@sendgrid/mail";
import { b as private_env } from "../../../chunks/shared-server.js";
const CONTACT_EMAIL = "print@trialkings.law";
const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name")?.toString();
    const email = data.get("email")?.toString();
    const phone = data.get("phone")?.toString();
    const subject = data.get("subject")?.toString();
    const message = data.get("message")?.toString();
    if (!name || !email || !subject || !message) {
      return fail(400, { error: "All required fields must be filled" });
    }
    if (!private_env.SENDGRID_API_KEY) {
      console.error("SENDGRID_API_KEY not configured");
      return fail(500, { error: "Email service not configured. Please contact support." });
    }
    try {
      sgMail.setApiKey(private_env.SENDGRID_API_KEY);
      await sgMail.send({
        to: CONTACT_EMAIL,
        from: CONTACT_EMAIL,
        // Must be verified sender in SendGrid
        replyTo: email,
        subject: `[King Law Contact] ${subject}`,
        text: `Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}

Message:
${message}`,
        html: `
					<h2>New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${name}</p>
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Phone:</strong> ${phone || "Not provided"}</p>
					<p><strong>Subject:</strong> ${subject}</p>
					<hr />
					<p><strong>Message:</strong></p>
					<p>${message.replace(/\n/g, "<br />")}</p>
				`
      });
      console.log("Contact form email sent to:", CONTACT_EMAIL);
      return { success: true };
    } catch (error) {
      console.error("SendGrid error:", error);
      return fail(500, { error: "Failed to send message. Please try again later." });
    }
  }
};
export {
  actions
};
