import '@ton/test-utils';
import {toRevStr} from "../src/utils";

describe('Utils', () => {
    describe('toRevStr', () => {
        it('work with empty string', async () => {
            expect(toRevStr('')).toEqual('');
        });

        it('work with full string', async () => {
            expect(toRevStr('1234567890')).toEqual('0987654321');
        });

        it('should produce same result applying 2 times', async () => {
            expect(toRevStr(toRevStr('1234567890'))).toEqual('1234567890');
        });
    });
});

