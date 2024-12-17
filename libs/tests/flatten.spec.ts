import '@ton/test-utils';
import { Address, beginCell, ExternalAddress } from '@ton/core';
import { AddressMap, HOLE_ADDRESS, isHole, padRawHexAddress, parseAddress, rawNumberToAddress, strAddress } from "../src/address";
import { JettonMinterContract } from '../src/wrappers/JettonMinter';
import { flattenArray, flattenMap, flattenValue, flattenObject } from '../src/flatten';

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString(); };

describe('Flatten', () => {
    const div = ':'

    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test flattenArray with simple array', async () => {
        const data = [10, 20, 30, 50]
        expect(flattenArray(data, div)).toStrictEqual({ '0': 10, '1': 20, '2': 30, '3': 50 })
        expect(flattenArray(data, div, "arr")).toStrictEqual({ 'arr:0': 10, 'arr:1': 20, 'arr:2': 30, 'arr:3': 50 })
    });

    it('should test flattenMap with simple map', async () => {
        const data = new Map<string, number>()
        data.set("Q", 111)
        data.set("W", 222)
        data.set("E", 333)
        expect(flattenMap(data, div)).toStrictEqual({ 'Q': 111, 'W': 222, 'E': 333 })
        expect(flattenMap(data, div, "map")).toStrictEqual({ 'map:Q': 111, 'map:W': 222, 'map:E': 333 })
    });

    it('should test flattenValue with simple values', async () => {
        expect(flattenValue(null, div)).toStrictEqual(null)
        expect(flattenValue(undefined, div)).toStrictEqual(undefined)
        expect(flattenValue("test", div)).toStrictEqual("test")
        expect(flattenValue(123, div)).toStrictEqual(123)
        expect(flattenValue(1234n, div)).toStrictEqual(1234n)
        expect(flattenValue(HOLE_ADDRESS, div)).toStrictEqual("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")
        expect(flattenValue([10, 20, 30, 50], div)).toStrictEqual({ '0': 10, '1': 20, '2': 30, '3': 50 })
        expect(flattenValue(new Map<string, number>([["Q", 111], ["W", 222], ["E", 333]]), div)).toStrictEqual({ 'Q': 111, 'W': 222, 'E': 333 })
        expect(flattenValue({ '0': 10, '1': 20, '2': 30, '3': 50 }, div)).toStrictEqual({ '0': 10, '1': 20, '2': 30, '3': 50 })
        expect(flattenValue(new ExternalAddress(12345n, 256), div)).toStrictEqual("External<256:12345>")
    });

    it('should test flattenObject', async () => {
        let data = {
            cellObj: beginCell().storeStringRefTail("sometextsometextsometextsometextsometextsometextsometextsometext").endCell(),
            b: false,
            arrNum: [0, 1, 2, 3],
            addr: HOLE_ADDRESS,
            addrStr: "EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO",
            num: 1234,
            bignum: 123456789000000000n,
            map: new Map<string, number>([["Q", 111], ["W", 222], ["E", 333]]),
            simpleObj: { val1: 1, val2: 2 },
            nullVall: null,
            undef: undefined,
            complexObj : {
                inside1: { a: 1, b: 2 },
                inside2: [
                    { name: "some1", value: "val1" },
                    { name: "some2", value: "val2" },
                    { name: "some3", value: "val3" },
                    { name: "some4", value: "val4" },
                ],
                inside3: "whatever",
                insideNull: null
            }
        }
        let flattened = {
            cellObj: "b5ee9c72410102010045000100010080736f6d6574657874736f6d6574657874736f6d6574657874736f6d6574657874736f6d6574657874736f6d6574657874736f6d6574657874736f6d65746578744eb06551",
            b: false,
            "arrNum:0": 0,
            "arrNum:1": 1,
            "arrNum:2": 2,
            "arrNum:3": 3,
            addr: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
            addrStr: "EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO",
            num: 1234,
            bignum: 123456789000000000n,
            "map:Q": 111,
            "map:W": 222,
            "map:E": 333,
            "simpleObj:val1": 1,
            "simpleObj:val2": 2,
            nullVall: null,
            undef: undefined,
            "complexObj:inside1:a": 1,
            "complexObj:inside1:b": 2,
            "complexObj:inside2:0:name": "some1",
            "complexObj:inside2:0:value": "val1",
            "complexObj:inside2:1:name": "some2",
            "complexObj:inside2:1:value": "val2",
            "complexObj:inside2:2:name": "some3",
            "complexObj:inside2:2:value": "val3",
            "complexObj:inside2:3:name": "some4",
            "complexObj:inside2:3:value": "val4",
            "complexObj:inside3": "whatever",
            "complexObj:insideNull": null,
        }
        expect(flattenObject(data, div)).toStrictEqual(flattened)
    });

    

});

