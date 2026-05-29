'use strict';

/**
 * Member barcode value = base64(gym_id + ":" + member_id).
 * Returned as a string; the frontend renders the visual barcode.
 */
function encodeBarcode(gymId, memberId) {
  return Buffer.from(`${gymId}:${memberId}`, 'utf8').toString('base64');
}

/**
 * Decode a barcode value back to { gymId, memberId }. Throws if malformed.
 */
function decodeBarcode(value) {
  const decoded = Buffer.from(value, 'base64').toString('utf8');
  const idx = decoded.indexOf(':');
  if (idx === -1) throw new Error('Malformed barcode');
  return { gymId: decoded.slice(0, idx), memberId: decoded.slice(idx + 1) };
}

module.exports = { encodeBarcode, decodeBarcode };
