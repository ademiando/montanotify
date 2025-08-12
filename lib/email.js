import sgMail from '@sendgrid/mail';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';

if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
} else {
  console.warn('SENDGRID_API_KEY not set. Emails will fail.');
}

export async function sendEmail({ to, subject, html, text }) {
  if (!SENDGRID_KEY) throw new Error('SENDGRID_API_KEY not set');
  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    text: text || stripHtml(html),
    html
  };
  await sgMail.send(msg);
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

export function buildNewsletterHtml({ title, summary, bullets, articles = [], unsubscribeUrl }) {
  const articlesHtml = articles.map(a => `<li><a href="${a.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.title)}</a> — <small>${escapeHtml(a.source)}</small></li>`).join('');
  return `
    <div style="font-family:system-ui,Arial,Helvetica,sans-serif; line-height:1.4; color:#111;">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(summary)}</p>
      <h3>Key notes</h3>
      <ul>
        <li><strong>Impact:</strong> ${escapeHtml(bullets.impact || '')}</li>
        <li><strong>Opportunity:</strong> ${escapeHtml(bullets.opportunity || '')}</li>
        <li><strong>Risk:</strong> ${escapeHtml(bullets.risk || '')}</li>
      </ul>
      <h4>Sources</h4>
      <ul>${articlesHtml}</ul>
      <hr />
      <p style="font-size:12px; color:#666;">
        To unsubscribe, click <a href="${unsubscribeUrl}">here</a>.
      </p>
    </div>
  `;
}

function escapeHtml(str = '') {
  return (str + '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}