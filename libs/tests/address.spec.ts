import '@ton/test-utils';
import { Address } from '@ton/core';
import { HOLE_ADDRESS, isHole, padRawHexAddress, parseAddress, rawNumberToAddress } from "../src/address";

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

});

