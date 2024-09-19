import '@ton/test-utils';
import { findArgs, isArgPresent } from '../src/cli-utils';

describe('Cli', () => {

    it('should test findArgs', async () => {
        let testArr = [
            "123",
            "456",
            "test1",
            "test2",
            "789"
        ]
        let ind = findArgs(testArr, ["test1"]);
        expect(ind).toEqual(2);
    });

    it('should test findArgs unstrict', async () => {
        let testArr = [
            "123",
            "456",
            "test1",
            "test2",
            "789"
        ]
        let ind = findArgs(testArr, ["test"], false);
        expect(ind).toEqual(2);
    });

    it('should test findArgs unstrict second part of arg', async () => {
        let testArr = [
            "123",
            "456",
            "cat",
            "dog_test",
            "789"
        ]
        let ind = findArgs(testArr, ["test"], false);
        expect(ind).toEqual(3);
    });

    it('should test isArgPresent', async () => {
        let testArr = [
            "123",
            "456",
            "test1",
            "test2",
            "789"
        ]
        let f1 = isArgPresent(testArr, "test1")
        expect(f1).toBeTruthy()
        f1 = isArgPresent(testArr, "qwerty")
        expect(f1).toBeFalsy()
    });
});

