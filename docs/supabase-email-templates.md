# Supabase Email Templates

Go to **Supabase Dashboard → Authentication → Email Templates** and replace the defaults with these branded templates.

---

## 1. Confirm Signup

**Subject:** `Confirm your RFP Shredder account`

**Body (HTML):**

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
        <tr>
          <td style="background-color:#1B365D;padding:24px 32px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">RFP Shredder</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#1B365D;margin:0 0 16px;font-size:20px;">Welcome! Confirm your email</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
              Thanks for signing up for RFP Shredder — the fastest way to turn federal RFPs into formatted compliance matrices.
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Click the button below to confirm your email address and activate your free trial. You'll get one free shred to see the full extraction in action.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background-color:#10B981;border-radius:6px;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                    Confirm Email Address
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
              If you didn't create an account with RFP Shredder, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
              RFP Shredder — AI-powered compliance matrices for government contractors
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 2. Magic Link

**Subject:** `Your RFP Shredder sign-in link`

**Body (HTML):**

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
        <tr>
          <td style="background-color:#1B365D;padding:24px 32px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">RFP Shredder</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#1B365D;margin:0 0 16px;font-size:20px;">Sign in to RFP Shredder</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Click the button below to sign in. This link expires in 24 hours and can only be used once.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background-color:#10B981;border-radius:6px;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                    Sign In
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
              If you didn't request this link, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
              RFP Shredder — AI-powered compliance matrices for government contractors
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 3. Reset Password

**Subject:** `Reset your RFP Shredder password`

**Body (HTML):**

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
        <tr>
          <td style="background-color:#1B365D;padding:24px 32px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">RFP Shredder</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#1B365D;margin:0 0 16px;font-size:20px;">Reset your password</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
              We received a request to reset the password for your RFP Shredder account. Click the button below to choose a new password.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background-color:#10B981;border-radius:6px;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
              RFP Shredder — AI-powered compliance matrices for government contractors
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email for RFP Shredder`

**Body (HTML):**

```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
        <tr>
          <td style="background-color:#1B365D;padding:24px 32px;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">RFP Shredder</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="color:#1B365D;margin:0 0 16px;font-size:20px;">Confirm your new email</h2>
            <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Click the button below to confirm your new email address for your RFP Shredder account.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background-color:#10B981;border-radius:6px;">
                  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:12px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                    Confirm New Email
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
              If you didn't request this change, please secure your account immediately.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
              RFP Shredder — AI-powered compliance matrices for government contractors
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## Sender Name

In **Supabase Dashboard → Authentication → SMTP Settings**, if using custom SMTP (Resend), set:
- **Sender name**: `RFP Shredder`
- **Sender email**: `admin@automatemomentum.com` (or your configured Resend from address)

If using Supabase's built-in email, the sender will show "Supabase Auth" — this can only be changed by enabling custom SMTP. To use Resend as custom SMTP:
1. Go to Supabase Dashboard → Project Settings → Authentication → SMTP Settings
2. Enable "Custom SMTP"
3. Host: `smtp.resend.com`
4. Port: `465`
5. Username: `resend`
6. Password: your `RESEND_API_KEY` (e.g. `re_fxVNtaLP_...`)
7. Sender name: `RFP Shredder`
8. Sender email: `admin@automatemomentum.com`
