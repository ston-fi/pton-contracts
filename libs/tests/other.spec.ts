import '@ton/test-utils';
import { crc32 } from "../src/crc32";
import { parseVersion, toHexStr, toRevStr, toSnakeCase } from '../src/utils';

describe('Other', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test crc32', async () => {
        expect(crc32("test")).toEqual(0xd87f7e0c)
        expect(crc32("mint_nft")).toEqual(0xbba6cbca)
        expect(crc32("change_owner")).toEqual(0x93b05b31)
        expect(crc32("deploy_wallet query_id:uint64 owner_address:MsgAddress excesses_address:MsgAddress = InternalMsgBody")).toEqual(0xcf5f4313)
    });

    it('should test toRevStr', async () => {
        let st = "test1234"
        expect(toRevStr(st)).toEqual("4321tset")
    });

    it('should test toHexStr', async () => {
        expect(toHexStr(1236783456)).toEqual("0x49b7d160")
    });
    
    it('should test toSnakeCase', async () => {
        expect(toSnakeCase("testTest")).toEqual("test_test")
        expect(toSnakeCase("TestTest")).toEqual("test_test")
    });

    it('should test parseVersion', async () => {
        expect(parseVersion("1.2.5-beta.1.4")).toStrictEqual([1, 2, 5, "beta.1.4"])
        expect(parseVersion("0.2.2")).toStrictEqual([0, 2, 2, "patch2"])
        expect(parseVersion("1.2.0")).toStrictEqual([1, 2, 0, "release"])
        expect(parseVersion("1.2.5")).toStrictEqual([1, 2, 5, "patch5"])
    });
});

