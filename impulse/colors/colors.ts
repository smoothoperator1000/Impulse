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
  const userGroupSymbol = Users.usergroups[toID(name)]
    ? `<b><font color=#948A88>${Users.usergroups[toID(name)].charAt(0)}</font></b>`
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
