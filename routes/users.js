import express from "express";
import supabase from "../supabase.js";
import bcrypt from "bcrypt";
const saltRounds = 2;
const usersRoute = express.Router();

usersRoute.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select(`
        username, name, isAdmin`);
    if (error) return res.status(500).send(data);
    res.status(200).send(data);
  } catch (error) {
    res.status(500);
  }
});

usersRoute.post("/", async (req, res) => {
  let { username, password, name, isAdmin } = req.body;

  if (!username && !password && isAdmin && name) {
    return res.status(400).send("missing arguments");
  }

  async function hashPassword(password) {
    return await bcrypt.hash(password, saltRounds);
  }

  password = await hashPassword(password);
  try {
    const { data, error } = await supabase.from("users").insert({
      username: username,
      name: name,
      password: password,
      isAdmin: isAdmin,
    });
    if (error) return res.status(500);
    res.status(200).send("Usuario cadastrado com sucesso!");
  } catch (error) {
    res.status(500);
  }
});

usersRoute.patch("/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send("missing args");
  }
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return res.status(500).send(error);
    res.status(200).send(`O usuario ID:${id} foi deletado com sucesso!`);
  } catch (err) {
    res.status(500);
  }
});
export default usersRoute;
