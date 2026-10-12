import type { Address } from '@/types';

// Shipping address checks used by checkout and the address book. They reject
// obviously fake input ("a / b / xx") without trying to verify real places.
// Keep in sync with backend/src/utils/address.js (the server enforces the same rules).

type AddressFields = Pick<Address, 'street' | 'city' | 'state' | 'zipCode' | 'country'>;
export type AddressErrors = Partial<Record<keyof AddressFields, string>>;

const LETTER = /\p{L}/u;
const PLACE_NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'(),-]*$/u;
const SHORT_COUNTRY_NAMES = ['US', 'USA', 'UK', 'UAE'];

const US_POSTAL = { pattern: /^\d{5}(-\d{4})?$/, hint: '5 digits, e.g. 10001' };
const POSTAL_FORMATS: Record<string, { pattern: RegExp; hint: string }> = {
  bangladesh: { pattern: /^\d{4}$/, hint: '4 digits, e.g. 1212' },
  india: { pattern: /^\d{6}$/, hint: '6 digits' },
  pakistan: { pattern: /^\d{5}$/, hint: '5 digits' },
  'united states': US_POSTAL,
  usa: US_POSTAL,
  us: US_POSTAL,
};
const GENERIC_POSTAL = /^(?=.*\d)[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;

export function validateAddress(address: AddressFields): AddressErrors {
  const errors: AddressErrors = {};
  const street = (address.street || '').trim();
  const city = (address.city || '').trim();
  const state = (address.state || '').trim();
  const zip = (address.zipCode || '').trim();
  const country = (address.country || '').trim();

  if (!street) errors.street = 'Street address is required';
  else if (street.length < 5 || !LETTER.test(street)) errors.street = 'Please enter a full street address (house, road, area)';
  else if (street.length > 200) errors.street = 'Street address is too long';

  if (!city) errors.city = 'City is required';
  else if (city.length < 2 || city.length > 100 || !PLACE_NAME.test(city)) errors.city = 'Please enter a valid city';

  if (!state) errors.state = 'State / division is required';
  else if (state.length < 2 || state.length > 100 || !PLACE_NAME.test(state)) errors.state = 'Please enter a valid state or division';

  if (!country) errors.country = 'Country is required';
  else if (!SHORT_COUNTRY_NAMES.includes(country.toUpperCase()) && (country.length < 4 || country.length > 60 || !PLACE_NAME.test(country))) {
    errors.country = 'Please enter a valid country';
  }

  const format = POSTAL_FORMATS[country.toLowerCase()];
  if (!zip) errors.zipCode = 'Postal code is required';
  else if (format && !format.pattern.test(zip)) errors.zipCode = `Postal code should be ${format.hint}`;
  else if (!format && !GENERIC_POSTAL.test(zip)) errors.zipCode = 'Please enter a valid postal code';

  return errors;
}
