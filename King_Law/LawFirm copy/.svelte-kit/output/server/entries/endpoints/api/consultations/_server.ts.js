import { json } from "@sveltejs/kit";
import { d as db, f as consultations } from "../../../../chunks/index3.js";
import { a as generateId } from "../../../../chunks/auth.js";
import { desc } from "drizzle-orm";
const FIRM_EMAIL = "info@kinglawpllc.com";
const FIRM_NAME = "King Law, P.L.L.C.";
async function sendEmail(options) {
  try {
    console.log(`📧 Email queued (no provider configured):`, {
      to: options.to,
      subject: options.subject,
      preview: options.text.substring(0, 100) + "...",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
async function notifyFirmOfConsultation(consultation) {
  const { firstName, lastName, email, phone, message } = consultation;
  await sendEmail({
    to: FIRM_EMAIL,
    subject: `New Consultation Request from ${firstName} ${lastName}`,
    text: [
      `New consultation request received:`,
      ``,
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      ``,
      `Message:`,
      message,
      ``,
      `---`,
      `This is an automated notification from ${FIRM_NAME} website.`
    ].join("\n"),
    html: `
			<h2>New Consultation Request</h2>
			<table style="border-collapse:collapse;">
				<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name:</td><td>${firstName} ${lastName}</td></tr>
				<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
				<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone:</td><td>${phone || "Not provided"}</td></tr>
			</table>
			<h3>Message:</h3>
			<p style="background:#f5f5f5;padding:12px;border-radius:4px;">${message.replace(/\n/g, "<br>")}</p>
			<hr>
			<p style="color:#888;font-size:12px;">Automated notification from ${FIRM_NAME} website.</p>
		`
  });
}
const POST = async ({ request }) => {
  try {
    const { firstName, lastName, email, phone, message, matterType, currentlyRepresented, urgency, preferredDate } = await request.json();
    if (!firstName || !lastName || !email) {
      return json({ error: "Please fill in all required fields" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    const [consultation] = await db.insert(consultations).values({
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message?.trim() || null,
      matterType: matterType || null,
      currentlyRepresented: currentlyRepresented || null,
      urgency: urgency || null,
      preferredDate: preferredDate || null,
      status: "new"
    }).returning();
    console.log("📋 New consultation request stored:", {
      id: consultation.id,
      name: `${firstName} ${lastName}`,
      email,
      matterType,
      urgency,
      preferredDate,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    notifyFirmOfConsultation({ firstName, lastName, email, phone, message }).catch(
      (err) => console.error("Failed to send consultation notification email:", err)
    );
    return json({
      success: true,
      message: "Consultation request received successfully"
    });
  } catch (err) {
    console.error("Consultation form error:", err);
    return json({ error: "Failed to submit consultation request" }, { status: 500 });
  }
};
const GET = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (locals.user.role !== "lawyer" && locals.user.role !== "admin") {
    return json({ error: "Access denied" }, { status: 403 });
  }
  try {
    const allConsultations = await db.select().from(consultations).orderBy(desc(consultations.createdAt));
    return json({ consultations: allConsultations });
  } catch (err) {
    console.error("Fetch consultations error:", err);
    return json({ error: "Failed to fetch consultations" }, { status: 500 });
  }
};
export {
  GET,
  POST
};
