import '@ton/test-utils';
import { colorText, decolorText, loggerBuilder } from "../src/color";

describe('Color', () => {

    it('should color text', async () => {
        expect(colorText('<r>Red <b>blue')).toEqual(["\x1b[31mRed \x1b[34mblue\x1b[0m"]);
    });

    it('should decorate text', async () => {
        expect(colorText('<bld><r>Red and bold <clr><y>yellow')).toEqual(["\x1b[1m\x1b[31mRed and bold \x1b[0m\x1b[33myellow\x1b[0m"]);
    });

    it('should work with multiple strings', async () => {
        expect(colorText('<r>Red <b>blue', '<bld><r>Red and bold <clr><y>yellow')).toEqual([
            "\x1b[31mRed \x1b[34mblue\x1b[0m",
            "\x1b[1m\x1b[31mRed and bold \x1b[0m\x1b[33myellow\x1b[0m",
        ]);
    });

    it('should remove color from text', async () => {
        expect(decolorText('<r>Red <b>blue')).toEqual(["Red blue"]);
    });

    it('should remove decoration from text', async () => {
        expect(decolorText('<bld><r>Red and bold <clr><y>yellow')).toEqual(["Red and bold yellow"]);
    });

    it('should remove decorate from multiple strings', async () => {
        expect(decolorText('<r>Red <b>blue', '<bld><r>Red and bold <clr><y>yellow')).toEqual([
            "Red blue",
            "Red and bold yellow",
        ]);
    });

    it('should work with loggerBuilder', () => {
        const prevEnv = process.env.STON_CONTRACTS_LOGGER_DISABLED
        process.env.STON_CONTRACTS_LOGGER_DISABLED = 'false'
        const writeCallback = jest.fn();

        const provider = {
            ui() {
                return {
                    write: writeCallback,
                } as any;
            }
        }

        const logger = loggerBuilder(provider);

        logger('<r>Red <b>blue');

        expect(writeCallback).toHaveBeenCalled();
        expect(writeCallback).toHaveBeenCalledTimes(1);
        expect(writeCallback).toHaveBeenCalledWith("\x1b[31mRed \x1b[34mblue\x1b[0m");

        logger('<bld><r>Red and bold <clr><y>yellow');

        expect(writeCallback).toHaveBeenCalled();
        expect(writeCallback).toHaveBeenCalledTimes(2);
        expect(writeCallback).toHaveBeenCalledWith("\x1b[1m\x1b[31mRed and bold \x1b[0m\x1b[33myellow\x1b[0m");
        process.env.STON_CONTRACTS_LOGGER_DISABLED = prevEnv
    });
});

