module.exports = (error, res) => {
  console.log(error.message);
  res.status(500).json({
    error: "Something went wrong",
  });
};
