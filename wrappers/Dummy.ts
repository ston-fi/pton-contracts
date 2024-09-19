import {
    Address,
    beginCell,
    Cell,
    ContractProvider,
    Sender,
    SendMode,
    Slice
} from '@ton/core';
import { beginMessage, CommonContractBase, emptyCell } from '../libs';


export type DummyConfig = {
    op?: bigint | number,
    msg?: Cell,
    payload?: Cell,
};

export function dummyConfigToCell(config: DummyConfig): Cell {
    return beginCell()
        .storeUint(config.op ?? 0, 32)
        .storeRef(config.msg ?? emptyCell())
        .storeRef(config.payload ?? emptyCell())
        .endCell();
}

export const dummyOpcodes = {
    bounce: 0xFFFF,
    dummyTransfer: 0xfffffeee
} as const;

export class DummyContract extends CommonContractBase {
    static createFromConfig(config: DummyConfig, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, dummyConfigToCell, code, workchain)
    }

    async getDummyData(provider: ContractProvider) {
        const result = await provider.get('get_dummy_data', []);

        return {
            op: result.stack.readNumber(),
            msg: result.stack.readCell(),
            payload: result.stack.readCell(),

        };
    }

    async sendMsg(provider: ContractProvider, via: Sender, opts: {
        op: number,
        payload: Slice
    }, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(opts.op ?? 0)
                .storeSlice(opts.payload)
                .endCell(),
        });
    }
    async sendFromPtonTransfer(provider: ContractProvider, via: Sender, opts: {
        ptonWalletAddress: Address,
        to: Address,
        amount: bigint,
        payload?: Cell,
        fwdAmount?: bigint,
        responseAddress?: Address,
    }, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(dummyOpcodes.dummyTransfer)
                .storeAddress(opts.ptonWalletAddress)
                .storeAddress(opts.to)
                .storeCoins(opts.amount)
                .storeCoins(opts.fwdAmount ?? 0n)
                .storeRef(beginCell()
                    .storeAddress(opts.responseAddress ?? null)
                .endCell())
                .storeMaybeRef(opts.payload)
                .endCell(),
        });
    }
}
