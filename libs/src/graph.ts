import { Address, Cell } from '@ton/core';
import { BlockchainTransaction, SendMessageResult } from '@ton/sandbox';
import '@ton/test-utils';
import { FlatTransaction, flattenTransaction } from '@ton/test-utils';
import fs from 'fs';
import path from "path";
import { toHexStr, toSnakeCase } from './utils';
import { fromNanos } from "./balances";

export function toGraphMap(obj: { [k: string]: number; }): CodesMap {
    // use this to construct opMap or errMap
    let res = new Map<number, string>();
    for (let entry of Object.entries(obj)) {
        res.set(entry[1], toSnakeCase(entry[0]));
    }
    return res;
}

export const BracketType = {
    square: (inp: any) => `["${inp.toString()}"]`,
    diamond: (inp: any) => `{"${inp.toString()}"}`,
    fillet: (inp: any) => `("${inp.toString()}")`,
    rounded: (inp: any) => `(["${inp.toString()}"])`,
    circle: (inp: any) => `(("${inp.toString()}"))`,
    circle2: (inp: any) => `((("${inp.toString()}")))`,
    hex: (inp: any) => `{{"${inp.toString()}"}}`,
    sub: (inp: any) => `[["${inp.toString()}"]]`,
    flag: (inp: any) => `>"${inp.toString()}"]`,
    db: (inp: any) => `[("${inp.toString()}")]`,
    parallelR: (inp: any) => `[/"${inp.toString()}"/]`,
    parallelL: (inp: any) => `[\\"${inp.toString()}"\\]`,
    trapezoidT: (inp: any) => `[/"${inp.toString()}"\\]`,
    trapezoidB: (inp: any) => `[\\"${inp.toString()}"/]`,
} as const;


export type CodesMap = Map<number, string>;
export type Captions = { [k: string]: any; };
export type CaptionHandlerParams = {
    body: Cell,
    opMap?: CodesMap,
    errMap?: CodesMap,
    hideOkValues: boolean,
};
export type CaptionHandler = (params: CaptionHandlerParams) => Captions;

export function opEntries(obj: { [k: number]: CaptionHandler; }): [number, CaptionHandler][] {
    // use this to construct captionsMap from object
    return Object.entries(obj).map((val) => {
        let nKey = Number(val[0]);
        if (isNaN(nKey)) throw new Error("only number keys are allowed in this object");
        return [nKey, val[1]];
    });
}

export type FeeData = {
    computeFee?: bigint,
    storageFee?: bigint,
    totalFwdFee?: bigint,
    inForwardFee?: bigint,
    totalActionFee?: bigint,
};
export type FeeDetails = { [K in keyof FeeData]: boolean };
export type FlatTransactionExtended = FlatTransaction & FeeData;
export function flattenTransactionExtended(tx: BlockchainTransaction) {
    let txFlat = flattenTransaction(tx);
    let description = tx.description;
    let res: FlatTransactionExtended = {
        ...txFlat
    };

    if (description.type === 'generic' && description.computePhase.type === "vm") {
        res.computeFee = description.computePhase.gasFees;
    }
    if (description.type === 'generic' && description.storagePhase) {
        res.storageFee = description.storagePhase.storageFeesCollected;
    }
    if (description.type === 'generic' && description.actionPhase) {
        res.totalFwdFee = description.actionPhase.totalFwdFees ? description.actionPhase.totalFwdFees : undefined;
        res.totalActionFee = description.actionPhase.totalActionFees ? description.actionPhase.totalActionFees : undefined;
    }
    if (tx.inMessage?.info.type === 'internal') {
        res.inForwardFee = tx.inMessage.info.forwardFee;
    }
    return res;

}

