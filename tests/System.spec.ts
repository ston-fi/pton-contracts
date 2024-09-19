import { compile } from '@ton/blueprint';
import { Address, Cell, ExternalAddress, Slice, beginCell, toNano } from '@ton/core';
import { Blockchain, SandboxContract, SendMessageResult, TreasuryContract } from '@ton/sandbox';
import '@ton/test-utils';
import 'dotenv/config';
import { createMDGraphLocal, preprocBuildContractsLocal } from '../helpers/helpers';
import { BracketKeysType, buildLibFromCell, buildLibs, DAY_IN_SECONDS, emptyCell, HOLE_ADDRESS, metadataCell, nowSec, onchainMetadata, stdFtOpCodes } from '../libs';
import { expectBounced, expectEqAddress, expectNotBounced } from '../libs/src/test-helpers';
import { PTonMinterV2 } from '../wrappers/Minter';
import { PTonWalletV2 } from '../wrappers/Wallet';
import { DummyContract } from '../wrappers/Dummy';

type SBCtrTreasury = SandboxContract<TreasuryContract>;
type SBCtrMinter = SandboxContract<PTonMinterV2>;
type SBCtrWallet = SandboxContract<PTonWalletV2>;
type SBCtrDummy = SandboxContract<DummyContract>;

type WalletParams = {
    owner: Address,
    debugGraph?: string,
    label: string
}
type DummyParams = {
    index?: number
}
type SendParams = {
    tonAmount: bigint,
    gas: bigint,
    refundAddress?: Address | ExternalAddress | null,
    debugGraph?: string,
    payload?: Cell | Slice,
    wallet: SBCtrWallet,
    sender?: SBCtrTreasury,
    expectBounce?: boolean,
    expectRefund?: boolean,
    txValue?: bigint,
    payloadOverride?: boolean
}
type SendDummyParams = {
    amount: bigint,
    fwdAmount?: bigint,
    toAddress: Address,
    responseAddress?: Address,
    debugGraph?: string,
    payload?: Cell,
    wallet: SBCtrWallet,
    dummy: SBCtrDummy,
    expectBounce?: boolean,
    txValue?: bigint,
}

const defaultPayload = beginCell()
    .storeUint(0x25938561, 32)
    .storeAddress(HOLE_ADDRESS)
    .storeAddress(HOLE_ADDRESS)
    .storeAddress(HOLE_ADDRESS)
    .storeRef(beginCell()
        .storeCoins(1)
        .storeAddress(HOLE_ADDRESS)
        .storeCoins(1)
        .storeMaybeRef(null)
        .storeCoins(1)
        .storeMaybeRef(null)
        .storeUint(0, 16)
        .storeAddress(HOLE_ADDRESS)
        .endCell())
    .endCell()

