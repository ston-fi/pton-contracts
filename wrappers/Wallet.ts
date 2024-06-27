import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, ExternalAddress, Sender, SendMode, Slice } from '@ton/core';
import { beginMessage, JettonWalletContractBase, jWalletOpcodes } from '../libs';

export type WalletConfig = {
    balance: bigint,
    ownerAddress: Address,
    minterAddress: Address,
};

export function walletConfigToCell(config: WalletConfig): Cell {
    return beginCell()
        .storeCoins(config.balance)
        .storeAddress(config.ownerAddress)
        .storeAddress(config.minterAddress)
        .endCell();
}

export const proxyWalletOpcodesV2 = {
    ...jWalletOpcodes,
    resetGas: 0x29d22935,
    tonTransfer: 0x01f3835d
} as const;

export class PTonWalletV2 extends JettonWalletContractBase<typeof proxyWalletOpcodesV2> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(proxyWalletOpcodesV2, address, init)
    }

    static createFromConfig(config: WalletConfig, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, walletConfigToCell, code, workchain)
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendTonTransfer(provider: ContractProvider, via: Sender, opts: {
        tonAmount: bigint,
        refundAddress: Address | ExternalAddress | null
        fwdPayload: Cell | Slice,
        gas: bigint,
        noPayloadOverride?: boolean // only used to test refund
    }, value?: bigint) {
        if (!opts.gas) throw new Error("gas is 0")

        let msg_builder = beginMessage(this.opCodes.tonTransfer)
            .storeCoins(opts.tonAmount)
            .storeAddress(opts.refundAddress)

        let msg: Cell;
        if (opts.noPayloadOverride) {
            msg = msg_builder.endCell();
        } else {
            if (opts.fwdPayload instanceof Cell) {
                msg = msg_builder
                    .storeUint(1, 1)
                    .storeRef(opts.fwdPayload)
                    .endCell();
            } else {
                msg = msg_builder
                    .storeUint(0, 1)
                    .storeSlice(opts.fwdPayload)
                    .endCell();
            }
        }

        await provider.internal(via, {
            value: value ?? (opts.tonAmount + opts.gas),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg,
        });
    }

    async sendResetGas(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.resetGas)
                .endCell(),
        });
    }

}
