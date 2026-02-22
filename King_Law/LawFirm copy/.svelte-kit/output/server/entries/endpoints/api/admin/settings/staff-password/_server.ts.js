import { error, json } from "@sveltejs/kit";
import { d as db, s as systemSettings } from "../../../../../../chunks/index3.js";
import { hash } from "@node-rs/argon2";
import { v as validateSessionToken } from "../../../../../../chunks/auth.js";
async function requireAdmin(cookies) {
  const sessionToken = cookies.get("auth_session");
  if (!sessionToken) {
    throw error(401, "Authentication required");
  }
  const { user: sessionUser } = await validateSessionToken(sessionToken);
  if (!sessionUser || sessionUser.role !== "admin") {
    throw error(403, "Admin access required");
  }
  return sessionUser;
}
const PUT = async ({ request, cookies }) => {
  await requireAdmin(cookies);
  try {
    const { password } = await request.json();
    if (!password || password.length < 6) {
      throw error(400, "Password must be at least 6 characters");
    }
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });
    await db.insert(systemSettings).values({
      key: "staff_signup_password",
      value: passwordHash
    }).onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: passwordHash,
        updatedAt: Math.floor(Date.now() / 1e3)
      }
    });
    return json({ success: true });
  } catch (err) {
    console.error("Failed to update staff password:", err);
    if (err instanceof Response) throw err;
    throw error(500, "Failed to update staff password");
  }
};
export {
  PUT
};
