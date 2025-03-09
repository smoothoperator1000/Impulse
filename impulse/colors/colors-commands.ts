/**
 * Refactored to typescript by Prince Sky
 * Handles /customcolor commands.
 * Credits: panpawn, jd, HoeenHero
 */

import { updateColor, nameColor, hashColor } from '../../impulse/colors/colors';

export const commands: ChatCommands = {
  customcolor: {
    set(target, room, user) {
      this.checkCan('bypassall');
      const [username, color] = target.split(',').map(x => x.trim());
      if (!username || !color) return this.errorReply('Usage: /customcolor set [username], [hex]');
      if (toID(username).length > 19) return this.errorReply("Username too long.");

      this.sendReply(`|raw|You have given <b><font color="${color}">${Chat.escapeHTML(username)}</font></b> a custom color.`);
      this.modlog('CUSTOMCOLOR', username, `set to ${color}`);
      customColors[toID(username)] = color;
      updateColor();
    },
    
    delete(target, room, user) {
      this.checkCan('bypassall');
      if (!target) return this.errorReply('Usage: /customcolor delete [username]');
      if (!customColors[toID(target)]) return this.errorReply(`${target} does not have a custom color.`);

      delete customColors[toID(target)];
      updateColor();
      this.sendReply(`${target}'s custom color has been removed.`);
      this.modlog('CUSTOMCOLOR', target, 'removed');
    },
    
    preview(target, room, user) {
      this.checkBroadcast();
      const [username, color] = target.split(',').map(x => x.trim());
      if (!username || !color) return this.errorReply('Usage: /customcolor preview [username], [hex]');
      
      this.sendReplyBox(`<b><font size="3" color="${color}">${Chat.escapeHTML(username)}</font></b>`);
    },

    reload(target, room, user) {
      this.checkCan('bypassall');
      updateColor();
      this.modlog('CUSTOMCOLOR', null, 'reloaded colors');
      this.privateModAction(`${user.name} has reloaded custom colors.`);
    },
  },

  hex(target, room, user) {
    this.checkBroadcast();
    const targetUser = target || user.name;
    this.sendReplyBox(`The hex code of ${nameColor(targetUser, true)} is: <font color="${hashColor(targetUser)}"><b>${hashColor(targetUser)}</b></font>`);
  },
};
