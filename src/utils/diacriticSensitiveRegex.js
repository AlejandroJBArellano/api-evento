/**
 * Handling special characters (accents marks, umlaut, grave accent) for vowels into a string
 * 
 * @param {string} string 
 * @returns {string} a string that contains an array of special characters in the place of the letters that contains that. Example "j[o,ó,ö,ò]')s[e,é,ë,è]" instead of "jose"
 */

const diacriticSensitiveRegex = (string = "") => string.replace(/a/g, '[a,á,à,ä,â]')
    .replace(/e/g, '[e,é,ë,è]')
    .replace(/i/g, '[i,í,ï,ì]')
    .replace(/o/g, '[o,ó,ö,ò]')
    .replace(/u/g, '[u,ü,ú,ù]');

module.exports = diacriticSensitiveRegex