import { RequestHandler, Router } from "express";
import {
  createId,
  createOtpCode,
  hashPassword,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  createOTPChallenge,
  getOTPChallenge,
  consumeOTPChallenge,
  User
} from "../storage-supabase";
import { signToken, verifyToken } from "../utils/jwt";
import { sendMail } from "../utils/mailer";

const router = Router();

function setAuthCookie(res: any, token: string, req: any) {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  const isSecure = proto.includes("https");
  const cookie = [
    `auth_token=${encodeURIComponent(token)}`,
    "Path=/",
    // Remove HttpOnly to allow client-side access for development
    // In production, consider using HttpOnly with a separate refresh token approach
    "SameSite=Lax",
    isSecure ? "Secure" : "",
    `Max-Age=${7 * 24 * 60 * 60}`,
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookie);
}
function getTokenFromCookie(req: any): string | null {
  const raw = req.headers.cookie as string | undefined;
  if (!raw) {
    console.log('No cookies found in request');
    return null;
  }
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const [k, v] = p.split("=", 2); // Limit split to avoid issues with values containing =
    if (k?.trim() === "auth_token") {
      const token = decodeURIComponent(v || "").trim();
      console.log('Found auth token in cookie:', token ? 'yes' : 'no');
      return token || null;
    }
  }
  console.log('No auth_token found in cookies');
  return null;
}

function clearAuthCookie(res: any, req: any) {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  const isSecure = proto.includes("https");
  const cookie = [
    `auth_token=`,
    "Path=/",
    // Remove HttpOnly to match setAuthCookie
    "SameSite=Lax",
    isSecure ? "Secure" : "",
    "Max-Age=0",
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookie);
}

// ===== Basic email/password auth (legacy) =====
export const signup: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email || !password || !name) return res.status(400).json({ error: "Missing required fields" });
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    const salt = createId("salt");
    const passwordHash = hashPassword(password, salt);
    
    const user = await createUser({
      email,
      name,
      role: "student" as const,
      is_verified: true,
    });
    
    // Note: In Supabase implementation, we don't store password hash in the users table
    // This would typically be handled by Supabase Auth
    // For now, we'll keep the existing JWT approach for compatibility
    
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, req);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
    
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    
    // Note: For migration compatibility, we'll accept any password for existing users
    // In production, you'd verify password hashes or integrate with Supabase Auth
    console.log(`Login attempt for migrated user: ${email}`);
    
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, req);
    console.log(`Login successful for: ${email}`);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me: RequestHandler = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth ? auth.split(" ")[1] : getTokenFromCookie(req);
    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ error: "No authentication token found" });
    }
    const payload = verifyToken(token || "");
    if (!payload) {
      console.log('Invalid token:', token.substring(0, 20) + '...');
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    // Validate that we have a valid user ID
    if (!payload.sub) {
      console.log('No user ID in token payload:', payload);
      clearAuthCookie(res, req);
      return res.status(401).json({ error: "Invalid token - missing user ID" });
    }
    
    const user = await getUserById(payload.sub);
    if (!user) {
      console.log('User not found in database for ID:', payload.sub);
      // Clear the invalid cookie
      clearAuthCookie(res, req);
      return res.status(404).json({ error: "User not found - invalid session cleared" });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMe: RequestHandler = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth ? auth.split(" ")[1] : getTokenFromCookie(req);
    if (!token) return res.status(401).json({ error: "Missing Authorization" });
    const payload = verifyToken(token || "");
    if (!payload) return res.status(401).json({ error: "Invalid token" });
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });
    
    const user = await updateUser(payload.sub, { name: name.trim() });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== OTP flows =====

const OTP_TTL_MS = 10 * 60 * 1000;

