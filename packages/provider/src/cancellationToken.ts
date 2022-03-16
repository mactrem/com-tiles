export type Callback = () => void;

export default class CancellationToken {
    private readonly abortRequests: Callback[] = [];

    cancel(): void {
        this.abortRequests.forEach((abortRequest) => abortRequest());
    }

    register(callback: Callback): void {
        this.abortRequests.push(callback);
    }

    unregister(callback: Callback) {
        const index = this.abortRequests.indexOf(callback);
        this.abortRequests.splice(index, 1);
    }
}
