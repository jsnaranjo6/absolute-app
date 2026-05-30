'use strict';

/**
 * Build the QR payload for a machine. The QR encodes a deep link to the
 * machine's usage page; the frontend renders the actual QR image.
 *
 * Base URL precedence: per-gym override (gyms.feature_flags.base_app_url) →
 * BASE_APP_URL env → hardcoded default.
 *
 * @param {string} qrCodeId
 * @param {string} [baseUrl]
 * @returns {string} e.g. https://app.gymos.io/machine/<qr_code_id>
 */
function buildMachineQrValue(qrCodeId, baseUrl) {
  const base = (baseUrl || process.env.BASE_APP_URL || 'https://app.gymos.io').replace(/\/+$/, '');
  return `${base}/machine/${qrCodeId}`;
}

module.exports = { buildMachineQrValue };
