const errorHandling = (statusCode, next, errorString) => {
    const error = new Error(errorString);
    error.statusCode = statusCode ? statusCode : 200;
    next(error);
}

module.exports = errorHandling;