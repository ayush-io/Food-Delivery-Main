const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Stripe } = require("stripe");
const dotenv = require("dotenv").config();

const app = express();
const corsOptions = {
  origin: "*",
  credentials: true,
  headers: [
    "X-Requested-With",
    "X-Auth-Token",
    "Content-Type",
    "Content-Length",
    "Authorization",
    "Access-Control-Allow-Headers",
    "Accept",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
    "Content-Security-Policy",
  ],
  methods: ["GET", "POST", "PUTs"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Access-Control-Allow-Headers, Content-Type, Authorization, Origin, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const PORT = process.env.PORT || 8080;

// Connect to MongoDB database
console.log(process.env.MONGODB_URL);
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log(`Connected to MongoDB`))
  .catch((err) => console.log(err));

//schema
const userSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});

//model
const userModel = mongoose.model("user", userSchema);

//api
app.get("/", (req, res) => {
  res.send("Server is running");
});

//signup
app.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (user) {
      res.send({ message: "Email id is already registered", alert: false });
    } else {
      const data = new userModel(req.body);
      const savedData = await data.save();
      res.send({ message: "Successfully signed up", alert: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error", alert: false });
  }
});

//api login
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (user) {
      const dataSend = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
      };
      // console.log(dataSend);
      res.send({
        message: "Login is successful",
        alert: true,
        data: dataSend,
      });
    } else {
      res.send({
        message: "Email is not available, please sign up",
        alert: false,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Internal Server Error",
      alert: false,
    });
  }
});

//product section
const schemaProduct = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  description: String,
});
const productModel = mongoose.model("product", schemaProduct);

//save product in data
//api
app.post("/uploadProduct", async (req, res) => {
  // Set CORS headers
  // res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  // res.header("Access-Control-Allow-Credentials", true);
  console.log("------------------------------");
  console.log(req.body);
  const data = await productModel(req.body);
  const datasave = await data.save();
  res.send({ message: "Upload Successfully" });
});

app.get("/product", async (req, res) => {
  // Set CORS headers for this route
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", true);

  const data = await productModel.find({});
  res.send(JSON.stringify(data));
});

app.get("/users", async (req, res) => {
  // Set CORS headers for this route
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", true);

  const data = await userModel.find({});
  res.send(JSON.stringify(data));
});

/*****payment getWay */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  // res
  // .set(
  //   "Content-Security-Policy",
  //   "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  // )
  // .send("<html><head></head><body></body></html>");
  res.set("Content-Security-Policy", "script-src 'self' 'unsafe-inline';");

  if (!Array.isArray(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  try {
    const params = {
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      // shipping_options: [{ shipping_rate: "shr_1OD0sDSBiTGeTWlnOtZi5bDZ" }],

      line_items: req.body.map((item) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
              // images : [item.image]
            },
            unit_amount: item.price * 100,
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
          },
          quantity: item.qty,
        };
      }),

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    };

    const session = await stripe.checkout.sessions.create(params);
    console.log(session);
    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error(err);
    res
      .status(err.statusCode || 500)
      .json({ error: err.message, stack: err.stack });
  }
});

//server is running
app.listen(PORT, () => console.log("server is running at port :" + PORT));
