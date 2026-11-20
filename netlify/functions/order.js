const PRICES = { ps5pro: 41999, ps5: 31999, xsx: 24999, xss: 13999, xox: 9999, ps4: 11499 };
const NAMES = {
  ps5pro: 'PlayStation 5 Pro', ps5: 'PlayStation 5', xsx: 'Xbox Series X',
  xss: 'Xbox Series S', xox: 'Xbox One X', ps4: 'PlayStation 4'
};
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴';
const clean = (s, n) => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  let d;
  try { d = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'Bad JSON' }; }

  const name = clean(d.name, 80), phone = clean(d.phone, 30), tg = clean(d.tg, 40);
  const items = Object.entries(d.cart || {}).filter(
    ([id, q]) => PRICES[id] && Number.isInteger(q) && q > 0 && q <= 10
  );
  if (!name || !phone || !tg || !items.length) return { statusCode: 400, body: 'Invalid order' };

  let total = 0;
  const lines = items.map(([id, q]) => {
    total += PRICES[id] * q;
    return '• ' + NAMES[id] + ' × ' + q + ' — ' + money(PRICES[id] * q);
  });
  const text = '🛒 Нове замовлення Playmix\n\n👤 ' + name + '\n📞 ' + phone + '\n✈️ ' + tg +
    '\n\n' + lines.join('\n') + '\n\nРазом: ' + money(total);

  const r = await fetch('https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.CHAT_ID, text })
  });
  if (!r.ok) return { statusCode: 502, body: 'Telegram error' };
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
