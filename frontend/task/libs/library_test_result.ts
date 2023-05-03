export class LibraryTestResult {
    public type?: string;
    public message: string;
    public successRate: number;
    public props: any;

    public constructor(message: string, type?: string, props: unknown = {}, successRate: number = undefined) {
        this.type = type;
        this.message = message;
        this.props = props;
        this.successRate = successRate;
    }

    public getMessage(): string {
        return this.message;
    }

    public getType(): string {
        return this.type;
    }

    public serialize() {
        return {
            type: this.type,
            message: this.message,
            successRate: this.successRate,
            props: this.props,
        };
    }

    public static unserialize(data: any): LibraryTestResult {
        return new this(data.message, data.type, data.props, data.successRate);
    }

    public static fromString(message: string) {
        return new this(message);
    }
}
