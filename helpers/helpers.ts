import { SendMessageResult } from "@ton/sandbox";
import { createMdGraph, toGraphMap, jMinterOpcodes, jWalletOpcodes, nftMinterOpcodes, nftOpcodes, parseErrors, parseOp, stdFtOpCodes, stdNftOpCodes, tvmErrorCodes, preprocBuildContracts, parseVersion, fromNanos, BracketKeysType, CaptionHandlerParams, opEntries } from "../libs";
import { dummyOpcodes } from "../wrappers/Dummy";

export function preprocBuildContractsLocal(opts: {
    autocleanup?: boolean,
}): void {
    preprocBuildContracts({
        autocleanup: opts.autocleanup,
        data: {
            version: parseVersion(),
        }
    })
}

export function createMDGraphLocal(params: {
    msgResult: SendMessageResult,
    chartType?: "TB" | "LR" | "BT" | "RL", // default TB
    output: string,
    folderPath?: string,
    addressMap?: Map<string, string>,
    bracketMap?: Map<string, BracketKeysType>,
    hideOkValues?: boolean,
    displayValue?: boolean,
    displayTokens?: boolean,
    displayExitCode?: boolean,
    displayFees?: boolean,
    displayActionResult?: boolean,
    displayDeploy?: boolean,
    displayAborted?: boolean,
    displayDestroyed?: boolean,
    displaySuccess?: boolean,
    disableStyles?: boolean,
}) {
    // @ts-ignore
    if (typeof createMDGraphLocal.opMap == 'undefined') {
        // @ts-ignore
        createMDGraphLocal.opMap = toGraphMap({
            ...nftMinterOpcodes,
            ...stdFtOpCodes,
            ...stdNftOpCodes,
            ...nftOpcodes,
            ...jWalletOpcodes,
            ...jMinterOpcodes,
            ...dummyOpcodes,
            ...{
                swap: 0x25938561
            },
            ...parseOp("contracts/common/op.fc")
        });
    }
    // @ts-ignore
    if (typeof createMDGraphLocal.errorMap == 'undefined') {
        // @ts-ignore
        createMDGraphLocal.errorMap = toGraphMap({
            ...tvmErrorCodes,
            ...parseErrors("contracts/common/errors.fc")
        });
    }

    params.folderPath = params.folderPath ?? "build/graph/"
    const details = true

    createMdGraph({
        chartType: params.chartType ?? "TB",
        hideOkValues: params.hideOkValues ?? true,
        displayValue: params.displayValue ?? details,
        displayTokens: params.displayTokens ?? details,
        displayExitCode: params.displayExitCode ?? details,
        displayFees: params.displayFees ?? details,
        displayActionResult: params.displayActionResult ?? details,
        displayAborted: params.displayAborted ?? details,
        displayDeploy: params.displayDeploy ?? false,
        displayDestroyed: params.displayDestroyed ?? false,
        displaySuccess: params.displaySuccess ?? false,
        disableStyles: params.disableStyles ?? false,
        showOrigin: false,
        msgResult: params.msgResult,
        output: `${params.folderPath}${params.output}.md`,
        addressMap: params.addressMap,
        bracketMap: params.bracketMap,
        // @ts-ignore
        opMap: createMDGraphLocal.opMap,
        // @ts-ignore
        errMap: createMDGraphLocal.errorMap,
        // feeDetails: true,
        captionsMap: new Map(opEntries({
            0x01f3835d: (params: CaptionHandlerParams) => {
                // ton transfer
                let sc = params.body.beginParse();
                sc.loadUintBig(32 + 64);
                let amount = sc.loadCoins();
                return {
                    amount: fromNanos(amount)
                };
            }
        }))
    });
}
