class AppError extends Error {
    constructor({ name, statusCode, message, isOperational }) {
        super(message);

        this.name = name || 'Error';
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational !== undefined ? isOperational : true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
