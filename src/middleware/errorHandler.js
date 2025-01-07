const errorHandler = (err, req, res, next) => {
    const name = err.name || 'Error';
    const statusCode = name === "TokenExpiredError" ? 401 : err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    console.log(name, statusCode, message);
    res.status(statusCode).json({ name, message });
};

module.exports = errorHandler;