export const DEFAULT_CAPTION_MAP: Map<number, CaptionHandler> = new Map(/*@__PURE__*/opEntries({
    0x178d4519: (params: CaptionHandlerParams) => {
        // internalTransfer
        let sc = params.body.beginParse();
        sc.loadUintBig(32 + 64);
        let amount = sc.loadCoins();
        return {
            amount: fromNanos(amount)
        };
    },
    0x25938561: (params: CaptionHandlerParams) => {
        // swap
        let sc = params.body.beginParse();
        sc.loadUintBig(32 + 64);
        sc.loadAddress();
        let amount = sc.loadCoins() + sc.loadCoins();
        return {
            amount: fromNanos(amount)
        };
    },
    0xf8a7ea5: (params: CaptionHandlerParams) => {
        // transfer
        let res: Captions = {};
        let sc = params.body.beginParse();
        sc.loadUintBig(32 + 64);
        let amount = sc.loadCoins();
        sc.loadMaybeAddress();
        sc.loadMaybeAddress();
        sc.loadUint(1);
        let _fwd = sc.loadCoins();
        if (!params.hideOkValues || _fwd) res.fwdTon = fromNanos(_fwd);
        res.amount = fromNanos(amount);
        try {
            sc.loadUint(1);
            let transferCode = sc.loadUint(32);
            let strCode = params.opMap?.get(transferCode) ?? params.errMap?.get(transferCode);
            res.txCode = `${strCode ?? toHexStr(transferCode)}`;
        } catch { }
        return res;
    },
    0xf93bb43f: (params: CaptionHandlerParams) => {
        // pay_to
        let res: Captions = {};
        try {
            let sc = params.body.beginParse();
            sc.loadUintBig(32 + 64);
            sc.loadAddress();
            sc.loadAddress();
            let payCode = sc.loadUint(32);
            let strPCode = params.opMap?.get(payCode) ?? toHexStr(payCode);
            res.pay = `${strPCode}`;
        } catch { }
        return res;
    },
    0x537c5a70: (params: CaptionHandlerParams) => {
        // deposit_ref_fee
        let res: Captions = {};
        try {
            let sc = params.body.beginParse();
            sc.loadUintBig(32 + 64);
            let amount = sc.loadCoins();
            res.amount = fromNanos(amount);
        } catch { }
        return res;

    },
    0x7362d09c: (params: CaptionHandlerParams) => {
        // transfer_notification
        let res: Captions = {};
        try {
            let sc = params.body.beginParse();
            sc.loadUintBig(32 + 64);
            let amount = sc.loadCoins();
            res.amount = fromNanos(amount);
            sc.loadAddress();
            let eBit = sc.loadUint(1);
            let fwdOp = 0;
            if (eBit) {
                fwdOp = sc.loadRef().beginParse().loadUint(32);
            } else {
                fwdOp = sc.loadUint(32);
            }
            if (fwdOp) {
                res.fwdOp = `${params.opMap?.get(fwdOp) ?? toHexStr(fwdOp)}`;
            }
        } catch { }
        return res;
    },
}));

export type DirectionType = "unidirectional" | "bidirectional";
export type ChartType = "TB" | "LR" | "BT" | "RL";
export type BracketKeysType = keyof typeof BracketType;
export type GraphArgsType = {
    directionType?: DirectionType, // default "bidirectional"
    chartType?: ChartType, // default TB
    folder?: string,                // default "build/graph/"
    addressMap?: Map<string, string>,
    bracketMap?: Map<string, BracketKeysType>,
    captionsMap?: Map<number, CaptionHandler>,
    opMap?: CodesMap,
    errMap?: CodesMap,
    hideOkValues?: boolean,         // default true
    displayIndex?: boolean,         // default true
    displayOp?: boolean,            // default true
    displayValue?: boolean,         // default true
    displayFees?: boolean,          // default true
    displayDetails?: boolean,        // default true
    displayExitCode?: boolean,      // default true
    displayActionResult?: boolean,  // default true
    displayDeploy?: boolean,        // default false
    displayDestroyed?: boolean,     // default true
    displayAborted?: boolean,       // default true
    displaySuccess?: boolean,       // default false
    disableStyles?: boolean,        // default false
    feeDetails?: boolean | FeeDetails,  // default false
    showOrigin?: boolean,           // default false
    colorForward?: string,          // default #ff4747
    colorBackward?: string,         // default #02dbdb
    colorExcess?: string,           // default #0400f0
};

