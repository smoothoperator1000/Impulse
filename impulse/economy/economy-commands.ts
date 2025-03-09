/* Created By Prince Sky
* Please Contact Prince Sky On Main Server
* If you want to help with more features or
* have suggestions to improve it further,
*/

import { getBalance, addMoney, takeMoney, hasBalance, resetBalance, transferMoney, resetAllBalances, getAllBalances} from '../../impulse/economy/economy';
import { FS } from '../../lib/fs';

const LOG_FILE = './logs/transactions.log';

global.currencyName = 'Pokèdollars';

export function hashColor(name?: string): string {
    if (!name || typeof name !== "string") name = "Unknown";
    name = toID(name); // Normalize username (lowercase, no spaces)

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 0x10007 + name.charCodeAt(i)) >>> 0; // Correct hashing formula
    }

    // Pokémon Showdown's exact hue calculation
    const H = hash % 360;
    return `hsl(${H}, 100%, 35%)`; // Matches Showdown’s username colors
}

export function nameColor(name?: string, userid?: string): string {
    const finalName = name ?? userid ?? "Unknown"; // Use name or fallback to ID
    const color = hashColor(finalName); // uses the real Showdown hashing system
    return `<strong style="color:${color};">${finalName}</strong>`;
}

export const commands: Chat.ChatCommands = {
    async balance(target, room, user) {
        this.requireRoom();
        const targetUser = toID(target) || toID(user.name);
        const balance = await getBalance(targetUser);
        this.sendReplyBox(`<strong>${targetUser}</strong> has <strong>${balance} ${currencyName}</strong>.`);
    },

    transactionlog(target, room, user) {
        this.checkCan('ban'); // Permission required (@ +)
        if (!FS(LOG_FILE).existsSync()) return this.errorReply("No transaction logs found.");

        let logs = FS(LOG_FILE).readSync().split('\n').filter(line => line.trim().length).reverse();
        let [pageOrUser, pageNumber] = target.split(',').map(t => t.trim());

        let isUserSearch = !!pageOrUser && isNaN(Number(pageOrUser));
        let page = Number(pageOrUser) || 1;
        const perPage = 10;

        if (isUserSearch) {
            let userid = toID(pageOrUser);
            logs = logs.filter(log => log.toLowerCase().includes(userid));
            page = Number(pageNumber) || 1;
        }

        const totalPages = Math.ceil(logs.length / perPage);
        if (page < 1 || page > totalPages) return this.errorReply(`Invalid page. There are ${totalPages || 1} pages.`);

        const start = (page - 1) * perPage;
        const pageLogs = logs.slice(start, start + perPage)
            .map((log, index) => `<strong>${start + index + 1}.</strong> ${log}`).join('<br>');

        user.send(`|uhtmlchange|transactionlog-${user.id}|<div class="infobox"><strong>Transaction Log (Page ${page} of ${totalPages} - Newest First):</strong><br>${pageLogs || "No transactions found."}</div>`);
    },

    eco: {
        async give(target, room, user) {
            this.checkCan('ban'); // Permission required (@ +)
            const [targetUser, amount, reason] = target.split(',').map(t => t.trim());
            if (!targetUser || isNaN(Number(amount)) || !reason) return this.errorReply("Usage: /eco give [user], [amount], [reason]");

            await addMoney(toID(targetUser), Number(amount), reason);
            this.sendReply(`${targetUser} has been given ${amount} ${currencyName}. Reason: ${reason}`);
        },

        async take(target, room, user) {
            this.checkCan('ban'); // Permission required (@ +)
            const [targetUser, amount, reason] = target.split(',').map(t => t.trim());
            if (!targetUser || isNaN(Number(amount)) || !reason) return this.errorReply("Usage: /eco take [user], [amount], [reason]");

            const success = await takeMoney(toID(targetUser), Number(amount), reason);
            if (success) {
                this.sendReply(`${amount} ${currencyName} have been taken from ${targetUser}. Reason: ${reason}`);
            } else {
                this.errorReply(`${targetUser} does not have enough ${currencyName}.`);
            }
        },

        async transfer(target, room, user) {
            const [targetUser, amount, reason] = target.split(',').map(t => t.trim());
            if (!targetUser || isNaN(Number(amount)) || !reason) return this.errorReply("Usage: /eco transfer [user], [amount], [reason]");

            const success = await transferMoney(toID(user.name), toID(targetUser), Number(amount), reason);
            if (success) {
                this.sendReply(`Successfully transferred ${amount} ${currencyName} to ${targetUser}. Reason: ${reason}`);
            } else {
                this.errorReply("Transfer failed. Check your balance.");
            }
        },

        async reset(target, room, user) {
            this.checkCan('ban'); // Permission required (@ +)
            const targetUser = toID(target);
            if (!targetUser) return this.errorReply("Usage: /eco reset [user]");

            await resetBalance(targetUser);
            this.sendReply(`Reset ${targetUser}'s balance to 0.`);
        },

        async resetall(target, room, user) {
            this.checkCan('bypassall'); // Requires admin privileges
            await resetAllBalances();
            this.sendReply(`All users' balances have been reset to 0.`);
        },
		 
        async leaderboard(target, room, user) {
            this.requireRoom();

            let page = Number(target) || 1;
            if (page < 1) page = 1;

            let usersData;
            try {
                usersData = await getAllBalances();
            } catch (error) {
                console.error("ECONNRESET Error in leaderboard:", error);
                return this.errorReply("Error retrieving leaderboard data. Please try again.");
            }

            const totalUsers = usersData.length;
            const perPage = 20;
            const totalPages = Math.max(1, Math.ceil(totalUsers / perPage));
            if (page > totalPages) page = totalPages;

            const start = (page - 1) * perPage;
            const displayedUsers = usersData.slice(start, start + perPage);

            if (!displayedUsers.length) return this.errorReply("No users to display on this page.");

            let tableRows = displayedUsers.map((user, index) => `<tr style="background: #2b2b3d;"><td style="padding: 8px; font-weight: bold; color: #FFD700;">${start + index + 1}</td><td style="padding: 8px;">${nameColor(user.name, user.userid)}</td><td style="padding: 8px; color: #00c8ff;">${user.money.toLocaleString()} ${currencyName}</td></tr>`).join("");

			  let leaderboardHtml = `<div style="background:#1e1e2e;padding:15px;border-radius:10px;color:#ffffff;font-family:Arial,sans-serif;text-align:center;max-width:100%;overflow:auto;"><div style="font-size:20px;font-weight:bold;color:#9bc8ff;margin-bottom:10px;"><center>❄️Economy Leaderboard ❄️</center><br></div><table style="width:100%;border-collapse:collapse;max-width:400px;margin:auto;border:3px solid #444;border-radius:8px;box-shadow:0px 4px 10px rgba(0,0,0,0.3);"><thead><tr style="background:#3c3c50;color:#00c8ff;font-size:14px;"><th style="padding:8px;border-right:2px solid #444;">Rank</th><th style="padding:8px;border-right:2px solid #444;">User</th><th style="padding:8px;">Balance</th></tr></thead><tbody>${tableRows}</tbody></table><div style="margin-top:10px;font-size:14px;color:#b0c7e4;">Page ${page} of ${totalPages}</div></div>`;
            const key = `leaderboard-${user.id}`;
            const userNameWithColor = nameColor(user.name, user.userid);
			  
            if (room) {
                this.send(`|raw|<strong>${userNameWithColor}</strong>: /eco leaderboard<br>${leaderboardHtml}`);
            } else {
                user.send(`|uhtml|${key}|<strong>${userNameWithColor}</strong>: /eco leaderboard<br>${leaderboardHtml}`);
                setTimeout(() => user.send(`|uhtmlchange|${key}|<strong>${userNameWithColor}</strong>: /eco leaderboard<br>${leaderboardHtml}`), 100);
            }
        },
	 },

    economy: 'eco', // Alias for /eco
};

export default commands;
