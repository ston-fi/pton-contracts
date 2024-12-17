import '@ton/test-utils';
import { SandboxGraph } from '../src/graph';
// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString(); };
describe('Graph', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should test flattenDisplayLabel', async () => {
        let g = new SandboxGraph({})
        expect(g["flattenDisplayLabel"]("test1<br/>test2<br>test3\ntest4<br/>test5<br/>test6")).toEqual("test1 test2 test3 test4 test5 test6")
    });

});

