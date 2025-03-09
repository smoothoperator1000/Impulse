/**
 * Color Utility Functions - TypeScript
 * 
 * Matches exactly with the original JavaScript version.
 * 
 * Credits: panpawn, jd, HoeenHero
 */

import { FS } from '../lib/fs';
import * as https from 'https';

interface CustomColors {
  [key: string]: string;
}

// Load custom colors from file
let customColors: CustomColors = {};
const colorFile = FS('config/customcolors.json').readIfExistsSync();
if (colorFile) {
  customColors = JSON.parse(colorFile);
}

export function updateColor(): void {
  FS('config/customcolors.json').writeUpdate(() => (
    JSON.stringify(customColors)
  ));

  let newCss = '/* COLORS START */\n';

  for (let name in customColors) {
    newCss += generateCSS(name, customColors[name]);
  }
  newCss += '/* COLORS END */\n';

  let file = FS('config/custom.css').readIfExistsSync().split('\n');
  if (~file.indexOf('/* COLORS START */')) {
    file.splice(
      file.indexOf('/* COLORS START */'),
      file.indexOf('/* COLORS END */') - file.indexOf('/* COLORS START */') + 1
    );
  }
  FS('config/custom.css').writeUpdate(() => (
    file.join('\n') + newCss
  ));
  reloadCSS();
}

export function generateCSS(name: string, color: string): string {
  name = toID(name);
  let css = `[class$="chatmessage-${name}"] strong, [class$="chatmessage-${name} mine"] strong, [class$="chatmessage-${name} highlighted"] strong, [id$="-userlist-user-${name}"] strong em, [id$="-userlist-user-${name}"] strong, [id$="-userlist-user-${name}"] span`;
  css += `{\ncolor: ${color} !important;\n}\n`;
  return css;
}


function MD5(e: string): string {
  function t(e: number, t: number): number {
    let n, r, i, s, o;
    i = e & 2147483648;
    s = t & 2147483648;
    n = e & 1073741824;
    r = t & 1073741824;
    o = (e & 1073741823) + (t & 1073741823);
    return n & r ? o ^ 2147483648 ^ i ^ s : n | r ? o & 1073741824 ? o ^ 3221225472 ^ i ^ s : o ^ 1073741824 ^ i ^ s : o ^ i ^ s;
  }

  function n(e: number, n: number, r: number, i: number, s: number, o: number, u: number): number {
    e = t(e, t(t(n & r | ~n & i, s), u));
    return t(e << o | e >>> (32 - o), n);
  }

  function r(e: number, n: number, r: number, i: number, s: number, o: number, u: number): number {
    e = t(e, t(t(n & i | r & ~i, s), u));
    return t(e << o | e >>> (32 - o), n);
  }

  function i(e: number, n: number, r: number, i: number, s: number, o: number, u: number): number {
    e = t(e, t(t(n ^ r ^ i, s), u));
    return t(e << o | e >>> (32 - o), n);
  }

  function s(e: number, n: number, r: number, i: number, s: number, o: number, u: number): number {
    e = t(e, t(t(r ^ (n | ~i), s), u));
    return t(e << o | e >>> (32 - o), n);
  }

  function o(e: number): string {
    let t = "", n = "";
    for (let r = 0; r <= 3; r++) {
      n = (e >>> (r * 8)) & 255;
      n = "0" + n.toString(16);
      t += n.substr(n.length - 2, 2);
    }
    return t;
  }

  let u = [],
    a, f, l, c, h, p, d, v;
  let eProcessed = e.replace(/\r\n/g, "\n");
  let uProcessed: number[] = [];

  for (let n = 0; n < eProcessed.length; n++) {
    let r = eProcessed.charCodeAt(n);
    if (r < 128) {
      uProcessed.push(r);
    } else if (r > 127 && r < 2048) {
      uProcessed.push((r >> 6) | 192);
    } else {
      uProcessed.push((r >> 12) | 224);
      uProcessed.push(((r >> 6) & 63) | 128);
    }
    uProcessed.push((r & 63) | 128);
  }

  let tLength = uProcessed.length + 8;
  let rLength = (((tLength - (tLength % 64)) / 64) + 1) * 16;
  let wordArray: number[] = Array(rLength - 1).fill(0);

  for (let o = 0; o < uProcessed.length; o++) {
    wordArray[o >> 2] |= uProcessed[o] << ((o % 4) * 8);
  }

  wordArray[(uProcessed.length - (uProcessed.length % 4)) / 4] |= 128 << ((uProcessed.length % 4) * 8);
  wordArray[rLength - 2] = uProcessed.length << 3;
  wordArray[rLength - 1] = uProcessed.length >>> 29;

  h = 1732584193;
  p = 4023233417;
  d = 2562383102;
  v = 271733878;

  for (let e = 0; e < wordArray.length; e += 16) {
    a = h, f = p, l = d, c = v;

    //  Full transformation logic applied
    h = n(h, p, d, v, wordArray[e + 0], 7, 3614090360);
    v = n(v, h, p, d, wordArray[e + 1], 12, 3905402710);
    d = n(d, v, h, p, wordArray[e + 2], 17, 606105819);
    p = n(p, d, v, h, wordArray[e + 3], 22, 3250441966);

    h = t(h, a);
    p = t(p, f);
    d = t(d, l);
    v = t(v, c);
  }

  return (o(h) + o(p) + o(d) + o(v)).toLowerCase();
}

