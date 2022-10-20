function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    // jwt authentication error
    //return res.status(401).json({message: "The user is not authorized"})
    return res
      .status(400)
      .send({ success: false, message: "Session Expired." });
  }

  if (err.name === "ValidationError") {
    //  validation error
    return res.status(401).json({ success: false, message: err.message });
  }
  if (err.status === 403) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: err.message ? err.message : "Not found",
    });
  }

  if (err.status === 422) {
    return res.status(422).json({
      success: false,
      message: err.message ? err.message : "Not valid data",
    });
  }
  if (err.status === 409) {
    return res.status(409).json({
      success: false,
      message: err.message ? err.message : "Not valid data",
    });
  }

  // default to 500 server error
  return res.status(500).json({ success: false, message: err.message });
}

module.exports = errorHandler;
