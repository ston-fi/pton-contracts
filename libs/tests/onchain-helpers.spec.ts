import '@ton/test-utils';
import { awaitConfirmation, getSeqNo, runWithRetry, waitForDeploy, waitSeqNoChange } from "../src/onchain-helper";
import { type NetworkProvider } from "@ton/blueprint";
import { randomAddress } from "@ton/test-utils";
import { TupleBuilder, TupleReader } from "@ton/core";

jest.useFakeTimers();

function createNetworkProviderMock() {
    const api = {
        runMethod: jest.fn(),
        getContractState: jest.fn(),
    };

    const ui = {
        write: jest.fn(),
        prompt: jest.fn(),
        inputAddress: jest.fn(),
        input: jest.fn(),
        choose: jest.fn(),
        setActionPrompt: jest.fn(),
        clearActionPrompt: jest.fn(),
    };

    return {
        network: () => 'custom',
        sender: jest.fn(),
        api: jest.fn().mockImplementation(() => api),
        provider: jest.fn(),
        isContractDeployed: jest.fn(),
        waitForDeploy: jest.fn(),
        deploy: jest.fn(),
        open: jest.fn(),
        ui: jest.fn().mockImplementation(() => ui),
    };
}

describe('OnChain Helpers', () => {

    const prevEnv = process.env.STON_CONTRACTS_LOGGER_DISABLED
    beforeAll(async () => {
        process.env.STON_CONTRACTS_LOGGER_DISABLED = 'true'
    });
    afterAll(async () => {
        process.env.STON_CONTRACTS_LOGGER_DISABLED = prevEnv
    });

    describe('runWithRetry', () => {
        it('should run without params', async () => {
            const callback = jest.fn();

            await runWithRetry(callback);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should throw error for wrong maxAttempts param value', async () => {
            const callback = jest.fn();

            const resultCallback = jest.fn();
            const rejectCallback = jest.fn();

            await runWithRetry(callback, {maxAttempts: -1}).then(resultCallback, rejectCallback);

            expect(callback).not.toHaveBeenCalled();
            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).toHaveBeenCalled();
            expect(rejectCallback).toHaveBeenCalledTimes(1);
            expect(rejectCallback).toHaveBeenCalledWith(new Error('maxAttempts must be greater than 0'));
        });

        it('should return function result', async () => {
            const callback = jest.fn().mockReturnValueOnce({result: true, list: [1, 2, 3]});

            const res = await runWithRetry(callback);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);
            expect(res).toEqual({result: true, list: [1, 2, 3]});
        });

        it('should run with start sleep time', async () => {
            const callback = jest.fn();

            const resultCallback = jest.fn();

            runWithRetry(callback, {startSleepTimeout: 1000}).then(resultCallback);

            expect(callback).not.toHaveBeenCalled();
            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(500);

            expect(callback).not.toHaveBeenCalled();
            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(500);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
        });

        it('should run with sleep time', async () => {
            let rejectCount = 2;

            const resultCallback = jest.fn();

            const callback = jest.fn().mockImplementation(() => {
                if (rejectCount > 0) {
                    rejectCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                return Promise.resolve(42);
            });

            runWithRetry(callback, {sleepTimeout: 1000}).then(resultCallback);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);
            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(3000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(3);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(42);
        });

        it('should run with error logging', async () => {
            let rejectCount = 2;

            const loggingCallback = jest.fn();

            const callback = jest.fn().mockImplementation(() => {
                if (rejectCount > 0) {
                    rejectCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                return Promise.resolve(42);
            });

            runWithRetry(callback, {sleepTimeout: 1000, onError: loggingCallback});

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);

            await jest.advanceTimersByTimeAsync(3000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(3);
            expect(loggingCallback).toHaveBeenCalled();
            expect(loggingCallback).toHaveBeenCalledTimes(2);
            expect(loggingCallback).toHaveBeenCalledWith(new Error('Test error'), 1);
            expect(loggingCallback).toHaveBeenCalledWith(new Error('Test error'), 2);
        });

        it('should throw error after max attempts', async () => {
            const resultCallback = jest.fn();
            const rejectCallback = jest.fn();

            const callback = jest.fn().mockImplementation(() => {
                return Promise.reject(new Error('Test error'));
            });

            runWithRetry(callback, {sleepTimeout: 1000}).then(resultCallback, rejectCallback);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);
            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(3000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(3);

            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).toHaveBeenCalled();
            expect(rejectCallback).toHaveBeenCalledTimes(1);
            expect(rejectCallback).toHaveBeenCalledWith(new Error('Test error'));
        });
    });

    describe('getSeqNo', () => {
        it('work with positive case', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            const res = new TupleBuilder();
            res.writeNumber(42);

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(true));
            provider.api().runMethod.mockImplementation(() => {
                return Promise.resolve({
                    stack: new TupleReader(res.build()),
                });
            });

            await getSeqNo(provider as NetworkProvider, address).then(resultCallback);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(1);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(42);
        });

        it('work with undeployed contracts', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            const res = new TupleBuilder();
            res.writeNumber(42);

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(false));

            await getSeqNo(provider as NetworkProvider, address).then(resultCallback);

            expect(provider.api().runMethod).not.toHaveBeenCalled();

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(0);
        });

        it('work with retry', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            const res = new TupleBuilder();
            res.writeNumber(42);

            let failCount = 1;

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(true));
            provider.api().runMethod.mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                return Promise.resolve({
                    stack: new TupleReader(res.build()),
                });
            });

            getSeqNo(provider as NetworkProvider, address).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(1);

            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(100);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(2);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(42);
        });

        it('work with error', async () => {
            const resultCallback = jest.fn();
            const rejectCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            const res = new TupleBuilder();
            res.writeNumber(42);

            let failCount = 5;

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(true));
            provider.api().runMethod.mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                return Promise.resolve({
                    stack: new TupleReader(res.build()),
                });
            });

            getSeqNo(provider as NetworkProvider, address).then(resultCallback, rejectCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(1);

            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(500);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(4);

            expect(resultCallback).not.toHaveBeenCalled();

            expect(rejectCallback).toHaveBeenCalled();
            expect(rejectCallback).toHaveBeenCalledTimes(1);
            expect(rejectCallback).toHaveBeenCalledWith(new Error('Test error'));
        });
    });

    describe('waitSeqNoChange', () => {
        it('work with positive case', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            const res = new TupleBuilder();
            res.writeNumber(42);

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(true));
            provider.api().runMethod.mockImplementation(() => {
                return Promise.resolve({
                    stack: new TupleReader(res.build()),
                });
            });

            waitSeqNoChange(provider as NetworkProvider, address, 41).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().runMethod).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(1);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(true);
        });

        it('work with retry', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            let failCount = 1;
            let sameSeqNoCount = 1;

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(true));
            provider.api().runMethod.mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                if (sameSeqNoCount > 0) {
                    sameSeqNoCount -= 1;

                    const res = new TupleBuilder();
                    res.writeNumber(41);

                    return Promise.resolve(res);
                }

                const res = new TupleBuilder();
                res.writeNumber(42);

                return Promise.resolve({
                    stack: new TupleReader(res.build()),
                });
            });

            waitSeqNoChange(provider as NetworkProvider, address, 41).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().runMethod).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(1);

            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(2);

            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(3);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(true);
        });

        it('work with error', async () => {
            const resultCallback = jest.fn();
            const rejectCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            const res = new TupleBuilder();
            res.writeNumber(42);

            let failCount = 1;

            provider.isContractDeployed.mockImplementation(() => Promise.resolve(true));
            provider.api().runMethod.mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                const res = new TupleBuilder();
                res.writeNumber(41);

                return Promise.resolve({
                    stack: new TupleReader(res.build()),
                });
            });

            waitSeqNoChange(provider as NetworkProvider, address, 41).then(resultCallback, rejectCallback);

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(1);

            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(75000);

            expect(provider.api().runMethod).toHaveBeenCalled();
            expect(provider.api().runMethod).toHaveBeenCalledTimes(75);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(false);

            expect(rejectCallback).not.toHaveBeenCalled();
        });
    });

    describe('awaitConfirmation', () => {
        it('work with positive case', async () => {
            const resultCallback = jest.fn();

            const callback = jest.fn().mockImplementation(() => true);

            awaitConfirmation(callback).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(callback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(1);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(true);
        });

        it('work with retry', async () => {
            const resultCallback = jest.fn();

            let failCount = 2;
            let sameStateCount = 2;

            const callback = jest.fn().mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                if (sameStateCount > 0) {
                    sameStateCount -= 1;
                    return Promise.resolve(false);
                }

                return Promise.resolve(true);
            });

            awaitConfirmation(callback).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(callback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(5000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(5);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(true);
        });

        it('work with error', async () => {
            const resultCallback = jest.fn();
            const rejectCallback = jest.fn();

            let failCount = 2;

            const callback = jest.fn().mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                return Promise.resolve(false);
            });

            awaitConfirmation(callback).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(callback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(74000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(74);

            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledTimes(75);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(false);

            expect(rejectCallback).not.toHaveBeenCalled();
        });
    });

    describe('waitForDeploy', () => {
        it('work with positive case', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            provider.api().getContractState.mockImplementation(() => {
                return Promise.resolve({
                    // "active" | "uninitialized" | "frozen"
                    state: 'active',
                });
            });

            waitForDeploy(provider as NetworkProvider, address).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().getContractState).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(1);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(true);
        });

        it('work with retry', async () => {
            const resultCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            let failCount = 2;
            let sameStateCount = 2;

            provider.api().getContractState.mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                if (sameStateCount > 0) {
                    sameStateCount -= 1;
                    return Promise.resolve({
                        state: 'uninitialized',
                    });
                }

                return Promise.resolve({
                    state: 'active',
                });
            });

            waitForDeploy(provider as NetworkProvider, address).then(resultCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().getContractState).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(1);

            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(2);

            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(3000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(5);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(true);
        });

        it('work with error', async () => {
            const resultCallback = jest.fn();
            const rejectCallback = jest.fn();

            const provider = createNetworkProviderMock();
            const address = randomAddress();

            let failCount = 2;

            provider.api().getContractState.mockImplementation(() => {
                if (failCount > 0) {
                    failCount -= 1;
                    return Promise.reject(new Error('Test error'));
                }

                return Promise.resolve({
                    state: 'uninitialized',
                });
            });

            waitForDeploy(provider as NetworkProvider, address).then(resultCallback, rejectCallback);

            await jest.advanceTimersByTimeAsync(1);

            expect(provider.api().getContractState).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(1);

            expect(resultCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(73000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(74);

            expect(resultCallback).not.toHaveBeenCalled();
            expect(rejectCallback).not.toHaveBeenCalled();

            await jest.advanceTimersByTimeAsync(1000);

            expect(provider.api().getContractState).toHaveBeenCalled();
            expect(provider.api().getContractState).toHaveBeenCalledTimes(75);

            expect(resultCallback).toHaveBeenCalled();
            expect(resultCallback).toHaveBeenCalledTimes(1);
            expect(resultCallback).toHaveBeenCalledWith(false);

            expect(rejectCallback).not.toHaveBeenCalled();
        });
    })

});

