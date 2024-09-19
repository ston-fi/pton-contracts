import '@ton/test-utils';
import { fDate, prettyBalance, prettyFees, prettyState, prettyVersion } from '../src/formatting';
import { AsyncReturnType } from '../src/types';
import { fetchJettonData } from '../src/onchain-helper';

describe('Formatting', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test fDate', async () => {
        expect(fDate(3600 * 24 * 4 + 3600 * 7 + 60 * 23 + 7)).toEqual("4d07:23:07")
        expect(fDate(1)).toEqual("0d00:00:01")
        expect(fDate(3600 * 24)).toEqual("1d00:00:00")
    });

    it('should test prettyVersion', async () => {
        const ver = {
            major: 1,
            minor: 2,
            dev: "test",
        }
        expect(prettyVersion(ver)).toEqual("v1.2-test")
    });

    it('should test prettyFees', async () => {
        expect(prettyFees(1234)).toEqual("12.34%")
    });

    it('should test prettyState', async () => {
        expect(prettyState("active")).toEqual("<g>ACTIVE")
        expect(prettyState("frozen")).toEqual("<b>FROZEN")
        expect(prettyState("uninit")).toEqual("<r>UNINIT")
    });

    it('should test prettyBalance', async () => {
        let data1 = {
            decimals: 9,
            symbol: "QWERTY",
        } as AsyncReturnType<typeof fetchJettonData>

        expect(prettyBalance(123456789123456789n, data1)).toEqual("123456789.123456789 QWERTY")

        let data2 = {
            decimals: 12,
            symbol: undefined,
        } as AsyncReturnType<typeof fetchJettonData>

        expect(prettyBalance(123456789123456789n, data2)).toEqual("123456.789123456789 ???")

        let data3 = {
            decimals: 6,
            symbol: "",
        } as AsyncReturnType<typeof fetchJettonData>
        expect(prettyBalance(123456789123456789n, data3)).toEqual("123456789123.456789 ???")
    });

});

