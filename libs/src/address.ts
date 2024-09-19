import { Address } from "@ton/core";

export function padRawHexAddress(addressHex: string) {
    return `${'0'.repeat(64)}${addressHex}`.slice(-64);
}

export function rawNumberToAddress(address: string | bigint, workchain = 0) {
    if (typeof address === "string") {
        return Address.parseRaw(`${workchain}:${padRawHexAddress(address)}`);
    } else {
        return Address.parseRaw(`${workchain}:${padRawHexAddress(BigInt(address).toString(16))}`);
    }
}

export function parseAddress(inp: string): Address {
    if (inp.includes(":")) {
        return Address.parseRaw(inp);
    } else {
        return Address.parseFriendly(inp).address;
    }
}
export const HOLE_ADDRESS = /*@__PURE__*/parseAddress("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")

export function isHole(addr: Address | null) {
    if (addr === null) {
        return false
    } else {
        return HOLE_ADDRESS.toString() === addr.toString()
    }
}