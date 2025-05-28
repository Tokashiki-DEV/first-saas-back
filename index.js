import express from "express";
import bodyParser from "body-parser";
import clientesRoute from "./routes/clientes.js";
import produtosRoute from "./routes/produtos.js";
import barbeiroRoute from "./routes/barbeiros.js";
import haircutRoute from "./routes/haircuts.js";
import dashboardRoute from "./routes/dashboard.js";
import loginRoute from "./routes/login.js";
import authenticateToken from "./middlewares/tokenVerify.js";
import cors from "cors";
import sallesRoute from "./routes/salles.js";
import usersRoute from "./routes/users.js";

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use("/login", loginRoute);
app.use("/users", authenticateToken, usersRoute);
app.use("/vendas", authenticateToken, sallesRoute);
app.use("/produtos", authenticateToken, produtosRoute);
app.use("/clientes", authenticateToken, clientesRoute);
app.use("/barbeiros", authenticateToken, barbeiroRoute);
app.use("/haircuts", authenticateToken, haircutRoute);
app.use("/dashboard", authenticateToken, dashboardRoute);

app.get("/", (req, res) => {
  res.send("Bem vindo");
});

app.listen(
  {
    host: "0.0.0.0",
    port: process.env.API_ENDPOINT,
  },
  () => {
    console.log("Server Running on " + process.env.API_ENDPOINT);
  }
);
