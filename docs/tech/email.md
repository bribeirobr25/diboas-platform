# Email & Domain Mail Configuration — `diboas.com`

> **Status:** Resolved / operational.
> **Last updated:** 2026-05-27.
> **Scope:** DNS-level mail configuration for the `diboas.com` domain — inbound mailbox delivery, outbound sender authentication, and the relationship between the corporate mailbox and the Adelaide newsletter sending infrastructure.
> **Security note:** This document deliberately contains **no secrets** — no DKIM key material, no full verification tokens, no account credentials, no API keys. It describes architecture, platforms, and record *types* only. Exact record values live in the DNS provider's dashboard, not here.

---

## 1. Summary

The corporate mailbox `hello@diboas.com` was not receiving email from external senders. Internal test mail (sending from the account to itself) worked, but mail from outside (e.g. Gmail) never arrived.

**Root cause:** the domain `diboas.com` had **no MX record** for the root domain. The Microsoft 365 mailbox had been provisioned, but the DNS records that route inbound mail to it were never added. External senders performing an MX lookup found no destination, so delivery failed. Internal mail worked only because it never leaves the mail provider's network and does not require an MX lookup.

**Resolution:** the required Microsoft 365 mail records (MX, Autodiscover, domain-verification TXT) were added to the domain's DNS, and the existing SPF record was merged so it authorizes both mail-sending systems. External delivery was confirmed working by a live test from an external account.

---

## 2. Platforms & tools involved

| Platform / tool | Role in the email setup |
|---|---|
| **Microsoft 365 (Exchange Online)** | Hosts the corporate mailbox `hello@diboas.com` and its aliases. Mail is accessed via the Outlook web client. The mailbox license was **resold through GoDaddy**, so Microsoft 365 admin flows are partially mediated by GoDaddy's productivity dashboard. |
| **GoDaddy** | Reseller of the Microsoft 365 mailbox license. Provides the mailbox/alias management UI and a guided DNS setup wizard. **Does not host the domain's DNS** — its setup wizard emits a generic template that had to be adapted (see §6). |
| **Cloudflare** | Authoritative **DNS provider** for `diboas.com`. All DNS records (mail, web, newsletter) are managed here. This is where the fix was applied. |
| **Vercel** | Hosts the `diboas.com` website. Referenced by CNAME records — unrelated to mail, left untouched. |
| **Amazon SES** | Outbound email infrastructure for the **Adelaide newsletter**, operating on the `adelaide.diboas.com` subdomain. Separate from the corporate mailbox; left untouched. |
| **MxToolbox** | Third-party diagnostic tool used to verify MX/SPF/DMARC propagation and overall domain mail health. |

---

## 3. Mail architecture

`diboas.com` has **two independent mail systems**, deliberately separated:

1. **Corporate mailbox — Microsoft 365.**
   - `hello@diboas.com` plus aliases, all delivering into the single `hello@` inbox.
   - Inbound mail routes via the root-domain **MX record** to Microsoft's mail-protection endpoint.
   - This is the system that was broken and is now fixed.

2. **Adelaide newsletter — Amazon SES.**
   - Operates on the **`adelaide.diboas.com`** subdomain (and `send.adelaide.diboas.com`).
   - Has its own MX, DKIM, SPF, and DMARC records scoped to that subdomain.
   - Outbound (newsletter sending) only. Functioned correctly throughout and was not modified.

**Why the separation matters:** the two systems share one parent domain, so the **root-domain SPF record must authorize both**. Any future change to mail authentication must account for both senders or it will damage one of them.

---

## 4. DNS records — types and purpose

The following record *types* are configured in Cloudflare for `diboas.com`. **Values are intentionally omitted** — they are visible in the Cloudflare dashboard. All mail-related records must be set to **"DNS only"** (not proxied) in Cloudflare; proxying breaks mail routing and autodiscovery.

### Corporate mailbox (Microsoft 365) — root domain

| Record type | Host | Purpose |
|---|---|---|
| MX | `diboas.com` (root) | Routes inbound mail to Microsoft 365. Priority 0. **This was the missing record that caused the outage.** |
| CNAME | `autodiscover` | Lets mail clients (phone, desktop Outlook) auto-configure account settings. |
| TXT | `diboas.com` (root) | Microsoft 365 domain-ownership verification token. |
| TXT (SPF) | `diboas.com` (root) | Sender authentication — see §5. |

### Website (Vercel) — unrelated to mail

| Record type | Host | Purpose |
|---|---|---|
| CNAME | `diboas.com`, `www` | Points the website to Vercel hosting. |

### Adelaide newsletter (Amazon SES) — `adelaide` subdomain

| Record type | Host | Purpose |
|---|---|---|
| MX | `send.adelaide.diboas.com` | Bounce/feedback routing for SES. |
| TXT (SPF) | `send.adelaide.diboas.com` | Authorizes SES as a sender for the subdomain. |
| TXT (DKIM) | `*._domainkey.adelaide.diboas.com` | Cryptographic signing for newsletter mail. |
| TXT (DMARC) | `_dmarc.adelaide.diboas.com` | DMARC policy for the newsletter subdomain. |

---

## 5. Sender authentication (SPF / DKIM / DMARC)

### SPF — merged for two senders

