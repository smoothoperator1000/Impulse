import * as nodePersist from 'node-persist';

// Initialize node-persist storage for the economy system
export const Economy = nodePersist.create({ dir: '../../impulse/economy/database' });

(async () => {
    await Economy.init();
    console.log("[Server] Economy storage initialized.");
})();
