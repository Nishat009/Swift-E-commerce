// Shipping address checks shared by orders, the address book and profile updates.
// They reject obviously fake input ("a / b / xx") without trying to verify real places.
// Keep in sync with lib/addressValidation.ts on the frontend.

const LETTER = /\p{L}/u;
const PLACE_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'(),-]*$/u;
const SHORT_COUNTRY_NAMES = ['US', 'USA', 'UK', 'UAE'];

// Countries whose postal code format we know; anything else gets the generic check
const POSTAL_FORMATS = {
  bangladesh: { pattern: /^\d{4}$/, hint: '4 digits, e.g. 1212' },
  india: { pattern: /^\d{6}$/, hint: '6 digits' },
  pakistan: { pattern: /^\d{5}$/, hint: '5 digits' },
  'united states': { pattern: /^\d{5}(-\d{4})?$/, hint: '5 digits, e.g. 10001' },
  usa: { pattern: /^\d{5}(-\d{4})?$/, hint: '5 digits, e.g. 10001' },
  us: { pattern: /^\d{5}(-\d{4})?$/, hint: '5 digits, e.g. 10001' },
};
const GENERIC_POSTAL = /^(?=.*\d)[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;

const FIELDS = ['street', 'city', 'state', 'zipCode', 'country'];

const checkField = (field, value, country) => {
  const v = String(value ?? '').trim();
  switch (field) {
    case 'street':
      if (!v) return 'Street address is required';
      if (v.length < 5 || !LETTER.test(v)) return 'Please enter a full street address (house, road, area)';
      if (v.length > 200) return 'Street address is too long';
      return null;
    case 'city':
      if (!v) return 'City is required';
      if (v.length < 2 || v.length > 100 || !PLACE_NAME.test(v)) return 'Please enter a valid city';
      return null;
    case 'state':
      if (!v) return 'State / division is required';
      if (v.length < 2 || v.length > 100 || !PLACE_NAME.test(v)) return 'Please enter a valid state or division';
      return null;
    case 'zipCode': {
      if (!v) return 'Postal code is required';
      const format = POSTAL_FORMATS[String(country || '').trim().toLowerCase()];
      if (format) return format.pattern.test(v) ? null : `Postal code should be ${format.hint}`;
      return GENERIC_POSTAL.test(v) ? null : 'Please enter a valid postal code';
    }
    case 'country':
      if (!v) return 'Country is required';
      if (SHORT_COUNTRY_NAMES.includes(v.toUpperCase())) return null;
      if (v.length < 4 || v.length > 60 || !PLACE_NAME.test(v)) return 'Please enter a valid country';
      return null;
    default:
      return null;
  }
};

// Returns { field: message } for every invalid field (empty object when valid)
const validateAddress = (address) => {
  const addr = address || {};
  const errors = {};
  FIELDS.forEach((field) => {
    const message = checkField(field, addr[field], addr.country);
    if (message) errors[field] = message;
  });
  return errors;
};

// Trimmed copy with only the address fields
const cleanAddress = (address) => {
  const out = {};
  FIELDS.forEach((field) => {
    if (address && address[field] !== undefined) out[field] = String(address[field]).trim();
  });
  return out;
};

module.exports = { validateAddress, cleanAddress };
