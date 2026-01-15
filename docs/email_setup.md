# Email Configuration Guide (SPF, DKIM, DMARC)

To ensure that invitation emails and other system notifications from CrossFit Tracker (via Firebase Authentication or other services) are delivered reliably and not marked as spam, it is critical to configure your domain's DNS records correctly.

## 1. SPF (Sender Policy Framework)
SPF defines which mail servers are authorized to send email on behalf of your domain.

- **Action**: Add a TXT record to your DNS settings.
- **Value example**: `v=spf1 include:_spf.google.com ~all` (if using Google Workspace)
- **Firebase specific**: If using Firebase's default mailer, ensure you follow their custom domain authentication steps in the Firebase Console.

## 2. DKIM (DomainKeys Identified Mail)
DKIM adds a digital signature to your emails, allowing the receiving server to verify that the email was indeed sent by your domain and hasn't been tampered with.

- **Action**: Firebase Console -> Authentication -> Settings -> User segments -> Email templates -> "Customize Domain".
- **Steps**:
    1. Enter your sending domain.
    2. Firebase will provide two CNAME records.
    3. Add these CNAME records to your DNS provider.
    4. Wait for verification (can take up to 48 hours).

## 3. DMARC (Domain-based Message Authentication, Reporting, and Conformance)
DMARC ties SPF and DKIM together and tells the receiving server what to do if an email fails either check.

- **Action**: Add a TXT record for `_dmarc.yourdomain.com`.
- **Value example**: `v=DMARC1; p=quarantine; rua=mailto:admin@yourdomain.com`
- **Recommendation**: Start with `p=none` for monitoring, then move to `p=quarantine` or `p=reject`.

## Why this is important for CrossFit Tracker
- **Invitation Emails**: New members rely on these emails to join their BOX.
- **Password Resets**: Authentication depends on reliable email delivery.
- **Spam Prevention**: Without these records, emails are likely to land in the "Spam" or "Junk" folders.

> [!IMPORTANT]
> Always verify your DNS changes using tools like [MXToolbox](https://mxtoolbox.com/) or Google's [Admin Toolbox](https://toolbox.googleapps.com/apps/checkmx/).
