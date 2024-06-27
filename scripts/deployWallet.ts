import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { cliConfig } from '../helpers/config';
import { awaitConfirmation, color, findArgs, getExpLink, getSeqNo, parseAddress, waitConfirm, waitSeqNoChange } from '../libs';
import { PTonMinterV2 } from '../wrappers/Minter';
import { PTonWalletV2 } from '../wrappers/Wallet';

export async function run(provider: NetworkProvider) {
    cliConfig.readConfig()
    let config = cliConfig.values

    if (config.minterAddress === null) {
        throw new Error('minterAddress is not defined');
    }

    let ownerAddress: Address
    let validArgs = "deployWallet"
    let argIndex = findArgs(process.argv, validArgs)
    try {
        ownerAddress = parseAddress(process.argv[++argIndex]);
    } catch (_) {
        console.error("Usage:\n" +
            "\tnpx blueprint run deployWallet <owner_address>\n"
        );
        return;
    }

    const senderAddress = provider.sender().address as Address

    const ptonMinter = provider.open(PTonMinterV2.createFromAddress(config.minterAddress))
    const walletAddress = await ptonMinter.getWalletAddress(ownerAddress)
    const wallet = provider.open(PTonWalletV2.createFromAddress(walletAddress))

    if (await provider.isContractDeployed(wallet.address)) {
        color.log(` - <r>This wallet is already deployed!`)
        throw ""
    }

    color.log(` - <y>Deploy new pTon Wallet at <b>${getExpLink(provider, wallet.address)}`)
    color.log(` - <y>Owner: <b>${getExpLink(provider, ownerAddress)}`)
    waitConfirm()

    const seqno = await getSeqNo(provider, senderAddress);
    await ptonMinter.sendDeployWallet(provider.sender(), {
        ownerAddress: ownerAddress
    }, toNano("0.5"));
    await waitSeqNoChange(provider, senderAddress, seqno);

    if (await awaitConfirmation(async () => {
        const data = await wallet.getWalletData();
        return data.ownerAddress.toString() === ownerAddress.toString()
    })) {
        color.log(` - <g>Successfully deployed wallet`)
    } else {
        color.log(` - <r>Error deploying wallet`)
    }
}
