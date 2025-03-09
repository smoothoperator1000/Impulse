import { FS } from '../../lib/fs';
import { Economy } from '../../impulse/economy/economy-config'; // Using centralized storage system

const LOG_FILE = './logs/transactions.log';

const logTransaction = (message: string): void => {
    const logMessage = `[${new Date().toUTCString()}] ${message}\n`;
    FS(LOG_FILE).append(logMessage);
};

async function getBalance(userid: string): Promise<number> {
    userid = toID(userid);
    
    try {
        const data = await Economy.getItem(userid);
        return data?.money || 0;
    } catch (error) {
        return 0;
    }
}

async function setBalance(userid: string, amount: number): Promise<void> {
    userid = toID(userid);
    await Economy.setItem(userid, { money: amount });
    logTransaction(`${userid}'s balance was set to ${amount} coins.`);
}

async function addMoney(userid: string, amount: number, reason: string = "No reason provided"): Promise<void> {
    if (amount <= 0) return;
    userid = toID(userid);
    const currentBalance = await getBalance(userid);

    await setBalance(userid, currentBalance + amount);
    logTransaction(`ADD: ${userid} received ${amount} coins. Reason: ${reason}`);
}

async function takeMoney(userid: string, amount: number, reason: string = "No reason provided"): Promise<boolean> {
    if (amount <= 0) return false;
    userid = toID(userid);
    const currentBalance = await getBalance(userid);
    
    if (currentBalance < amount) return false;

    await setBalance(userid, currentBalance - amount);
    logTransaction(`TAKE: ${userid} lost ${amount} coins. Reason: ${reason}`);
    return true;
}

async function transferMoney(sender: string, receiver: string, amount: number, reason: string = "No reason provided"): Promise<boolean> {
    if (amount <= 0) return false;
    sender = toID(sender);
    receiver = toID(receiver);

    if (sender === receiver || !(await hasBalance(sender, amount))) return false;
    
    if (!(await takeMoney(sender, amount, `Transfer to ${receiver}`))) return false;
    await addMoney(receiver, amount, `Transfer from ${sender}`);
    
    logTransaction(`TRANSFER: ${sender} sent ${amount} coins to ${receiver}. Reason: ${reason}`);
    return true;
}

async function hasBalance(userid: string, amount: number): Promise<boolean> {
    userid = toID(userid);
    const balance = await getBalance(userid);
    return balance >= amount;
}

async function resetBalance(userid: string, reason: string = "No reason provided"): Promise<void> {
    userid = toID(userid);
    await setBalance(userid, 0);
    logTransaction(`${userid}'s balance was reset. Reason: ${reason}`);
}

async function resetAllBalances(): Promise<void> {
    await Economy.clear(); // Clears all stored balances
    logTransaction(`RESET: All user balances have been reset.`);
}

async function getAllBalances(): Promise<{ userid: string, name?: string, money: number }[]> {
    const allData = await Economy.keys();
    const balances = [];

    for (const userid of allData) {
        const data = await Economy.getItem(userid);
        if (data?.money) {
            balances.push({ 
                userid: toID(userid), // ✅ Ensures ID is lowercase & valid
                name: data.name, 
                money: data.money 
            });
        }
    }

    return balances.sort((a, b) => b.money - a.money);
}

export { getBalance, setBalance, addMoney, takeMoney, transferMoney, hasBalance, resetBalance, resetAllBalances, getAllBalances};
