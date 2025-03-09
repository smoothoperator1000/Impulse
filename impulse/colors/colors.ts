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

// Custom MD5 hashing function (Refactored)
function MD5(input: string): string {
  function addUnsigned(a: number, b: number): number {
    const lX8 = (a & 0x80000000);
    const lY8 = (b & 0x80000000);
    const lX4 = (a & 0x40000000);
    const lY4 = (b & 0x40000000);
    let result = (a & 0x3FFFFFFF) + (b & 0x3FFFFFFF);
    
    if (lX4 & lY4) return (result ^ 0x80000000 ^ lX8 ^ lY8);
    if (lX4 | lY4) return (result & 0x40000000) ? (result ^ 0xC0000000 ^ lX8 ^ lY8) : (result ^ 0x40000000 ^ lX8 ^ lY8);
    
    return result ^ lX8 ^ lY8;
  }

  function rotateLeft(value: number, shiftBits: number): number {
    return (value << shiftBits) | (value >>> (32 - shiftBits));
  }

  function toHex(value: number): string {
    let hexString = "";
    for (let i = 0; i < 4; i++) {
      let byte = (value >>> (i * 8)) & 255;
      hexString += ("0" + byte.toString(16)).slice(-2);
    }
    return hexString;
  }

  function convertToWordArray(input: string): number[] {
    const messageLength = input.length;
    const numberOfWords = (((messageLength + 8) >>> 6) + 1) * 16;
    const wordArray: number[] = new Array(numberOfWords - 1).fill(0);

    for (let i = 0; i < messageLength; i++) {
      wordArray[i >> 2] |= input.charCodeAt(i) << ((i % 4) * 8);
    }

    wordArray[messageLength >> 2] |= 0x80 << ((messageLength % 4) * 8);
    wordArray[numberOfWords - 2] = messageLength << 3;
    wordArray[numberOfWords - 1] = messageLength >>> 29;
    
    return wordArray;
  }

  function transform(a: number, b: number, c: number, d: number, x: number[], s: number[], ac: number[]): void {
    function F(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
    function G(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
    function H(x: number, y: number, z: number): number { return x ^ y ^ z; }
    function I(x: number, y: number, z: number): number { return y ^ (x | ~z); }

    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, ac)), s), b);
    }

    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, G(b, c, d)), addUnsigned(x, ac)), s), b);
    }

    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, H(b, c, d)), addUnsigned(x, ac)), s), b);
    }

    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
      return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, I(b, c, d)), addUnsigned(x, ac)), s), b);
    }

    let a1 = a, b1 = b, c1 = c, d1 = d;
    
    // Main MD5 transformation loops (64 operations)
    for (let i = 0; i < 64; i++) {
      let temp: number;
      if (i < 16) {
        temp = FF(a1, b1, c1, d1, x[i], s[i % 4], ac[i]);
      } else if (i < 32) {
        temp = GG(a1, b1, c1, d1, x[(5 * i + 1) % 16], s[i % 4], ac[i]);
      } else if (i < 48) {
        temp = HH(a1, b1, c1, d1, x[(3 * i + 5) % 16], s[i % 4], ac[i]);
      } else {
        temp = II(a1, b1, c1, d1, x[(7 * i) % 16], s[i % 4], ac[i]);
      }
      d1 = c1;
      c1 = b1;
      b1 = temp;
      a1 = d1;
    }

    a = addUnsigned(a, a1);
    b = addUnsigned(b, b1);
    c = addUnsigned(c, c1);
    d = addUnsigned(d, d1);
  }

  const x = convertToWordArray(input);
  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;

  transform(a, b, c, d, x, [7, 12, 17, 22], [
    3614090360, 3905402710, 606105819, 3250441966, 4118548399, 1200080426, 2821735955, 4249261313,
    1770035416, 2336552879, 4294925233, 2304563134, 1804603682, 4254626195, 2792965006, 1236535329,
  ]);

  return (toHex(a) + toHex(b) + toHex(c) + toHex(d)).toLowerCase();
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
