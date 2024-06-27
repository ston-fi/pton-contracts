import { NetworkProvider, compile } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { cliConfig } from '../helpers/config';
import { preprocBuildContractsLocal } from '../helpers/helpers';
import { DEFAULT_DEPLOYER_CODE, Deployer, buildLibFromCell, color, getExpLink, isArgPresent, metadataCell, onchainMetadata, readLibHex, waitConfirm } from '../libs';
import { PTonMinterV2 } from '../wrappers/Minter';

export async function run(provider: NetworkProvider) {
    cliConfig.readConfig()
    let config = cliConfig.values

    if (config.metadata === null) {
        throw new Error('metadata is not defined');
    }

    const senderAddress = provider.sender().address as Address

    let noLib = isArgPresent(process.argv, "nolibs") || isArgPresent(process.argv, "nolib")

    color.log(` - <y>Deploy pTon minter <b><bld>${noLib ? "WITHOUT" : "WITH"} <clr><y>libs?`)
    waitConfirm()

    const metadata = typeof config.metadata === "string"
        ? config.metadata
        : onchainMetadata(config.metadata)

    preprocBuildContractsLocal({});

    const codes = {
        minter: await compile("Minter"),
        wallet: await compile("Wallet"),
    }
    let storageMinterCode = codes.minter
    let storageWalletCode = codes.wallet


    if (!noLib) {
        let mockMinter = provider.open(Deployer.createFromConfig({ publib: codes.minter }, DEFAULT_DEPLOYER_CODE))
        let mockWallet = provider.open(Deployer.createFromConfig({ publib: codes.wallet }, DEFAULT_DEPLOYER_CODE))

        config.libMinterAddress = mockMinter.address
        config.libWalletAddress = mockWallet.address

        let minterStatus = await provider.isContractDeployed(mockMinter.address)
        let walletStatus = await provider.isContractDeployed(mockWallet.address)

        color.log(` - <y>Lib status:`)
        color.log(`\t<y>Minter deployed: ${minterStatus ? "<g>" : "<r>"}${minterStatus}`)
        color.log(`\t<y>Wallet deployed: ${walletStatus ? "<g>" : "<r>"}${walletStatus}`)
        color.log(` - <y>Continue?`)
        waitConfirm()

        if (!minterStatus) {
            color.log(` - <y>Deploying mock <b>Minter<y>...`)
            await mockMinter.sendDeploy(provider.sender(), toNano('0.1'));
            await provider.waitForDeploy(mockMinter.address, 100);
        }
        if (!walletStatus) {
            color.log(` - <y>Deploying mock <b>Item<y>...`)
            await mockWallet.sendDeploy(provider.sender(), toNano('0.1'));
            await provider.waitForDeploy(mockWallet.address, 100);
        }

        storageMinterCode = buildLibFromCell(codes.minter, "build/minter.json")
        storageWalletCode = buildLibFromCell(codes.wallet, "build/wallet.json")

        config.libMinterHex = readLibHex("minter")
        config.libWalletHex = readLibHex("wallet")
    }

    const ptonMinter = provider.open(PTonMinterV2.createFromConfig({
        content: metadataCell(metadata),
        walletCode: storageWalletCode
    }, storageMinterCode));

    if (await provider.isContractDeployed(ptonMinter.address)) {
        color.log(` - <r>This minter is already deployed!`)
        throw ""
    }

    color.log(` - <y>Deploy new pTon Minter at <b>${getExpLink(provider, ptonMinter.address)}`)
    color.log(` - <y>Metadata:`)
    console.log(config.metadata)
    waitConfirm()

    await ptonMinter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(ptonMinter.address, 100);

    config.minterAddress = ptonMinter.address
    cliConfig.updateConfig()
}
