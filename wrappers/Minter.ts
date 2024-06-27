import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { beginMessage, JettonMinterContractBase, jMinterDiscOpcodes } from '../libs';

export type MinterConfig = {
    id?: number,
    walletCode: Cell,
    content: Cell,
};

export function minterConfigToCell(config: MinterConfig): Cell {
    return beginCell()
        .storeUint(config.id || 0, 32)
        .storeRef(config.walletCode)
        .storeRef(config.content)
        .endCell();
}

export const proxyOpCodesV2 = {
    ...jMinterDiscOpcodes,
    deployWallet: 0x4f5f4313
} as const;


export class PTonMinterV2 extends JettonMinterContractBase<typeof proxyOpCodesV2> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(proxyOpCodesV2, address, init)
    }

    static createFromConfig(config: MinterConfig, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, minterConfigToCell, code, workchain)
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendDeployWallet(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        ownerAddress: Address,
        excessesAddress?: Address
    }, value?: bigint) {
        await provider.internal(via, {
            value: value ?? toNano("1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.deployWallet)
                .storeAddress(opts.ownerAddress)
                .storeAddress(opts.excessesAddress || via.address)
                .endCell()
        });
    }
}
