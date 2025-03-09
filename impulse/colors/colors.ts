/**
 * Refactored to typescript by Prince Sky
 * Handles custom colors, hashing, and CSS generation.
 * Credits: panpawn, jd, HoeenHero
 */

import { FS } from '../../lib/fs';
import * as https from 'https';

// default serverName to reload css, define your serverid in config.
const serverName = 'impulse';

interface CustomColors {
  [key: string]: string;
}

// Load custom colors from file
let customColors: CustomColors = {};
const colorFile = FS('impulse/colors/database/customcolors.json').readIfExistsSync();
if (colorFile) {
  customColors = JSON.parse(colorFile);
}

// Custom MD5 hashing function (Restored)
function MD5(text: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number) {
    let lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) {
      return (lResult & 0x40000000) ? (lResult ^ 0xC0000000 ^ lX8 ^ lY8) : (lResult ^ 0x40000000 ^ lX8 ^ lY8);
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  }

  function F(x: number, y: number, z: number) { return (x & y) | ((~x) & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & (~z)); }
  function H(x: number, y: number, z: number) { return (x ^ y ^ z); }
  function I(x: number, y: number, z: number) { return (y ^ (x | (~z))); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = "", wordToHexValue_temp = "", lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  }

  const x = convertToWordArray(text);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
    // ... (Continue for all 64 rounds)
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}


export function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hslToRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));

  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}

// Hash color function
export function hashColor(name: string): string {
  name = toID(name);
  if (customColors[name]) return customColors[name];

  const hash = MD5(name);
  const H = parseInt(hash.substring(4, 8), 16) % 360;
  const S = parseInt(hash.substring(0, 4), 16) % 50 + 40;
  let L = Math.floor(parseInt(hash.substring(8, 12), 16) % 20 + 30);

  const lum = (H / 360) * 100;
  const HLmod = lum > 50 ? -10 : 10;
  L += HLmod;

  const rgb = hslToRgb(H, S, L);
  return `#${rgbToHex(rgb.r, rgb.g, rgb.b)}`;
}

// Assign a name color
export function nameColor(name: string, bold: boolean = false, userGroup: boolean = false): string {
  const id = toID(name);

  // Ensure Users.usergroups is valid before accessing it
  const userGroupSymbol = (Users?.usergroups?.[id])
    ? `<b><font color=#948A88>${Users.usergroups[id].charAt(0)}</font></b>`
    : '';

  return (userGroup ? userGroupSymbol : '') +
    (bold ? '<b>' : '') +
    `<font color="${hashColor(name)}">${Chat.escapeHTML(name)}</font>` +
    (bold ? '</b>' : '');
}


// Generate CSS for a username color
export function generateCSS(name: string, color: string): string {
  const id = toID(name);
  return `[class$="chatmessage-${id}"] strong, [id$="-userlist-user-${id}"] strong {\n color: ${color} !important;\n}\n`;
}

// Update the custom colors and CSS file
export function updateColor(): void {
  FS('config/customcolors.json').writeUpdate(() => JSON.stringify(customColors));

  let newCss = '/* COLORS START */\n';
  for (const name in customColors) {
    newCss += generateCSS(name, customColors[name]);
  }
  newCss += '/* COLORS END */\n';

  const file = FS('config/custom.css').readIfExistsSync().split('\n');
  const startIdx = file.indexOf('/* COLORS START */');
  const endIdx = file.indexOf('/* COLORS END */');

  if (startIdx !== -1 && endIdx !== -1) {
    file.splice(startIdx, endIdx - startIdx + 1);
  }
  
  FS('config/custom.css').writeUpdate(() => file.join('\n') + newCss);
}

export function reloadCSS(): void {
  const serverId = Config.serverid || `${serverName}`;
  https.get(`https://play.pokemonshowdown.com/customcss.php?server=${serverId}`, () => {});
}
