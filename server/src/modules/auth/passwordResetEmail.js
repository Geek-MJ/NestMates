// The password reset email is the only text produced by the backend (SDD 10), in both languages.

const CONTENT = {
  en: {
    subject: 'Reset your NestMates password',
    greeting: (name) => `Hello ${name},`,
    body: 'We received a request to reset the password of your NestMates account. Use the link below to choose a new password. The link is valid for 1 hour.',
    action: 'Choose a new password',
    ignore: "If you didn't ask to reset your password, you can ignore this email: your password won't change.",
  },
  fr: {
    subject: 'Réinitialisation de votre mot de passe NestMates',
    greeting: (name) => `Bonjour ${name},`,
    body: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte NestMates. Utilisez le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable 1 heure.',
    action: 'Choisir un nouveau mot de passe',
    ignore: "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail : votre mot de passe ne sera pas modifié.",
  },
};

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildPasswordResetEmail({ name, language, resetUrl }) {
  const content = CONTENT[language] ?? CONTENT.en;
  const greeting = content.greeting(name);

  const text = [greeting, '', content.body, '', resetUrl, '', content.ignore].join('\n');

  const html = `<!doctype html>
<html lang="${language === 'fr' ? 'fr' : 'en'}">
  <body style="margin:0;padding:32px 16px;background:#f7f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f1b17;">
    <div style="max-width:480px;margin:0 auto;padding:32px;background:#fffdfa;border:1px solid #e6e0d6;border-radius:16px;">
      <p style="margin:0 0 16px;font-size:16px;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.55;">${escapeHtml(content.body)}</p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#9e1f45;color:#ffffff;font-weight:600;text-decoration:none;">${escapeHtml(content.action)}</a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#6b6259;">${escapeHtml(content.ignore)}</p>
    </div>
  </body>
</html>`;

  return { subject: content.subject, text, html };
}
