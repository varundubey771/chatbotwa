//========================================================================================
/*                                                                                      *
 *                          ALl the imports                                             *
 *                                                                                      */
//========================================================================================
// make sure to pass the NODE_ENV variable alongwith the command
const express = require("express");
const bodyParser = require("body-parser");
const { connect } = require("./Database/conn");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
//########################################################################################

//========================================================================================
/*                                                                                      *
 *                                All the configurations                                *
 *                                                                                      */
//========================================================================================
const app = express();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(require("./Middleware/verifyToken.middleware"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);

app.use("/api", require("./routes"));

//########################################################################################

//========================================================================================
/*                                                                                      *
 *                                   Start the server                                   *
 *                                                                                      */
//========================================================================================

if (PORT !== 8080) {
  app.use(express.static(path.join(__dirname, "client", "build")));
  app.use("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
}

app.listen(PORT, async () => {
  console.log(`listening on port ${PORT}`);

  // connect to mongodb
  try {
    await connect();
  } catch (error) {
    console.log(error);
  }
});
//########################################################################################
