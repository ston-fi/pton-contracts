import { CliConfig, resolvers } from "../libs";

const configParams = {
    minterAddress: resolvers.address,
    metadata: resolvers.meta,
    libMinterAddress: resolvers.address,
    libWalletAddress: resolvers.address,
    libMinterHex: resolvers.string,
    libWalletHex: resolvers.string,
};

export const cliConfig = new CliConfig(configParams, {
    metadata: true
})


