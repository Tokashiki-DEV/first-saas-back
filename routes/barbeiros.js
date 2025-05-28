import express from "express";
import supabase from "../supabase.js";

const barbeiroRoute = express.Router();

barbeiroRoute.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("barbers").select();
    if (error) throw error;
    res.status(200).send(data);
  } catch (error) {
    res.status(500);
  }
});

barbeiroRoute.get("/fee", async (req, res) => {
  try {
    const { data, error } = await supabase.from("variables").select();
    if (error) throw error;
    res.status(200).send(data);
  } catch (error) {
    res.status(500);
  }
});

barbeiroRoute.patch("/fee", async (req, res) => {
  const { id, value } = req.body;
  if (id == undefined || value == undefined) {
    res.status(400).send("Missing id or value");
  }
  try {
    const { data, error } = await supabase
      .from("variables")
      .update({
        value: value,
      })
      .eq("id", id);
    res.status(200).send(data);
  } catch (err) {
    res.status(500);
  }
});

barbeiroRoute.patch("/delete", async (req, res) => {
  const { id } = req.body;
  if (id == undefined) {
    res.status(400).send("Missing id");
  }
  try {
    const { error } = await supabase
      .from("barbers")
      .delete()
      .eq("barber_id", id);
    res.status(200).send(`O barbeiro ID:${id} foi deletado com sucesso!`);
  } catch (err) {
    res.status(500);
  }
});

barbeiroRoute.patch("/", async (req, res) => {
  const { id, name } = req.body;
  if (id == undefined || name == undefined) {
    res.status(400).send("Missing id or name");
  }
  try {
    const { error } = await supabase
      .from("barbers")
      .update({
        name: name,
      })
      .eq("barber_id", id);
    res
      .status(201)
      .send(`O Barbeiro ${name} ID:${id} foi atualizado com sucesso!`);
  } catch (err) {
    res.status(500);
  }
});

barbeiroRoute.post("/", async (req, res) => {
  const { name } = req.body;
  if (name == undefined) {
    res.status(400).send("Missing id or name");
  }
  try {
    const { error } = await supabase.from("barbers").insert({ name: name });
    if (error) throw error;
    res.status(201).send(`Barbeiro ${name} cadastrado com sucesso!`);
  } catch (error) {
    res.status(500);
  }
});

export default barbeiroRoute;