describe('System', () => {
    let deployPTonWallet: (params: WalletParams) => Promise<SBCtrWallet>,
        deployDummy: (params: DummyParams) => Promise<SBCtrDummy>,
        sendDummy: (params: SendDummyParams) => Promise<SendMessageResult>,
        sendTon: (params: SendParams) => Promise<void>

    let code: { minter: Cell; wallet: Cell; dummy: Cell; },
        myLibs: Cell | undefined,
        bc: Blockchain,
        admin: SBCtrTreasury,
        alice: SBCtrTreasury,
        proxyMinter: SBCtrMinter,
        initTimestamp: number,
        bracketMap: Map<string, BracketKeysType>,
        addressMap: Map<string, string>

    addressMap = new Map();
    bracketMap = new Map();

    const setFromInitTimestamp = (amount: number) => {
        bc.now = initTimestamp + amount;
    };

    const advanceFromCurrentTS = (amount: number) => {
        if (typeof bc.now === "undefined") {
            throw new Error("blockchain time not manually set");
        }
        bc.now = bc.now + amount;
    };

    beforeAll(async () => {

        preprocBuildContractsLocal({})

        const _code = {
            minter: await compile("Minter"),
            wallet: await compile("Wallet"),
            dummy: await compile("Dummy")
        };

        myLibs = buildLibs(_code);

        // code = {
        //     minter: buildLibFromCell(_code.minter, "build/minter.json"),
        //     wallet: buildLibFromCell(_code.wallet, "build/wallet.json"),
        // };
        code = {
            minter: _code.minter,
            wallet: _code.wallet,
            dummy: _code.dummy,
        };


        deployDummy = async (params: DummyParams) => {
            let dummy = bc.openContract(DummyContract.createFromConfig({
                op: params.index
            }, code.dummy))

            let msgResult = await dummy.sendDeploy(admin.getSender(), toNano('5'));
            expectNotBounced(msgResult.events)

            expect(msgResult.transactions).toHaveTransaction({
                to: dummy.address,
                deploy: true,
            });

            addressMap.set(dummy.address.toString(), `Dummy ${params.index ?? 0}`);
            bracketMap.set(dummy.address.toString(), "hex");

            return dummy
        };

        deployPTonWallet = async (params: WalletParams) => {
            let walletAddress = await proxyMinter.getWalletAddress(params.owner)
            let wallet = bc.openContract(PTonWalletV2.createFromAddress(walletAddress))
            addressMap.set(walletAddress.toString(), `${params.label}<br/>pTon Wallet`);

            let msgResult = await proxyMinter.sendDeployWallet(admin.getSender(), {
                ownerAddress: params.owner,
                excessesAddress: admin.address,
            }, toNano(1))
            expectNotBounced(msgResult.events)
            if (params.debugGraph) {
                createMDGraphLocal({
                    msgResult: msgResult,
                    addressMap: addressMap,
                    bracketMap: bracketMap,
                    output: params.debugGraph
                });
            }
            const data = await wallet.getWalletData()
            expectEqAddress(data.ownerAddress, params.owner)

            return wallet
        };

        sendTon = async (params: SendParams) => {
            const sender = params.sender ?? admin

            const oldData = await params.wallet.getWalletData()

            let msgResult = await params.wallet.sendTonTransfer(sender.getSender(), {
                tonAmount: params.tonAmount,
                gas: params.gas,
                fwdPayload: params.payload ?? defaultPayload,
                refundAddress: typeof params.refundAddress === "undefined" ? sender.address : params.refundAddress,
                noPayloadOverride: params.payloadOverride
            }, params.txValue)
            if (params.debugGraph) {
                createMDGraphLocal({
                    msgResult: msgResult,
                    addressMap: addressMap,
                    bracketMap: bracketMap,
                    output: params.debugGraph
                });
            }
            const data = await params.wallet.getWalletData()
            if (params.expectBounce || params.expectRefund) {
                if (params.expectBounce) {
                    expectBounced(msgResult.events)
                } else {
                    expectNotBounced(msgResult.events)
                }

                expect(data.balance).toEqual(oldData.balance)
            } else {
                expectNotBounced(msgResult.events)
                expect(data.balance).toEqual(oldData.balance + params.tonAmount)
            }
        };
        sendDummy = async (params: SendDummyParams) => {
            const sender = admin

            const oldData = await params.wallet.getWalletData()

            let msgResult = await params.dummy.sendFromPtonTransfer(sender.getSender(), {
                ptonWalletAddress: params.wallet.address,
                to: params.toAddress,
                amount: params.amount,
                payload: params.payload,
                fwdAmount: params.fwdAmount,
                responseAddress: params.responseAddress
            }, params.txValue ?? toNano(1))
            if (params.debugGraph) {
                createMDGraphLocal({
                    msgResult: msgResult,
                    addressMap: addressMap,
                    bracketMap: bracketMap,
                    output: params.debugGraph
                });
            }
            const data = await params.wallet.getWalletData()
            if (params.expectBounce) {
                expectBounced(msgResult.events)
                expect(data.balance).toEqual(oldData.balance)
            } else {
                expectNotBounced(msgResult.events)
                expect(data.balance).toEqual(oldData.balance - params.amount)
            }
            return msgResult
        };
    });

    beforeEach(async () => {
        initTimestamp = nowSec()

        bc = await Blockchain.create();
        bc.libs = myLibs;

        admin = await bc.treasury('admin');
        alice = await bc.treasury('alice');
        addressMap.set(admin.address.toString(), "Admin");
        addressMap.set(alice.address.toString(), "Alice");
        bracketMap.set(admin.address.toString(), "circle");
        bracketMap.set(alice.address.toString(), "circle");


        proxyMinter = bc.openContract(PTonMinterV2.createFromConfig({
            walletCode: code.wallet,
            content: metadataCell(onchainMetadata({ name: "Test" }))
        }, code.minter));
        addressMap.set(proxyMinter.address.toString(), "Minter");
        bracketMap.set(proxyMinter.address.toString(), "diamond");

        let msgResult = await proxyMinter.sendDeploy(admin.getSender(), toNano('5'));
        expectNotBounced(msgResult.events)
        expect(msgResult.transactions).toHaveTransaction({
            from: admin.address,
            to: proxyMinter.address,
            deploy: true,
        });

    });


    describe('Minter', () => {
        it('should deploy new proxy wallet', async () => {
            let wallet = await deployPTonWallet({
                owner: alice.address,
                debugGraph: "deploy_wallet",
                label: "Alice"
            })
        });

    });

    describe('Wallet', () => {
        let dummy: SBCtrDummy,
            wallet: SBCtrWallet

        beforeEach(async () => {
            dummy = await deployDummy({})
            wallet = await deployPTonWallet({
                owner: dummy.address,
                label: "Dummy"
            })
        })

        describe('Excesses logic', () => {
            it('should handle different response address', async () => {
                await sendTon({
                    sender: admin,
                    tonAmount: toNano(100),
                    gas: toNano(1),
                    wallet: wallet,
                })
    
                let msgResult = await sendDummy({
                    dummy: dummy,
                    debugGraph: "from_owner_with_response",
                    amount: toNano(50),
                    toAddress: alice.address,
                    wallet: wallet,
                    responseAddress: admin.address
                })

                expect(msgResult.transactions).toHaveTransaction({
                    from: wallet.address,
                    to: admin.address,
                    op: stdFtOpCodes.excesses
                });
                expect(msgResult.transactions).toHaveTransaction({
                    from: wallet.address,
                    to: alice.address,
                    value: toNano(50)
                });
            });

            it('should handle fwd gas', async () => {
                await sendTon({
                    sender: admin,
                    tonAmount: toNano(100),
                    gas: toNano(1),
                    wallet: wallet,
                })

                await wallet.sendEmpty(admin.getSender(), toNano(1000))
    
                let msgResult = await sendDummy({
                    dummy: dummy,
                    debugGraph: "from_owner_with_gas",
                    amount: toNano(50),
                    toAddress: alice.address,
                    wallet: wallet,
                    responseAddress: admin.address,
                    fwdAmount: toNano("0.1")
                })

                expect(msgResult.transactions).toHaveTransaction({
                    from: wallet.address,
                    to: admin.address,
                    op: stdFtOpCodes.excesses
                });
                expect(msgResult.transactions).toHaveTransaction({
                    from: wallet.address,
                    to: alice.address,
                    value: toNano("50.1")
                });
            });

            it('should handle bounce if not enough value for fwd gas', async () => {
                await sendTon({
                    sender: admin,
                    tonAmount: toNano(100),
                    gas: toNano(1),
                    wallet: wallet,
                })
    
                let msgResult = await sendDummy({
                    dummy: dummy,
                    debugGraph: "from_owner_bounce_with_gas",
                    amount: toNano(50),
                    toAddress: alice.address,
                    wallet: wallet,
                    responseAddress: admin.address,
                    fwdAmount: toNano("10"),
                    expectBounce: true
                })

            });

            it('should handle receiver response address ', async () => {
                await sendTon({
                    sender: admin,
                    tonAmount: toNano(100),
                    gas: toNano(1),
                    wallet: wallet,
                })
    
                let msgResult = await sendDummy({
                    dummy: dummy,
                    debugGraph: "from_owner_with_response_receiver",
                    amount: toNano(50),
                    toAddress: alice.address,
                    wallet: wallet,
                    responseAddress: alice.address
                })

                expect(msgResult.transactions).not.toHaveTransaction({
                    from: wallet.address,
                    to: alice.address,
                    op: stdFtOpCodes.excesses
                });
            });

            it('should handle owner transfer to pton wallet with fwd gas', async () => {
                const dummy2 = await deployDummy({
                    index: 1
                })
                const wallet2 = await deployPTonWallet({
                    owner: dummy2.address,
                    label: "Dummy1"
                })
    
                await sendTon({
                    sender: admin,
                    tonAmount: toNano(100),
                    gas: toNano(1),
                    wallet: wallet,
                })
    
                let msgResult = await sendDummy({
                    dummy: dummy,
                    debugGraph: "to_pton_wallet_fwd_gas",
                    amount: toNano(50),
                    toAddress: wallet2.address,
                    wallet: wallet,
                    fwdAmount: toNano("0.5"),
                    txValue: toNano("1"),
                    responseAddress: admin.address
                })

                expect(msgResult.transactions).toHaveTransaction({
                    from: wallet.address,
                    to: admin.address,
                    op: stdFtOpCodes.excesses
                });
                expect(msgResult.transactions).toHaveTransaction({
                    from: wallet.address,
                    to: wallet2.address,
                    value: toNano("50.5")
                });
            });
        })

        it('should handle user transfer', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                wallet: wallet,
                debugGraph: "from_user"
            })
        });

        it('should handle owner transfer', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                wallet: wallet,
            })

            await sendDummy({
                dummy: dummy,
                debugGraph: "from_owner",
                amount: toNano(50),
                toAddress: alice.address,
                wallet: wallet,
            })
        });

        it('should handle owner transfer to pton wallet', async () => {
            const dummy2 = await deployDummy({
                index: 1
            })
            const wallet2 = await deployPTonWallet({
                owner: dummy2.address,
                label: "Dummy1"
            })

            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                wallet: wallet,
            })

            await sendDummy({
                dummy: dummy,
                debugGraph: "to_pton_wallet",
                amount: toNano(50),
                toAddress: wallet2.address,
                wallet: wallet,
            })
        });

        it('should handle owner transfer after 1 year inactivity', async () => {
            setFromInitTimestamp(100)
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                wallet: wallet,
            })

            advanceFromCurrentTS(DAY_IN_SECONDS * 365)
            await sendDummy({
                dummy: dummy,
                debugGraph: "from_owner_1y",
                amount: toNano(50),
                toAddress: alice.address,
                wallet: wallet,
            })
        });

        it('should refund user transfer if not enough ton sent', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                txValue: toNano(90),
                wallet: wallet,
                debugGraph: "from_user_refund",
                expectRefund: true
            })
        });

        it('should refund user transfer if no payload', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                wallet: wallet,
                debugGraph: "from_user_refund_no_payload",
                expectRefund: true,
                payloadOverride: true
            })
        });

        it('should refund user transfer if not enough gas', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano("0.001"),
                wallet: wallet,
                debugGraph: "from_user_refund_no_gas",
                expectRefund: true,
            })
        });

        it('should bounce user transfer if 0 amount', async () => {
            await sendTon({
                sender: admin,
                tonAmount: 0n,
                gas: toNano(1),
                wallet: wallet,
                debugGraph: "from_user_bounce_0",
                expectBounce: true,
            })
        });

        it('should bounce user transfer if refund addr_none', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(50),
                gas: toNano(1),
                wallet: wallet,
                refundAddress: null,
                debugGraph: "from_user_bounce_refund_addr_none",
                expectBounce: true,
            })
        });

        it('should bounce user transfer if refund external address', async () => {

            await sendTon({
                sender: admin,
                tonAmount: toNano(50),
                gas: toNano(1),
                wallet: wallet,
                refundAddress: new ExternalAddress(123456789n, 250),
                debugGraph: "from_user_bounce_refund_addr_ext",
                expectBounce: true,
            })
        });

        it('should bounce owner transfer if not enough balance', async () => {
            await sendTon({
                sender: admin,
                tonAmount: toNano(100),
                gas: toNano(1),
                wallet: wallet,
            })

            await sendDummy({
                dummy: dummy,
                debugGraph: "from_owner_bounce_low_balance",
                amount: toNano(101),
                toAddress: alice.address,
                wallet: wallet,
                expectBounce: true
            })
        });

    });

});
