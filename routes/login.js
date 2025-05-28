import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../supabase.js";

const loginRoute = express.Router();

// const users = [
//   {
//     id: 1,
//     username: "user1",
//     password: "JFBarber1234",
//     name: "Lucas",
//     isAdmin: true,
//   },
//   {
//     id: 2,
//     username: "user2",
//     password: "JFBarber1234",
//     name: "Marcos",
//     isAdmin: true,
//   },
//   {
//     id: 3,
//     username: "jose",
//     password: "JFBarber1234",
//     name: "José",
//     isAdmin: true,
//   },
//   {
//     id: 4,
//     username: "fernando",
//     password: "Barbeiro90",
//     name: "Fernando",
//     isAdmin: true,
//   },
//   {
//     id: 5,
//     username: "barbeiro",
//     password: "barbeiro1234",
//     name: "Barbeiro",
//     isAdmin: false,
//   },
// ];

const secretKey = "secret";

loginRoute.post("/", async (req, res) => {
  async function comparePassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("missing arguments");
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("username", username);

    if (error) {
      return res.status(500).send(error);
    }

    const passwordVerify = await comparePassword(password, data[0].password);
    if (passwordVerify) {
      const token = jwt.sign(
        { userId: data[0].id, username: data[0].username },
        secretKey,
        { expiresIn: "365D" }
      );

      return res
        .status(200)
        .json({ token: token, name: data[0].name, isAdmin: data[0].isAdmin });
    }
    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    return res.status(500).send("internal error");
  }
});

export default loginRoute;
