import '@ton/test-utils';
import { Address } from '@ton/core';
import { HOLE_ADDRESS, isHole, padRawHexAddress, parseAddress, rawNumberToAddress } from "../src/address";
import { MdColumn, MdTable } from '../src/table';
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString(); };
describe('Table', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    // it('wip', async () => {

    //     let table = new MdTable(
    //         {
    //             text: "012345678901234567890123456789012345678901234567890123456789",
    //             splitLength: 20,
    //             defaultEntryStyle: {
    //                 splitLength: 10
    //             }
    //         } satisfies MdColumn,
    //         {
    //             text: "2",
    //             defaultEntryStyle: {
    //                 splitLength: 20
    //             }
    //         } satisfies MdColumn, 
    //         "3"
    //     )
    //     table.lineLen = 15
    //     table.addEntry("012345678901234567890123456789", "012345678901234567890123456789", "012345678901234567890123456789")
    //     table.addEntry({
    //         text: "012345678901234567890123456789",
    //         splitLength: 5,
    //     }, "012345678901234567890123456789", "012345678901234567890123456789")
    //     let res = table.render()
    //     console.log(res)
    // });

    it('should create simple table without styles', async () => {
        let table = new MdTable(
            "1",
            "2", 
            "3"
        )
        table.addEntry("123", "456", "789")
        let res = table.render()
        expect(res).toEqual("| 1 | 2 | 3 |\n| --- | --- | --- |\n| 123 | 456 | 789 |\n")
    });

    it('should split line', async () => {
        let table = new MdTable(
            "1",
            "2", 
            "3"
        )
        table.lineLen = 48
        table.addEntry("EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afOEQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afOEQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO", "456", "789")
        let res = table.render()
        expect(res).toEqual("| 1 | 2 | 3 |\n| --- | --- | --- |\n| EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO<br>EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO<br>EQADfRoXJun3Brxwn8oeUkVc_etbUMnmWu46EOsCMn9W5afO | 456 | 789 |\n")
    });

    it('should create simple table with header style', async () => {
        let table = new MdTable(
            {
                text: "1",
                highlight: "italic",
                color: "red",
            } satisfies MdColumn,
            {
                text: "2",
                isCode: true
            } satisfies MdColumn, 
            "3"
        )
        table.addEntry("123", "456", "789")
        let res = table.render()
        expect(res).toEqual('| <span style="color:red">*1*</span> | `2` | 3 |\n| --- | --- | --- |\n| 123 | 456 | 789 |\n')
    });

    it('should create table with default highlight', async () => {
        let table = new MdTable(
            {
                text: "1",
                defaultEntryStyle: {
                    highlight: "bold",
                }
            } satisfies MdColumn,
            "2", 
            "3"
        )
        table.addEntry("123", "456", "789")
        table.addEntry("123", "456", "789")
        let res = table.render()
        expect(res).toEqual(`| 1 | 2 | 3 |\n| --- | --- | --- |\n| **123** | 456 | 789 |\n| **123** | 456 | 789 |\n`)
    });

    it('should create table with default color', async () => {
        let table = new MdTable(
            {
                text: "1",
                defaultEntryStyle: {
                    color: "red"
                }
            } satisfies MdColumn,
            "2", 
            "3"
        )
        table.addEntry("123", "456", "789")
        table.addEntry("123", "456", "789")
        let res = table.render()
        expect(res).toEqual(`| 1 | 2 | 3 |\n| --- | --- | --- |\n| <span style="color:red">123</span> | 456 | 789 |\n| <span style="color:red">123</span> | 456 | 789 |\n`)
    });

    it('should create table with default highlight and color', async () => {
        let table = new MdTable(
            {
                text: "1",
                defaultEntryStyle: {
                    highlight: "bold",
                    color: "red"
                }
            } satisfies MdColumn,
            "2", 
            "3"
        )
        table.addEntry("123", "456", "789")
        table.addEntry("123", "456", "789")
        let res = table.render()
        expect(res).toEqual(`| 1 | 2 | 3 |\n| --- | --- | --- |\n| <span style="color:red">**123**</span> | 456 | 789 |\n| <span style="color:red">**123**</span> | 456 | 789 |\n`)
    });

    it('should add entry with style', async () => {
        let table = new MdTable(
            {
                text: "1",
                defaultEntryStyle: {
                    highlight: "bold",
                    color: "red"
                }
            } satisfies MdColumn,
            {
                text: "2",
                defaultEntryStyle: {
                    isCode: true
                }
            } satisfies MdColumn, 
            "3"
        )
        table.addEntry(
            {
                text: "123",
                highlight: null,
                color: "blue"
            }, 
            {
                text: "456",
                color: "green"
            }, 
            {
                text: "789",
                highlight: "bold",
                color: "cyan"
            },)
        table.addEntry("123", "456", "789")
        let res = table.render()
        expect(res).toEqual('| 1 | 2 | 3 |\n| --- | --- | --- |\n| <span style="color:blue">123</span> | <span style="color:green">456</span> | <span style="color:cyan">**789**</span> |\n| <span style="color:red">**123**</span> | `456` | 789 |\n')
    });

    it('should toString strip styles', async () => {
        let table = new MdTable(
            {
                text: "1",
                defaultEntryStyle: {
                    highlight: "bold",
                    color: "red"
                }
            } satisfies MdColumn,
            {
                text: "2",
                defaultEntryStyle: {
                    isCode: true
                }
            } satisfies MdColumn, 
            "3"
        )
        table.addEntry(
            {
                text: "123",
                highlight: null,
                color: "blue"
            }, 
            {
                text: "456",
                color: "green"
            }, 
            {
                text: "789",
                highlight: "bold",
                color: "cyan"
            },)
        table.addEntry("123", "456", "789")
        let res = table.toString()
        expect(res).toEqual("| 1 | 2 | 3 |\n| --- | --- | --- |\n| 123 | 456 | 789 |\n| 123 | 456 | 789 |\n")
    });



});

