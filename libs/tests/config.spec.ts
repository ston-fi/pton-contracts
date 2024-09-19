import '@ton/test-utils';
import { parseAddress } from "../src/address";
import { CliConfig, resolvers } from '../src/config';
import { JettonContent, NftContent } from '../src/meta';

describe('Config', () => {
    const paramsAll = {
        paramStr: resolvers.string,
        paramAddress: resolvers.address,
        paramBigint: resolvers.bigint,
        paramNumber: resolvers.number,
        paramAddressArr: resolvers.addressAr,
        paramBigintArr: resolvers.bigintAr,
        paramMeta: resolvers.meta,
    }

    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should parse string from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.string,
        })
        config.parseJSONString(`{ "param": "value1"}`)
        expect(config.values.param).toEqual("value1")
    });

    it('should parse address from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.address,
        })
        config.parseJSONString(`{ "param": "EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7"}`)
        expect(config.values.param?.equals(parseAddress("EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7"))).toBeTruthy()
    });

    it('should parse bigint from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.bigint,
        })
        config.parseJSONString(`{ "param": "1234567891011121314151617181920212223242526272829"}`)
        expect(config.values.param).toEqual(1234567891011121314151617181920212223242526272829n)
    });

    it('should parse number from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.number,
        })
        config.parseJSONString(`{ "param": "123456"}`)
        expect(config.values.param).toEqual(123456)
    });

    it('should parse addressAr from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.addressAr,
        })
        config.parseJSONString(`{ "param": ["EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO","EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"]}`)
        expect(config.values.param?.at(0)?.equals(parseAddress("EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO"))).toBeTruthy()
        expect(config.values.param?.at(1)?.equals(parseAddress("EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"))).toBeTruthy()
    });

    it('should parse bigintAr from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.bigintAr,
        })
        config.parseJSONString(`{ "param": ["12345","6789"]}`)
        expect(config.values.param?.at(0)).toEqual(12345n)
        expect(config.values.param?.at(1)).toEqual(6789n)
    });

    it('should parse on-chain meta from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.meta,
        })
        config.parseJSONString(`{ "param": {
            "name": "TestName",
            "description": "Test token",
            "decimals": 15,
            "symbol": "TT",
            "imageData": "test/images/tt.png"}}`
        )
        expect((config.values.param as JettonContent).name).toEqual("TestName")
        expect((config.values.param as JettonContent).description).toEqual("Test token")
        expect((config.values.param as JettonContent).decimals).toEqual(15)
        expect((config.values.param as JettonContent).symbol).toEqual("TT")
        expect((config.values.param as JettonContent).imageData).toEqual("test/images/tt.png")

    });

    it('should parse string meta from JSON string', async () => {
        const config = new CliConfig({
            param: resolvers.meta,
        })
        config.parseJSONString(`{ "param": "http://test.json"}`
        )
        expect(config.values.param).toEqual("http://test.json")
    });

    it('should parse config from object', async () => {
        const config = new CliConfig(paramsAll)
        const obj = {
            paramStr: "value1",
            paramAddress: "EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7",
            paramBigint: "1234567891011121314151617181920212223242526272829",
            paramNumber: "123456",
            paramAddressArr: ["EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO","EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"],
            paramBigintArr: ["12345","6789"],
            paramMeta: {
                name: "TestName",
                description: "Test token",
                decimals: 15,
                symbol: "TT",
                imageData: "test/images/tt.png"
            }
        }
        config.fromObject(obj)

        expect(config.values.paramStr).toEqual("value1")
        expect(config.values.paramAddress?.equals(parseAddress("EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7"))).toBeTruthy()
        expect(config.values.paramBigint).toEqual(1234567891011121314151617181920212223242526272829n)
        expect(config.values.paramNumber).toEqual(123456)
        expect(config.values.paramAddressArr?.at(0)?.equals(parseAddress("EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO"))).toBeTruthy()
        expect(config.values.paramAddressArr?.at(1)?.equals(parseAddress("EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"))).toBeTruthy()
        expect(config.values.paramBigintArr?.at(0)).toEqual(12345n)
        expect(config.values.paramBigintArr?.at(1)).toEqual(6789n)
    });

    it('should parse config from object with Address', async () => {
        const config = new CliConfig(paramsAll)
        const obj = {
            paramStr: "value1",
            paramAddress: parseAddress("EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7"),
            paramBigint: "1234567891011121314151617181920212223242526272829",
            paramNumber: "123456",
            paramAddressArr: ["EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO","EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"],
            paramBigintArr: ["12345","6789"],
            paramMeta: {
                name: "TestName",
                description: "Test token",
                decimals: 15,
                symbol: "TT",
                imageData: "test/images/tt.png"
            }
        }
        config.fromObject(obj)

        expect(config.values.paramStr).toEqual("value1")
        expect(config.values.paramAddress?.equals(parseAddress("EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7"))).toBeTruthy()
        expect(config.values.paramBigint).toEqual(1234567891011121314151617181920212223242526272829n)
        expect(config.values.paramNumber).toEqual(123456)
        expect(config.values.paramAddressArr?.at(0)?.equals(parseAddress("EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO"))).toBeTruthy()
        expect(config.values.paramAddressArr?.at(1)?.equals(parseAddress("EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"))).toBeTruthy()
        expect(config.values.paramBigintArr?.at(0)).toEqual(12345n)
        expect(config.values.paramBigintArr?.at(1)).toEqual(6789n)
    });

    it('should parse config and return parsed data', async () => {
        const config = new CliConfig(paramsAll)
        const obj = {
            paramStr: "value1",
            paramAddress: "EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7",
            paramBigint: "1234567891011121314151617181920212223242526272829",
            paramNumber: "123456",
            paramAddressArr: ["EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO","EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"],
            paramBigintArr: ["12345","6789"],
            paramMeta: {
                name: "TestName",
                description: "Test token",
                decimals: 15,
                symbol: "TT",
                imageData: "test/images/tt.png"
            }
        }

        const values = config.parseData(obj);

        expect(values.paramStr).toEqual("value1")
        expect(values.paramAddress?.equals(parseAddress("EQAx9iw3uuwqYybC-owgHsxGHg-kJG9jFqnE3Oy3NHOK_Mb7"))).toBeTruthy()
        expect(values.paramBigint).toEqual(1234567891011121314151617181920212223242526272829n)
        expect(values.paramNumber).toEqual(123456)
        expect(values.paramAddressArr?.at(0)?.equals(parseAddress("EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO"))).toBeTruthy()
        expect(values.paramAddressArr?.at(1)?.equals(parseAddress("EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez"))).toBeTruthy()
        expect(values.paramBigintArr?.at(0)).toEqual(12345n)
        expect(values.paramBigintArr?.at(1)).toEqual(6789n)
    });
    
    it('should throw on-chain meta if both image and imageData defined', async () => {
        const config = new CliConfig({
            param: resolvers.meta,
        })
        
        expect(() => { config.parseJSONString(`{ "param": {
            "name": "TestName",
            "description": "Test token",
            "decimals": 15,
            "symbol": "TT",
            "image": "http://test.png",
            "imageData": "test/images/tt.png"}}`
        ) }).toThrow()
    });

    it('should parse string publicKeys', async () => {
        const config = new CliConfig({
            param: resolvers.meta,
        })
        config.parseJSONString(`{ "param": {
            "publicKeys": "test_test_test"
        }}`)
        expect((config.values.param as NftContent).publicKeys).toEqual(["test_test_test"])

    });

    it('should parse array publicKeys', async () => {
        const config = new CliConfig({
            param: resolvers.meta,
        })
        config.parseJSONString(`{ "param": {
            "publicKeys": [
                "test_test_test_1",
                "test_test_test_2",
                "test_test_test_3"
            ]
        }}`)
        expect((config.values.param as NftContent).publicKeys).toEqual([
            "test_test_test_1",
            "test_test_test_2",
            "test_test_test_3",
        ])

    });

    it('should throw if publicKeys len mismatch', async () => {
        const config = new CliConfig({
            param: resolvers.meta,
        })
        
        expect(() => { config.parseJSONString(`{ "param": {
            "publicKeys": [
                "test_test_test_1",
                "test_test_test_2",
                "test_test_test"
            ]
        }}`) }).toThrow()
    });


});