export class SandboxGraph {
    private defaults = {
        folder: "build/graph/",
        hideOkValues: true,
        displayIndex: true,
        displayOp: true,
        displayValue: true,
        displayFees: true,
        displayDetails: true,
        displayExitCode: true,
        displayActionResult: true,
        displayDeploy: false,
        displayDestroyed: true,
        displayAborted: true,
        displaySuccess: false,
        disableStyles: false,
        feeDetails: false,
        colorForward: "#ff4747",
        colorBackward: "#02dbdb",
        colorExcess: "#0400f0",
        chartType: "TB" as ChartType,
        showOrigin: false,
        directionType: "bidirectional" as DirectionType,
    };

    private params;
    private links: string = "";
    private names: string = "";
    private styles: string = "";
    private actors: number = 0;
    private internalMap: Map<string, string> = new Map();

    constructor(params: GraphArgsType) {
        this.params = {
            ...params,
            folder: params.folder ?? this.defaults.folder,
            hideOkValues: params.hideOkValues ?? this.defaults.hideOkValues,
            displayIndex: params.displayIndex ?? this.defaults.displayIndex,
            displayOp: params.displayOp ?? this.defaults.displayOp,
            displayValue: params.displayValue ?? this.defaults.displayValue,
            displayFees: params.displayFees ?? this.defaults.displayFees,
            displayDetails: params.displayDetails ?? this.defaults.displayDetails,
            displayExitCode: params.displayExitCode ?? this.defaults.displayExitCode,
            displayActionResult: params.displayActionResult ?? this.defaults.displayActionResult,
            displayDeploy: params.displayDeploy ?? this.defaults.displayDeploy,
            displayDestroyed: params.displayDestroyed ?? this.defaults.displayDestroyed,
            displayAborted: params.displayAborted ?? this.defaults.displayAborted,
            displaySuccess: params.displaySuccess ?? this.defaults.displaySuccess,
            disableStyles: params.disableStyles ?? this.defaults.disableStyles,
            feeDetails: params.feeDetails ?? this.defaults.feeDetails,
            colorForward: params.colorForward ?? this.defaults.colorForward,
            colorBackward: params.colorBackward ?? this.defaults.colorBackward,
            colorExcess: params.colorExcess ?? this.defaults.colorExcess,
            chartType: params.chartType ?? this.defaults.chartType,
            showOrigin: params.showOrigin ?? this.defaults.showOrigin,
            directionType: params.directionType ?? this.defaults.directionType,
            captionsMap: params.captionsMap ? new Map([...DEFAULT_CAPTION_MAP, ...params.captionsMap]) : DEFAULT_CAPTION_MAP,
        };
    }

    private getErrorCode(params: typeof this.params, code: number) {
        return params.errMap?.get(code) ?? code;
    }

    private getOpCode(params: typeof this.params, op: number) {
        return params.opMap?.get(op) ?? toHexStr(op);
    }

    private getBracketKey(params: typeof this.params, key: string) {
        return params.bracketMap?.get(key);
    }

    private getEntryIndex(key: string) {
        // from str "A..."
        return Number(key.slice(1));
    };

    private getEntryString(info: string[], from: string, to: string, arrow: string) {
        let label = info.join("<br/>");
        return `${from} ${arrow} |${label}|${to}`;
    };

    private getNameFromMap(params: typeof this.params, address: Address | -1, isTo = false) {
        const addrStr = address.toString();
        if (
            !this.internalMap.has(addrStr) || 
            (isTo && params.directionType === "unidirectional")
        ) {
            const index = this.actors;
            this.actors++;
            this.internalMap.set(addrStr, `A${index}`);
            this.addName(params, address, index);
        }
        return this.internalMap.get(addrStr) as string;
    };

    private addLink(link: string) {
        this.links += `\t${link}\n`;
    }

