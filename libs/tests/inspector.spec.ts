import '@ton/test-utils';
import { ContractInspector } from '../src/inspector';
import { DEFAULT_JETTON_MINTER_CODE } from '../src/wrappers/JettonMinter';
import { DEFAULT_JETTON_WALLET_CODE } from '../src/wrappers/JettonWallet';

describe('Inspector', () => {

    it('should parse jetton minter contract', async () => {
        const comp = new ContractInspector(DEFAULT_JETTON_MINTER_CODE);
        expect(comp.loadMethod("get_jetton_data")).not.toBe(undefined)
        expect(comp.loadMethod("get_wallet_address")).not.toBe(undefined)
        expect(comp.loadMethod("ababa")).toBe(undefined)
    });

    it('should parse jetton wallet contract', async () => {
        const comp = new ContractInspector(DEFAULT_JETTON_WALLET_CODE);
        expect(comp.loadMethod("get_wallet_data")).not.toBe(undefined)
        expect(comp.loadMethod("ababa")).toBe(undefined)
    });

});
