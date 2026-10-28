// The shared demo admin may look around the admin panel, but anyone can sign in as it, so it never
// receives real customer contact details. Every JSON answer to the demo admin (outside /api/auth,
// where it reads its own profile) has emails, phone numbers, street addresses, IPs and surnames
// masked. The check runs when the answer is sent, after the route's own `protect` set req.user.
const { isDemoAccount } = require('../controllers/demoAuthController');

const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_KEYS = new Set(['phone', 'phoneNumber', 'mobile', 'payerNumber', 'customerMsisdn', 'msisdn']);
const ADDRESS_KEYS = new Set(['street', 'address', 'addressLine1', 'addressLine2', 'line1', 'line2', 'zipCode', 'postalCode']);
const IP_KEYS = new Set(['ip', 'ipAddress']);
const PERSON_NAME_KEYS = new Set(['name', 'fullName', 'customerName']);

const maskEmail = (email, keep) => {
  if (keep.has(String(email).toLowerCase())) return email;
  const [local, domain = ''] = String(email).split('@');
  return `${local.charAt(0)}•••@${domain}`;
};
const maskPhone = (value) => {
  const digits = String(value).replace(/\D/g, '');
  return digits ? `•••${digits.slice(-2)}` : value;
};
// "Alice Smith" -> "Alice S."
const maskName = (value) => {
  const [first, ...rest] = String(value).trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1].charAt(0)}.` : first;
};

const redact = (value, keep, parentHasEmail = false) => {
  if (Array.isArray(value)) return value.map((item) => redact(item, keep));
  if (typeof value === 'string') return value.replace(EMAIL_IN_TEXT, (email) => maskEmail(email, keep));
  if (!value || typeof value !== 'object') return value;

  // A person: an object with an email (users, order customers, messages, subscribers)
  const isPerson = typeof value.email === 'string' || parentHasEmail;
  const out = {};
  for (const [key, field] of Object.entries(value)) {
    if (typeof field === 'string' && field) {
      if (PHONE_KEYS.has(key)) { out[key] = maskPhone(field); continue; }
      if (ADDRESS_KEYS.has(key)) { out[key] = '•••'; continue; }
      if (IP_KEYS.has(key)) { out[key] = '•••'; continue; }
      if (key === 'fullName' || (isPerson && PERSON_NAME_KEYS.has(key) && !keep.has(String(value.email || '').toLowerCase()))) {
        out[key] = maskName(field);
        continue;
      }
    }
    // Shipping and saved addresses belong to a person even without an email next to them
    out[key] = redact(field, keep, /address/i.test(key));
  }
  return out;
};

const maskForDemoAdmin = (req, res, next) => {
  if (req.originalUrl.startsWith('/api/auth')) return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    if (!req.user || req.user.role !== 'admin' || !isDemoAccount(req.user)) return json(body);
    const keep = new Set([String(req.user.email).toLowerCase()]);
    return json(redact(JSON.parse(JSON.stringify(body)), keep));
  };
  next();
};

module.exports = { maskForDemoAdmin, redact };