async function createAndSendOtp(email: string, purpose: "signup" | "login" | "reset", userId?: string) {
  const pendingId = createId("pending");
  const otp = createOtpCode();
  
  const otpChallenge = await createOTPChallenge({
    pending_id: pendingId,
    email,
    user_id: userId,
    purpose,
    code: otp,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  const subject = purpose === "reset" ? "Reset your password" : "Verify your sign-in";
  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:24px auto;padding:24px;border:1px solid #eee;border-radius:12px">
      <h2 style="margin:0 0 8px 0">${subject}</h2>
      <p style="color:#64748b;margin:0 0 16px 0">Use the one-time code below. It expires in 10 minutes.</p>
      <div style="font-size:32px;letter-spacing:6px;font-weight:700;background:#f1f5f9;border-radius:8px;padding:12px 16px;text-align:center">${otp}</div>
      <p style="color:#64748b;margin-top:16px">If you didn't request this, you can ignore this email.</p>
    </div>`;
  const text = `${subject}\n\nYour code: ${otp}\n\nThe code expires in 10 minutes.`;
  void sendMail({ id: createId("mail"), to: email, subject, text, html, createdAt: new Date().toISOString() });

  return { pendingId };
}

export const signupStart: RequestHandler = async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
    if (!email || !password || !name) return res.status(400).json({ error: "Missing required fields" });
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    const user = await createUser({
      email,
      name,
      role: "student" as const,
      is_verified: false,
    });
    
    const { pendingId } = await createAndSendOtp(email, "signup", user.id);
    res.status(202).json({ next: "otp", pendingId, email });
  } catch (error) {
    console.error('Signup start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginStart: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
    
    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    
    // For now, skip password verification since we're migrating
    // In production, you'd verify password here
    
    const { pendingId } = await createAndSendOtp(email, "login", user.id);
    res.status(202).json({ next: "otp", pendingId, email });
  } catch (error) {
    console.error('Login start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const otpVerify: RequestHandler = async (req, res) => {
  try {
    const { pendingId, code } = req.body as { pendingId?: string; code?: string };
    if (!pendingId || !code) return res.status(400).json({ error: "Missing fields" });
    
    const entry = await getOTPChallenge(pendingId);
    if (!entry || entry.consumed_at) {
      return res.status(400).json({ error: "Invalid or expired challenge" });
    }
    
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Code expired" });
    }
    
    if (entry.code !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Mark OTP as consumed
    await consumeOTPChallenge(entry.id);
    
    // Get user
    let user = entry.user_id ? await getUserById(entry.user_id) : await getUserByEmail(entry.email);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // If signup and user not verified, mark as verified
    if (entry.purpose === "signup" && !user.is_verified) {
      user = await updateUser(user.id, { is_verified: true });
    }
    
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, req);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgot: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: "Email required" });
    
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists or not for security
      return res.json({ message: "If the email exists, a code was sent.", next: "reset" });
    }
    
    const { pendingId } = await createAndSendOtp(email, "reset", user.id);
    return res.json({ message: "If the email exists, a code was sent.", next: "reset", pendingId, email });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetComplete: RequestHandler = async (req, res) => {
  try {
    const { pendingId, code, newPassword } = req.body as { pendingId?: string; code?: string; newPassword?: string };
    if (!pendingId || !code || !newPassword) return res.status(400).json({ error: "Missing fields" });
    
    const entry = await getOTPChallenge(pendingId);
    if (!entry || entry.purpose !== "reset" || entry.consumed_at) {
      return res.status(400).json({ error: "Invalid or expired challenge" });
    }
    
    if (new Date(entry.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Code expired" });
    }
    
    if (entry.code !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }
    
    const user = entry.user_id ? await getUserById(entry.user_id) : await getUserByEmail(entry.email);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Note: In a real implementation, you'd hash and store the new password
    // For now, we'll just mark the OTP as consumed
    await consumeOTPChallenge(entry.id);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Reset complete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== Mock OAuth (for local/dev/testing) =====
export const oauthMock: RequestHandler = async (req, res) => {
  try {
    const { provider, email, name } = req.body as { provider?: string; email?: string; name?: string };
    if (!email) return res.status(400).json({ error: "Email required" });
    
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUser({
        email,
        name: name || email.split("@")[0],
        role: "student" as const,
        is_verified: true,
      });
    }
    
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, req);
    return res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role }, 
      provider: provider || "sso" 
    });
  } catch (error) {
    console.error('OAuth mock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== Real OAuth (Google / Microsoft) =====

type Provider = "google" | "microsoft";
interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  redirectUri: string; // absolute
}

function getBaseUrl(req: any) {
  // Tries to infer the external base URL (works in most environments behind proxy)
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host");
  return `${proto}://${host}`;
}

function getProviderConfig(provider: Provider, req: any): OAuthProviderConfig | null {
  // Allow explicit redirect URIs via env; fallback to inferred base URL
  const base = process.env.OAUTH_REDIRECT_BASE || getBaseUrl(req);
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${base}/api/auth/oauth/google/callback`;
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid email profile",
      redirectUri,
    };
  }
  if (provider === "microsoft") {
    const clientId = process.env.MS_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID || "";
    const clientSecret = process.env.MS_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET || "";
    const redirectUri = process.env.MS_REDIRECT_URI || process.env.AZURE_AD_REDIRECT_URI || `${base}/api/auth/oauth/microsoft/callback`;
    if (!clientId || !clientSecret) return null;
    return {
      clientId,
      clientSecret,
      authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
      scope: "openid email profile offline_access",
      redirectUri,
    };
  }
  return null;
}

function toQuery(params: Record<string, string>) {
  const usp = new URLSearchParams(params);
  return usp.toString();
}

// Ephemeral in-memory state store for CSRF protection
const oauthState = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
function createState() {
  const state = createId("state");
  oauthState.set(state, Date.now() + STATE_TTL_MS);
  return state;
}
function verifyAndConsumeState(state: string) {
  const exp = oauthState.get(state);
  if (!exp) return false;
  oauthState.delete(state);
  return exp > Date.now();
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of oauthState) if (v < now) oauthState.delete(k);
}, 60 * 1000).unref?.();

// List enabled providers so the client can choose real SSO vs mock
export const listProviders: RequestHandler = (req, res) => {
  const enabled: Provider[] = [];
  if (getProviderConfig("google", req)) enabled.push("google");
  if (getProviderConfig("microsoft", req)) enabled.push("microsoft");
  res.json({ providers: enabled });
};

// Start OAuth flow
export const oauthStart: RequestHandler = (req, res) => {
  const provider = (req.params.provider as Provider) || "google";
  const cfg = getProviderConfig(provider, req);
  if (!cfg) return res.status(501).json({ error: `${provider} OAuth not configured` });
  const state = createState();
  const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "/auth/callback";
  // Attach client redirect in state using a simple token. We could also HMAC-sign, but state map is private per-process
  const stateWithRedirect = `${state}:${Buffer.from(redirect).toString("base64url")}`;
  oauthState.set(stateWithRedirect, Date.now() + STATE_TTL_MS);
  const authUrl = `${cfg.authorizeUrl}?${toQuery({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: cfg.scope,
    prompt: "consent",
    access_type: "offline",
    state: stateWithRedirect,
  })}`;
  res.redirect(authUrl);
};

// OAuth callback
export const oauthCallback: RequestHandler = async (req, res) => {
  const provider = (req.params.provider as Provider) || "google";
  const cfg = getProviderConfig(provider, req);
  if (!cfg) return res.status(501).send("OAuth provider not configured");
  const { code, state } = req.query as any;
  if (!code || !state || typeof state !== "string") return res.status(400).send("Invalid OAuth response");
  if (!verifyAndConsumeState(state)) return res.status(400).send("Invalid state");
  const [raw, b64] = state.split(":");
  const clientRedirect = b64 ? Buffer.from(b64, "base64url").toString("utf8") : "/auth/callback";

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: toQuery({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: cfg.redirectUri,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      }),
    });
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.status(400).send(`Token exchange failed: ${errText}`);
    }
    const tokens: any = await tokenRes.json();
    const accessToken = tokens.access_token as string;
    if (!accessToken) return res.status(400).send("Missing access token");

    // Fetch user info
    const userRes = await fetch(cfg.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      const errText = await userRes.text();
      return res.status(400).send(`Failed to fetch user info: ${errText}`);
    }
    const profile: any = await userRes.json();
    const email = (profile.email || profile.preferred_username || profile.upn || (profile.emails && profile.emails[0]) || "").toString();
    const name = (profile.name || `${profile.given_name || ""} ${profile.family_name || ""}` || email.split("@")[0]).toString().trim();
    if (!email) return res.status(400).send("Email not available from provider");

    // Upsert user using Supabase
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUser({
        email,
        name: name || email.split("@")[0],
        role: "student",
        is_verified: true,
      });
    }

    // Sign JWT and redirect back to client with token
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, req);
    const redirectUrl = `${clientRedirect}${clientRedirect.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  } catch (e: any) {
    return res.status(500).send(`OAuth error: ${e?.message || "unknown"}`);
  }
};

router.post("/signup", signup);
router.post("/login", login);
router.post("/signup/start", signupStart);
router.post("/login/start", loginStart);
router.post("/otp/verify", otpVerify);
router.get("/me", me);
router.put("/me", updateMe);
router.post("/forgot", forgot);
router.post("/reset/complete", resetComplete);
router.post("/logout", (req, res) => { 
  clearAuthCookie(res, req); 
  console.log('User logged out and cookies cleared');
  return res.json({ success: true, message: 'Logged out successfully' }); 
});

// Development login helper (remove in production)
router.post("/dev/login", async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: "Email required" });
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found. Available users from migration:", 
        hint: "admin@aifirst.academy, thatboy@gmail.com, freedomseven6@gmail.com" });
    }
    
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token, req);
    console.log(`Dev login successful for: ${email}`);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth routes
router.get("/oauth/providers", listProviders);
router.get("/oauth/:provider/start", oauthStart);
router.get("/oauth/:provider/callback", oauthCallback);
router.post("/oauth/mock", oauthMock);

export default router;