    private addStyle(ind: number, color: string) {
        this.styles += `\tlinkStyle ${ind} stroke:${color},color:${color}\n`;
    };

    private addName(params: typeof this.params, address: Address | -1, index: number) {
        const addrStr = address.toString();
        let displayKey: string;
        if (address !== -1) {
            displayKey = params.addressMap?.get(addrStr) ?? addrStr;
        } else {
            displayKey = "external";
        }
        let bracketKey: keyof typeof BracketType = (this.getBracketKey(params, addrStr) || this.getBracketKey(params, displayKey)) ?? "square";
        this.names += `\tA${index}${BracketType[bracketKey](displayKey)}\n`;
    };


    private createLink(params: typeof this.params, tx: FlatTransactionExtended, ind: number) {
        let from = this.getNameFromMap(params, tx.from ?? -1);
        let to = this.getNameFromMap(params, tx.to as Address, true);

        let arrow = this.getEntryIndex(from) <= this.getEntryIndex(to) ? "-->" : "-.->";
        let color = this.getEntryIndex(from) <= this.getEntryIndex(to) ? params.colorForward : params.colorBackward;

        let txInfo: string[] = [];
        const addInfo = (label: string, data: any) => { txInfo.push(`${label}: ${data}`); };
        // ------------------------------
        if (params.displayIndex) { addInfo("index", ind); }
        // ------------------------------
        if (params.displayValue && typeof tx.value !== "undefined") { addInfo("value", fromNanos(tx.value)); }
        // ------------------------------
        if (params.displayFees && typeof tx.totalFees !== "undefined") {
            if (params.feeDetails) {
                let fees = {
                    computeFee: tx.computeFee,
                    storageFee: tx.storageFee,
                    totalFwdFee: tx.totalFwdFee,
                    inForwardFee: tx.inForwardFee,
                    totalActionFee: tx.totalActionFee,
                };
                if (typeof params.feeDetails !== "boolean") {
                    fees = {
                        computeFee: params.feeDetails.computeFee ? tx.computeFee : undefined,
                        storageFee: params.feeDetails.storageFee ? tx.storageFee : undefined,
                        totalFwdFee: params.feeDetails.totalFwdFee ? tx.totalFwdFee : undefined,
                        inForwardFee: params.feeDetails.inForwardFee ? tx.inForwardFee : undefined,
                        totalActionFee: params.feeDetails.totalActionFee ? tx.totalActionFee : undefined,
                    };
                }
                addInfo("totalFee", fromNanos(tx.totalFees));
                if (fees.computeFee) addInfo("computeFee", fromNanos(fees.computeFee));
                if (fees.storageFee) addInfo("storageFee", fromNanos(fees.storageFee));
                if (fees.totalFwdFee) addInfo("totalFwdFee", fromNanos(fees.totalFwdFee));
                if (fees.inForwardFee) addInfo("inForwardFee", fromNanos(fees.inForwardFee));
                if (fees.totalActionFee) addInfo("totalActionFee", fromNanos(fees.totalActionFee));
            } else {
                addInfo("fees", fromNanos(tx.totalFees));
            }
        }
        // ------------------------------
        if (params.displayOp && typeof tx.op !== "undefined") {
            addInfo("op", this.getOpCode(params, tx.op));
            color = tx.op === 0xd53276db ? params.colorExcess : color;
        }
        // ------------------------------
        if (
            params.displayDetails
            && typeof tx.op !== "undefined"
            && typeof tx.body !== "undefined"
        ) {
            let handler = params.captionsMap.get(tx.op);
            if (handler) {
                try {
                    let captions = handler({
                        body: tx.body,
                        opMap: params.opMap,
                        errMap: params.errMap,
                        hideOkValues: params.hideOkValues
                    });
                    for (let key in captions) {
                        addInfo(key, captions[key]);
                    }
                } catch { }
            }
        }
        // ------------------------------
        if (
            params.displayExitCode
            && typeof tx.exitCode !== "undefined"
            && (!params.hideOkValues || tx.exitCode)
        ) { addInfo("exit", this.getErrorCode(params, tx.exitCode)); }
        // ------------------------------
        if (
            params.displayActionResult
            && typeof tx.actionResultCode !== "undefined"
            && (!params.hideOkValues || tx.actionResultCode)
        ) { addInfo("action", this.getErrorCode(params, tx.actionResultCode)); }
        // ------------------------------
        if (
            params.displayDeploy
            && (!params.hideOkValues || tx.deploy)
        ) { addInfo("deploy", tx.deploy); }
        // ------------------------------
        if (
            params.displayAborted
            && typeof tx.aborted !== "undefined"
            && (!params.hideOkValues || tx.aborted)
        ) { addInfo("abort", tx.aborted); }
        // ------------------------------
        if (
            params.displayDestroyed
            && typeof tx.destroyed !== "undefined"
            && (!params.hideOkValues || tx.destroyed)
        ) { addInfo("destroy", tx.destroyed); }
        // ------------------------------
        if (
            params.displaySuccess
            && typeof tx.success !== "undefined"
            && (!params.hideOkValues || tx.success)
        ) { addInfo("success", tx.success); }
        // ------------------------------
        this.addStyle(ind, color);
        this.addLink(this.getEntryString(txInfo, from, to, arrow));
    };