A domain may have **only one SPF record**. Because both Microsoft 365 and Amazon SES send mail associated with the domain, the root-domain SPF record was **merged** to authorize both — one record containing both the Microsoft and the Amazon SES `include` mechanisms, ending in a soft-fail qualifier.

> **Critical maintenance rule:** never add a second SPF record to the root domain, and never replace the merged record with a single-sender one. The GoDaddy setup wizard suggests a GoDaddy-specific SPF (`secureserver.net`) — this is **wrong for this domain** and must not be applied; it would break both senders. Microsoft 365 is the corporate mailbox host, not GoDaddy mail.

### DMARC — monitoring mode

A **DMARC record was added for the root domain** (`_dmarc.diboas.com`) in **monitoring mode** (`p=none`). Monitoring mode instructs receiving mail servers to take no punitive action but to send aggregate reports.

- Aggregate DMARC reports are delivered to a dedicated address (`dmarc@diboas.com`), configured as an alias into the `hello@` inbox.
- **Monitoring mode is intentional and correct for now.** It must remain at `p=none` until reports confirm that mail from *both* Microsoft 365 and Amazon SES passes SPF/DKIM alignment.
- Diagnostic tools will flag "DMARC policy not enforced" — this is an **expected, accepted state**, not a defect. Do not tighten the policy in response to a tool warning alone.

### DKIM

- Newsletter (SES) DKIM is configured on the `adelaide` subdomain.
- Microsoft 365 DKIM for the root domain can be enabled in the Microsoft 365 / Exchange admin center as a future hardening step; it is not required for mail to function.

---

## 6. Known integration quirks

- **GoDaddy wizard vs. Cloudflare DNS.** The mailbox was resold by GoDaddy, but DNS is hosted at Cloudflare. GoDaddy's setup wizard cannot detect or modify Cloudflare DNS and emits a **generic template** containing GoDaddy-specific records (`secureserver.net` SPF, an `email` CNAME). Those GoDaddy-specific records were **deliberately not applied** — only the genuine Microsoft 365 records (MX, Autodiscover, verification TXT) are correct for this setup.
- **Verification vs. delivery.** GoDaddy's "I'm done" verification check may not show a green status until it sees its own template exactly. Actual mail delivery depends on the **MX record**, not on GoDaddy's checkmark. The authoritative test is a real external email, not a dashboard status.
- **Cloudflare proxying.** Mail records (MX, Autodiscover) must be "DNS only." A proxied Autodiscover record was caught and corrected during setup.

---

## 7. Verification performed

- **MX lookup (MxToolbox):** root-domain MX record present and resolving to the Microsoft 365 mail endpoint. Status: OK.
- **Live delivery test:** an email sent from an external Gmail account was successfully received at `hello@diboas.com`. **This is the definitive confirmation** that the original problem is resolved.
- **Domain health scan (MxToolbox):** 124 checks passed. Remaining flagged items are non-blocking and explained in §8.

---

## 8. Known non-issues (expected warnings)

These appear in diagnostic scans but are **not defects** and require no action:

| Flag | Why it is expected |
|---|---|
| "DMARC quarantine/reject policy not enabled" (shown against dmarc / spf / mx) | The DMARC policy is intentionally at `p=none` (monitoring). This is the same finding reported multiple times. See §5 and §9. |
| "BIMI / brand logo not appearing" | BIMI is cosmetic and depends on an enforced DMARC policy. Out of scope until DMARC is tightened. |
| `http://diboas.com` returns 308 redirect | Normal, correct behavior — an HTTP→HTTPS permanent redirect, served by Vercel. |
| "SOA serial number format invalid" / "SOA expire value out of range" | Cloudflare manages the SOA record automatically using its own format. Cannot be changed and has no effect on mail or web. |

---

## 9. Future hardening (optional, not urgent)

1. **Review DMARC aggregate reports.** Reports arrive at `dmarc@diboas.com`. Confirm that both Microsoft 365 and Amazon SES mail passes SPF/DKIM alignment. Reports are XML — a DMARC report viewer makes them readable.
2. **Tighten the DMARC policy.** Only **after** reports confirm clean alignment for both senders, move the root-domain DMARC policy from `p=none` to `p=quarantine`. Tightening before confirmation risks sending legitimate mail (including the newsletter) to spam.
3. **Enable Microsoft 365 DKIM** for the root domain via the Exchange admin center.
4. **Review role-address routing.** Aliases `dpo@`, `legal@`, `privacy@` currently all funnel into one inbox. Given diBoaS's regulatory posture, consider whether these formal-contact addresses warrant dedicated handling or monitoring.

---

## 10. Maintenance rules (quick reference)

- ✅ All mail records in Cloudflare must be **"DNS only"** — never proxied.
- ✅ The root domain has exactly **one SPF record**, merged for Microsoft 365 **and** Amazon SES.
- ❌ Never apply GoDaddy's `secureserver.net` SPF or `email` CNAME to this domain.
- ❌ Never add a second SPF record to the root domain.
- ⚠️ Do not tighten the DMARC policy past `p=none` until aggregate reports confirm both senders align.
- ⚠️ Leave all `adelaide.diboas.com` records untouched — they are the newsletter system.
- ℹ️ The authoritative test of mail health is a **real external email**, not a provider dashboard status.
