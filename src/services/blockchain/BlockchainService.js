export class BlockchainService {
    constructor() { }
    static getInstance() { if (!BlockchainService.instance) {
        BlockchainService.instance = new BlockchainService();
    } return BlockchainService.instance; }
    simulateTransfer() { return { ok: true }; }
}
