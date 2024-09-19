import '@ton/test-utils';
import * as parser from "../src/parser/confParser";
import { parseOpFromStr, parseErrorsFromStr } from '../src/codes';

describe('Parser', () => {

    const ops = `
;; project OPs
const op::mint_nft = "mint_nft"c;  ;; 0xbba6cbca
const op::get_storage_data = "get_storage_data"c; ;; 0x5b88e5cc
const op::report_storage_data = "report_storage_data"c; ;; 0xaab4a8ef

const op::send_raw_msg = "send_raw_msg"c; ;; 0xbc2d127b

;; exit codes
const error::insufficient_gas = 83;
`

    const errors = `
const error::insufficient_gas = 83;
const error::invalid_address = 84;
const error::low_amount = 87;
const error::invalid_amount = 89;
const error::wrong_workchain = 85;
const error::invalid_body = 90; ;; test

const error::wrong_op = 0xFFFF;
`

    const ops2 = `
const op::ton_transfer    = "ton_transfer query_id:uint64 ton_amount:Coins refund_address:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody"c & 0x7fffffff;
const op::reset_gas       = "reset_gas query_id:uint64 = InternalMsgBody"c & 0x7fffffff; ;; test
`

    const sameErrors = `
const error::insufficient_gas = 83;
const error::invalid_address = 83;
`

    const sameOps = `
;; project OPs
const op::mint_nft = "mint_nft"c;
const op::get_storage_data = "mint_nft"c; 
`

    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should parse ops', async () => {
        const entries = parser.parse(ops);
        expect(entries).not.toBe([])
        expect(entries[0]).toStrictEqual({ type: 'op', key: 'mint_nft', val: 0xbba6cbca })
    });

    it('should parse errors', async () => {
        const entries2 = parser.parse(errors);
        expect(entries2).not.toBe([])
        expect(entries2[0]).toStrictEqual({ type: 'error', key: 'insufficient_gas', val: 83 })
    });

    it('should parse ops with expressions', async () => {
        const entries3 = parser.parse(ops2);
        expect(entries3).not.toBe([])
        expect(entries3[0]).toStrictEqual({ type: 'op', key: 'ton_transfer', val: "0x1f3835d" })
    });


    it('should test parseOpFromStr', async () => {
        const entries = parseOpFromStr(ops + '\n' + ops2);
        expect(entries).not.toBe({})
        expect(entries).toStrictEqual({
            mint_nft: 0xbba6cbca,
            get_storage_data: 0x5b88e5cc,
            report_storage_data: 0xaab4a8ef,
            send_raw_msg: 0xbc2d127b,
            reset_gas: 0x29d22935,
            ton_transfer: 0x01f3835d,
        })
    });

    it('should fail parseOpFromStr with same value', async () => {
        expect(() => { parseOpFromStr(sameOps) }).toThrow("value '3148270538' defined twice")
    });
    
    it('should test parseErrorsFromStr', async () => {
        const entries2 = parseErrorsFromStr(errors);
        expect(entries2).not.toBe({})
        expect(entries2).toStrictEqual({
            insufficient_gas: 83,
            invalid_address: 84,
            low_amount: 87,
            invalid_amount: 89,
            wrong_workchain: 85,
            invalid_body: 90,
            wrong_op: 65535
        })
    });
    
    it('should fail parseErrorsFromStr with same value', async () => {
        expect(() => { parseErrorsFromStr(sameErrors) }).toThrow("value '83' defined twice")
    });
});

