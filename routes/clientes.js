import express from "express";
import supabase from "../supabase.js";

const clientesRoute = express.Router();

clientesRoute.get("/", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from("clients")
      .select()
      .order("created_at", { ascending: false });

    if (start_date && end_date) {
      query = query.gte("created_at", start_date).lte("created_at", end_date);
    } else if (start_date) {
      query = query.gte("created_at", start_date);
    } else if (end_date) {
      query = query.lte("created_at", end_date);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).send({ error: error.message });
    }

    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

clientesRoute.patch("/delete", async (req, res) => {
  const { id } = req.body;
  if (id == undefined) {
    res.status(400).send("Missing id or value");
  }
  try {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("client_id", id);
    res.status(200).send(`O usuario ID:${id} foi deletado`);
  } catch (error) {
    res.status(500);
  }
});

clientesRoute.patch("/", async (req, res) => {
  const { id, name, email, phone } = req.body;
  if (id == undefined) {
    res.status(400).send("Missing id");
  }
  if (name == undefined && phone == undefined && email == undefined) {
    res.status(400).send("Missing arguments");
  }
  try {
    const { data, error } = await supabase
      .from("clients")
      .update({
        name: name,
        email: email,
        phone: phone,
      })
      .eq("client_id", id);
    res.status(200).send(`O usuario ${name} foi adicionado`);
  } catch (error) {
    res.status(500);
  }
});

clientesRoute.post("/", async (req, res) => {
  const cliente = req.body;
  if (cliente == undefined) {
    res.status(400);
  }
  try {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: cliente.name,
        phone: cliente.phone,
        email: cliente.email ?? null,
      })
      .select();
    res.status(201).send(`${data[0].client_id}`);
  } catch (error) {
    res.status(500);
  }
});

export default clientesRoute;
