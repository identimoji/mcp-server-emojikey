// Error class for emojikey-specific errors
export class EmojikeyError extends Error {
    constructor(message) {
        super(message);
        this.name = "EmojikeyError";
    }
}
