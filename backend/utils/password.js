const crypto = require('crypto');

const KEY_LENGTH = 64;

/**
 * Hashes a password asynchronously using crypto.scrypt with a unique random salt.
 * Formats the output as "salt:hash" in hexadecimal.
 *
 * @param {string} password - The plaintext password to hash
 * @returns {Promise<string>} The combined salt:hash string
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a password asynchronously against a stored "salt:hash" string.
 * Uses crypto.timingSafeEqual to mitigate timing attacks.
 *
 * @param {string} password - The plaintext candidate password
 * @param {string} storedHash - The stored "salt:hash" string
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    if (!storedHash || !storedHash.includes(':')) {
      return resolve(false);
    }

    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return resolve(false);
    }

    const keyBuffer = Buffer.from(key, 'hex');
    crypto.scrypt(password, salt, keyBuffer.length, (err, derivedKey) => {
      if (err) return reject(err);
      try {
        const match = crypto.timingSafeEqual(keyBuffer, derivedKey);
        resolve(match);
      } catch {
        resolve(false);
      }
    });
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
};
