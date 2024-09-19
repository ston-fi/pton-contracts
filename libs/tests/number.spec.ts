import '@ton/test-utils';
import { beginCell } from '@ton/core';
import { divUp, intNumber, isBnArray, isBnOrNanoStr, maxBigint, rndBigInt32, rndBigInt64 } from '../src/number';

describe('Numbers', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test rndBigInt32', async () => {
        let number = rndBigInt32()
        let t = beginCell().storeUint(number, 32).endCell()
    });

    it('should test rndBigInt64', async () => {
        let number = rndBigInt64()
        let t = beginCell().storeUint(number, 64).endCell()
        expect(() => { let t = beginCell().storeUint(number, 32).endCell() }).toThrow()
    });

    it('should test intNumber', async () => {
        expect(intNumber(123)).toEqual(123)
        expect(intNumber("123")).toEqual(123)
        expect(() => { intNumber("123.1234") }).toThrow()
    });

    it('should test isBnArray', async () => {
        let arr0: bigint[] = []
        expect(isBnArray(arr0)).toBeTruthy()

        let arr1 = [1n, 2n]
        expect(isBnArray(arr1)).toBeTruthy()
        let arr2 = [1, 2]
        expect(isBnArray(arr2)).toBeFalsy()
        let arr3 = [1n, 2]
        // @ts-ignore
        expect(isBnArray(arr3)).toBeFalsy()
    });

    it('should test divUp', async () => {
        expect(divUp(5n, 2n)).toEqual(3n)
    });

    it('should test maxBigint', async () => {
        let arr = [1n, 2n, 666n, 111n, 0n]
        expect(maxBigint(...arr)).toEqual(666n)
    });

    it('should test isBnOrNanoStr', async () => {
        expect(isBnOrNanoStr("1")).toBeTruthy()
        expect(isBnOrNanoStr("0.000000001")).toBeTruthy()
        expect(isBnOrNanoStr("0.0000000001")).toBeFalsy()
    });

});

