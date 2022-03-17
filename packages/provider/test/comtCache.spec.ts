import CancellationToken from "../src/cancellationToken";

describe("CancellationToken", () => {
    describe("register", () => {
        it("should call subscriber when cancel is called", () => {
            const token = new CancellationToken();
            const func = jest.fn();

            token.register(func);
            token.cancel();

            expect(func).toBeCalledTimes(1);
        });
    });

    describe("unregister", () => {
        it("should remove subscriber", () => {
            const token = new CancellationToken();
            const func = jest.fn();

            token.register(func);
            token.unregister(func);
            token.cancel();

            expect(func).toBeCalledTimes(0);
        });
    });
});
