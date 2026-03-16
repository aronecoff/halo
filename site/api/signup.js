export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contact } = req.body || {};
  if (!contact) {
    return res.status(400).json({ error: 'Contact is required' });
  }

  const timestamp = new Date().toISOString();

  // Send SMS via Textbelt (free tier)
  try {
    await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '6509068321',
        message: `HALO Signup: ${contact} (${timestamp})`,
        key: 'textbelt',
      }),
    });
  } catch (err) {
    console.error('SMS failed:', err);
  }

  // Also send push notification via ntfy as backup
  try {
    await fetch('https://ntfy.sh/halo-waitlist-6509068321', {
      method: 'POST',
      headers: { 'Title': 'New HALO Signup', 'Priority': 'high', 'Tags': 'sparkles' },
      body: `New signup: ${contact}`,
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }

  // Log signup (viewable via `vercel logs`)
  console.log(`SIGNUP: ${contact} | ${timestamp}`);

  return res.status(200).json({ success: true, contact, timestamp });
}