    private compile(params: typeof this.params) {
        return "```mermaid\nflowchart " + `${params.chartType}\n`
            + this.names + "\n"
            + this.links + "\n"
            + (params.disableStyles ? "" : this.styles)
            + "\n```";
    }

    render(msgResult: SendMessageResult, name: string, overrides?: GraphArgsType) {
        this.links = "";
        this.names = "";
        this.styles = "";
        this.actors = 0;
        this.internalMap = new Map();

        const params = {
            ...this.params,
            ...overrides,
            captionsMap: overrides?.captionsMap ? new Map([...this.params.captionsMap, ...overrides.captionsMap]) : this.params.captionsMap,
        };
        const outFile = path.join(params.folder, `${name}.md`)

        let cnt = 0;
        for (const tx of msgResult.transactions) {
            let txFlat = flattenTransactionExtended(tx);
            if (typeof txFlat.from === "undefined" && !params.showOrigin) continue;
            this.createLink(params, txFlat, cnt);
            cnt++;
        }
        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, this.compile(params), "utf-8");
    }

}


/**
 * @deprecated
 *
 * Use SandboxGraph instead
 */
export function createMdGraph(params: {
    msgResult: SendMessageResult,
    directionType?: DirectionType, // default "bidirectional"
    chartType?: ChartType, // default TB
    output?: string,                // default "build/graph.md"
    addressMap?: Map<string, string>,
    bracketMap?: Map<string, BracketKeysType>,
    captionsMap?: Map<number, CaptionHandler>,
    opMap?: CodesMap,
    errMap?: CodesMap,
    hideOkValues?: boolean,         // default true
    displayIndex?: boolean,         // default true
    displayOp?: boolean,            // default true
    displayValue?: boolean,         // default true
    displayFees?: boolean,          // default true
    displayTokens?: boolean,        // default true
    displayExitCode?: boolean,      // default true
    displayActionResult?: boolean,  // default true
    displayDeploy?: boolean,        // default false
    displayDestroyed?: boolean,     // default true
    displayAborted?: boolean,       // default true
    displaySuccess?: boolean,       // default false
    disableStyles?: boolean,        // default false
    feeDetails?: boolean | FeeDetails,  // default false
    showOrigin?: boolean,           // default false
    colorForward?: string,          // default #ff4747
    colorBackward?: string,         // default #02dbdb
    colorExcess?: string,           // default #0400f0
}) {
    const filename = params.output ?? "build/graph.md"
    const folder = path.dirname(filename)
    const base = path.basename(filename, ".md")
    
    const graph = new SandboxGraph({
        ...params,
        folder: folder,
        displayDetails: params.displayTokens
    })
    graph.render(params.msgResult, base)
}
