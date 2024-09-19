import { beginCell, Cell, toNano } from '@ton/core';
import '@ton/test-utils';
import fs from 'fs';
import { parseAddress } from "../src/address";
import { beginMessage, cellFromStrFile, cellToBocStr, codeFromString, createInternalMsgCell, emptyCell, Flags, getContractCode, stringCell } from "../src/cell";

describe('Cell', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test beginMessage', async () => {
        let res = beginMessage(123).endCell()
        let ds = res.beginParse()
        expect(ds.loadUint(32)).toEqual(123)
        ds.loadUintBig(64)

        res = beginMessage(123n).endCell()
        ds = res.beginParse()
        expect(ds.loadUint(32)).toEqual(123)
        ds.loadUintBig(64)

        res = beginMessage("test").endCell()
        ds = res.beginParse()
        expect(ds.loadUint(32)).toEqual(0xd87f7e0c)
        ds.loadUintBig(64)

    });

    it('should test emptyCell', async () => {
        let res = emptyCell()
        expect(res.equals(beginCell().endCell())).toBeTruthy()
    });

    it('should test stringCell', async () => {
        let res = stringCell("test")
        expect(res.beginParse().loadStringTail()).toEqual("test")
    });

    it('should test codeFromString', async () => {
        let res = codeFromString("b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093dfc142201b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064907c80383a6465816503e5ffe4e83bc00c646582ac678b28027d0109e5b589666664b8fd80403efd9910e38048adf068698180b8d848adf07d201800e98fe99ff6a2687d007d206a6a18400aa9385d47181a9aa8aae382f9702480fd207d006a18106840306b90fd001812881a28217804502a906428027d012c678b666664f6aa7041083deecbef29385d71811a92e001f1811802600271812f82c207f97840a0908002e5143c705f2e049d43001c85004fa0258cf16ccccc9ed5400303515c705f2e049fa403059c85004fa0258cf16ccccc9ed5400fe3603fa00fa40f82854120870542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a1035024c85004fa0258cf16ccccc9ed5401fa403020d70b01c3008e1f8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00915be249da0571")
    });

    it('should test cellFromStrFile', async () => {
        let boc = "b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093dfc142201b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064907c80383a6465816503e5ffe4e83bc00c646582ac678b28027d0109e5b589666664b8fd80403efd9910e38048adf068698180b8d848adf07d201800e98fe99ff6a2687d007d206a6a18400aa9385d47181a9aa8aae382f9702480fd207d006a18106840306b90fd001812881a28217804502a906428027d012c678b666664f6aa7041083deecbef29385d71811a92e001f1811802600271812f82c207f97840a0908002e5143c705f2e049d43001c85004fa0258cf16ccccc9ed5400303515c705f2e049fa403059c85004fa0258cf16ccccc9ed5400fe3603fa00fa40f82854120870542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a1035024c85004fa0258cf16ccccc9ed5401fa403020d70b01c3008e1f8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00915be249da0571"
        fs.mkdirSync("build", { recursive: true });
        fs.writeFileSync("build/_test_cellFromStrFile.txt", boc)
        let res = cellFromStrFile("build/_test_cellFromStrFile.txt")
        expect(res.equals(Cell.fromBoc(Buffer.from(boc, 'hex'))[0])).toBeTruthy()
    });

    it('should test cellToBocStr', async () => {
        let testCell = beginCell().storeUint(1, 32).endCell()
        let boc = cellToBocStr(testCell, "build/_test_cellToBocStr.txt")
        expect(boc).toEqual("b5ee9c7241010101000600000800000001e083c4fd")
        let fromfile = fs.readFileSync("build/_test_cellToBocStr.txt", 'utf8')
        expect(fromfile).toEqual("b5ee9c7241010101000600000800000001e083c4fd")
    });

    it('should test getContractCode', async () => {
        let boc = "b5ee9c7241010101000600000800000001e083c4fd"
        fs.mkdirSync("build", { recursive: true });
        fs.writeFileSync(`build/_test_getContractCode.compiled.json`, JSON.stringify({
            hex: boc,
        }));
        let code = getContractCode("_test_getContractCode")
        expect(code.equals(Cell.fromBoc(Buffer.from(boc, 'hex'))[0]))

    });

    it('should test createInternalMsgCell', async () => {
        let addr1 = parseAddress("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj")

        let msg = createInternalMsgCell({
            to: addr1,
            amount: 0n,
            flag: Flags.bounce
        })
        let ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.bounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(0n)
        expect(ds.loadUint(107)).toEqual(0)
        // --------
        msg = createInternalMsgCell({
            to: addr1,
            amount: toNano(11),
            flag: Flags.noBounce,
            payload: beginCell().storeUint(123, 32).endCell()
        })
        ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.noBounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(toNano(11))
        expect(ds.loadUint(107)).toEqual(1)
        let pl = ds.loadRef().beginParse()
        expect(pl.loadUint(32)).toEqual(123)
        // --------
        msg = createInternalMsgCell({
            to: addr1,
            amount: 0n,
            payload: beginCell().storeUint(123, 32).endCell().beginParse()
        })
        ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.bounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(0n)
        expect(ds.loadUint(107)).toEqual(0)
        expect(ds.loadUint(32)).toEqual(123)
        // --------
        let boc = Cell.fromBoc(Buffer.from("b5ee9c7241010101000600000800000001e083c4fd", 'hex'))[0]
        msg = createInternalMsgCell({
            to: addr1,
            amount: 0n,
            payload: beginCell().storeUint(123, 32).endCell(),
            stateInit: boc
        })
        ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.bounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(0n)
        expect(ds.loadUint(108)).toEqual(7)
        expect(ds.loadRef().equals(boc)).toBeTruthy()
        pl = ds.loadRef().beginParse()
        expect(pl.loadUint(32)).toEqual(123)

    });
});

