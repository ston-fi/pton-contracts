import '@ton/test-utils';
import { Address, ExternalAddress } from '@ton/core';
import { AddressMap, HOLE_ADDRESS, isAddrStr, isExtAddrLike, isHole, padRawHexAddress, parseAddress, parseExtAddress, rawNumberToAddress, strAddress } from "../src/address";
import { JettonMinterContract } from '../src/wrappers/JettonMinter';

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString(); };

describe('Address', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test padRawHexAddress', async () => {
        let res = padRawHexAddress("test")
        expect(res.length).toEqual(64)
        expect(res.slice(0, 59)).toEqual('0'.repeat(59))
    });

    it('should test rawNumberToAddress', async () => {
        const addNum = 58566993766868769212656760660217770086772996216000848381990082503625461479934n
        const addr = Address.parseFriendly("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj").address
        expect(rawNumberToAddress(addNum).toString()).toEqual(addr.toString())
    });

    it('should test parseAddress', async () => {
        parseAddress("kQCgol0_IYwBpZ-ddjxPrDOIQQSmhDR2vXvr6zYHA4VhWXI_")
        parseAddress("0QCgol0_IYwBpZ-ddjxPrDOIQQSmhDR2vXvr6zYHA4VhWS_6")
        parseAddress("UQAO9JsDEbOjnb8AZRyxNHiODjVeAvgR2n03T0utYgkpx-K0")
        parseAddress("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj")
        parseAddress("0:a8641676cfd02edddcc334d8bc5e407186e21a9da0f511bdbfa05444610cb720")
        parseAddress("-1:a8641676cfd02edddcc334d8bc5e407186e21a9da0f511bdbfa05444610cb720")
    });

    it('should test isHole', async () => {
        expect(isHole(HOLE_ADDRESS)).toBe(true)
        expect(isHole(parseAddress("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj"))).toBe(false)
    });
    
    it('should test strAddress', async () => {
        let dummy = JettonMinterContract.createFromAddress(HOLE_ADDRESS)
        expect(strAddress(HOLE_ADDRESS)).toEqual("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")
        expect(strAddress("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")).toEqual("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")
        expect(strAddress(dummy)).toEqual("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")

    });

    it('should test AddressMap', async () => {
        let arg1 = JettonMinterContract.createFromAddress(HOLE_ADDRESS)
        let arg2 = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
        let arg3 = HOLE_ADDRESS

        let other = "EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO"

        let m = new AddressMap<number>()
        m.set(arg1, 1)

        expect(m.has(arg1)).toBeTruthy()
        expect(m.has(arg2)).toBeTruthy()
        expect(m.has(arg3)).toBeTruthy()

        expect(m.get(arg1)).toEqual(1)
        expect(m.get(arg2)).toEqual(1)
        expect(m.get(arg3)).toEqual(1)

        m.set(arg2, 20)
        expect(m.get(arg1)).toEqual(20)
        expect(m.get(arg2)).toEqual(20)
        expect(m.get(arg3)).toEqual(20)

        m.set(arg3, 300)
        expect(m.get(arg1)).toEqual(300)
        expect(m.get(arg2)).toEqual(300)
        expect(m.get(arg3)).toEqual(300)

        m.set(other, 999)
        expect(m.has(other)).toBeTruthy()
        m.delete(parseAddress(other))
        expect(m.has(other)).toBeFalsy()
    });

    it('should test AddressMap from array of tuples', async () => {
        let arg1 = JettonMinterContract.createFromAddress(parseAddress("EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO"))
        let arg2 = "EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj"
        let arg3 = HOLE_ADDRESS

        const data = [
            [arg1, 123],
            [arg2, 456],
            [arg3, 789],
        ] as const
        const m = new AddressMap(data)
        expect(m.get(arg1)).toEqual(123)
        expect(m.get(arg2)).toEqual(456)
        expect(m.get(arg3)).toEqual(789)
    });

    it('should test AddressMap from std Map of str addresses', async () => {
        let arg1 = "EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO"
        let arg2 = "EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj"


        let m1 = new Map<string, number>()
        m1.set(arg1, 123)
        m1.set(arg2, 456)
        const m = new AddressMap([...m1])
        expect(m.get(arg1)).toEqual(123)
        expect(m.get(arg2)).toEqual(456)
    });

    it('should test isAddrStr', async () => {
        let arg1 = "whatever"
        let arg2 = "EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj"

        expect(isAddrStr(arg1)).toBeFalsy()
        expect(isAddrStr(arg2)).toBeTruthy()
    });

    it('should test isExtAddrLike', async () => {

        expect(isExtAddrLike("External<256:123>")).toBeTruthy()
        expect(isExtAddrLike("External<0:123>")).toBeFalsy()
        expect(isExtAddrLike("External<0whatever:12hg453>")).toBeFalsy()
        expect(isExtAddrLike("<256:1234556>")).toBeFalsy()
        expect(isExtAddrLike("SomethingExternal<256:123>")).toBeFalsy()
        expect(isExtAddrLike(new ExternalAddress(123456n, 10))).toBeTruthy()
    });
    it('should test parseExtAddress', async () => {
        expect(() => { parseExtAddress("External<0:123>") }).toThrow()
        expect(() => { parseExtAddress("External<0whatever:12hg453>") }).toThrow()
        expect(() => { parseExtAddress("<256:1234556>") }).toThrow()
        expect(() => { parseExtAddress("SomethingExternal<256:123>") }).toThrow()

        expect(parseExtAddress("External<256:123>").toString() === new ExternalAddress(123n, 256).toString()).toBeTruthy()
        expect(parseExtAddress("External<10:123456>").toString() === (new ExternalAddress(123456n, 10).toString())).toBeTruthy()
    });

});

