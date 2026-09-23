// The public demo account is shared with anyone who clicks "Try Demo" on the
// marketing site. It can use every feature, with one exception: it must never
// make the platform send real email to a real address, because the recipient
// would be whatever a stranger typed in.
import { createClient } from "@/lib/supabase/server";

const DEMO_USER_ID = "4b5183be-a713-40e9-85a5-4261ccd06819";

export const DEMO_EMAIL_BLOCKED =
  "The demo workspace can't send email. Create your own free account to send this for real.";

export async function isDemoSession() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id === DEMO_USER_ID;
  } catch {
    // No request context (a webhook or cron job) — never the demo account.
    return false;
  }
}