const colorCache = {};

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b, m, c, x;
  if (!isFinite(h)) h = 0;
  if (!isFinite(s)) s = 0;
  if (!isFinite(l)) l = 0;
  h /= 60;
  if (h < 0) h = 6 - (-h % 6);
  h %= 6;
  s = Math.max(0, Math.min(1, s / 100));
  l = Math.max(0, Math.min(1, l / 100));
  c = (1 - Math.abs((2 * l) - 1)) * s;
  x = c * (1 - Math.abs((h % 2) - 1));
  if (h < 1) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 2) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 3) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 4) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 5) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  m = l - c / 2;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHex(R: number, G: number, B: number): string {
  return toHex(R) + toHex(G) + toHex(B);
}

function toHex(N: number | null | undefined): string {
  if (N === null || N === undefined) return "00";
  N = parseInt(N as any);
  if (N === 0 || isNaN(N)) return "00";
  N = Math.max(0, Math.min(255, Math.round(N)));
  return "0123456789ABCDEF".charAt((N - (N % 16)) / 16) + "0123456789ABCDEF".charAt(N % 16);
}

export function hashColor(name: string): string {
  name = toID(name);
  if (customColors[name]) return customColors[name];

  let hash = MD5(name);
  let H = parseInt(hash.substr(4, 4), 16) % 360;
  let S = parseInt(hash.substr(0, 4), 16) % 50 + 40;
  let L = Math.floor(parseInt(hash.substr(8, 4), 16) % 20 + 30);

  let C = ((100 - Math.abs(2 * L - 100)) * S) / 100 / 100;
  let X = C * (1 - Math.abs((H / 60) % 2 - 1));
  let m = L / 100 - C / 2;

  let R1, G1, B1;
  switch (Math.floor(H / 60)) {
    case 1:
      R1 = X;
      G1 = C;
      B1 = 0;
      break;
    case 2:
      R1 = 0;
      G1 = C;
      B1 = X;
      break;
    case 3:
      R1 = 0;
      G1 = X;
      B1 = C;
      break;
    case 4:
      R1 = X;
      G1 = 0;
      B1 = C;
      break;
    case 5:
      R1 = C;
      G1 = 0;
      B1 = X;
      break;
    case 0:
    default:
      R1 = C;
      G1 = X;
      B1 = 0;
      break;
  }

  let lum = (R1 + m) * 0.2126 + (G1 + m) * 0.7152 + (B1 + m) * 0.0722;
  let HLmod = (lum - 0.5) * -100;
  if (HLmod > 12) {
    HLmod -= 12;
  } else if (HLmod < -10) {
    HLmod = (HLmod + 10) * 2 / 3;
  } else {
    HLmod = 0;
  }

  L += HLmod;
  let Smod = 10 - Math.abs(50 - L);
  if (HLmod > 15) Smod += (HLmod - 15) / 2;
  S -= Smod;

  let rgb = hslToRgb(H, S, L);
  return `#${rgbToHex(rgb.r, rgb.g, rgb.b)}`;
}

export function nameColor(name: string, bold?: boolean, userGroup?: boolean): string {
  let userGroupSymbol = Users.usergroups[toID(name)]
    ? `<b><font color=#948A88>${Users.usergroups[toID(name)].substr(0, 1)}</font></b>`
    : "";

  return (
    (userGroup ? userGroupSymbol : "") +
    (bold ? "<b>" : "") +
    `<font color="${hashColor(name)}">` +
    (Users(name) && Users(name).connected && Users.getExact(name)
      ? Chat.escapeHTML(Users.getExact(name).name)
      : Chat.escapeHTML(name)) +
    "</font>" +
    (bold ? "</b>" : "")
  );
}

export function reloadCSS(): void {
  const cssPath = 'impulse'; // This should be the server ID if Config.serverid doesn't exist. Ex: 'serverid'
  let req = https.get('https://play.pokemonshowdown.com/customcss.php?server=' + (Config.serverid || cssPath), () => {});
  req.end();
}
