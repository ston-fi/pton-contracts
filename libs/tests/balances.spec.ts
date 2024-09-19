import '@ton/test-utils';
import { toNano } from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { fromNanos, getWalletBalance, toCoins } from "../src/balances";
import { metadataCell, onchainMetadata } from '../src/meta';
import { DEFAULT_JETTON_MINTER_CODE, JettonMinterContract } from '../src/wrappers/JettonMinter';
import { DEFAULT_JETTON_WALLET_CODE, JettonWalletContract } from '../src/wrappers/JettonWallet';

describe('Balances', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });


    it('should test fromNanos', async () => {
        let res = fromNanos(1_200_000_007n)
        expect(res).toEqual("1.200000007")
        res = fromNanos(1_200_000_007n, 12)
        expect(res).toEqual("0.001200000007")
        res = fromNanos(1_200_000_007n, 3)
        expect(res).toEqual("1200000.007")
    });

    it('should test getWalletBalance', async () => {

        let blockchain = await Blockchain.create();
        let deployer = await blockchain.treasury('deployer');

        const config = {
            totalSupply: 0,
            adminAddress: deployer.address,
            content: metadataCell(onchainMetadata({
                name: "test",
            })),
            jettonWalletCode: DEFAULT_JETTON_WALLET_CODE
        };
        const minter = blockchain.openContract(JettonMinterContract.createFromConfig(config, DEFAULT_JETTON_MINTER_CODE));
        await minter.sendDeploy(deployer.getSender(), toNano('0.05'));
        await minter.sendMint(deployer.getSender(), {
            value: toNano(2),
            toAddress: deployer.address,
            fwdAmount: toNano(1),
            masterMsg: {
                jettonAmount: toNano(123),
                jettonMinterAddress: minter.address,
            }
        });
        let wallet = blockchain.openContract(JettonWalletContract.createFromAddress(await minter.getWalletAddress(deployer.address)))
        let balance = await getWalletBalance(wallet)
        expect(balance).toEqual(toNano(123))

    });

    it('should test toCoins', async () => {
        expect(toCoins("123.123456789")).toEqual(toNano("123.123456789"))
        expect(toCoins(1)).toEqual(1000000000n)
        expect(toCoins(1, 1)).toEqual(10n)
        expect(toCoins(1, 15)).toEqual(1000000000000000n)
        expect(toCoins("123.12", 2)).toEqual(12312n)
        expect(toCoins("1.1245", 2)).toEqual(112n)
        expect(toCoins("1.123456789123456", 15)).toEqual(1123456789123456n)
        expect(() => toCoins("1.123456789123456789", 15)).toThrow()
    });
});

