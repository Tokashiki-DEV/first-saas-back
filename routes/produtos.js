import express from "express";
import supabase from "../supabase.js";

const produtosRoute = express.Router();

produtosRoute.post("/", async (req, res) => {
  const { name, price, category, brand, quantity } = req.body;
  if (!name || !price || !category || !brand) {
    res.status(400).send("missing arguments");
  }
  try {
    const { error } = await supabase.from("products").insert({
      name: name,
      price: price,
      category: category,
      brand: brand,
      quantity: quantity,
    });
    if (error) {
      res.status(500);
    }
  } catch (error) {
    res.status(500);
  }

  res.status(201).send("Produto cadastrado com sucesso!");
});

produtosRoute.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select();
    res.status(200).send(data);
    if (error) {
      res.status(500);
    }
  } catch (error) {
    res.status(500);
  }
});

produtosRoute.patch("/", async (req, res) => {
  const { id, name, price, category, brand, quantity } = req.body;
  if (id == undefined) {
    res.status(400).send("missing Id");
  }
  if (!name && !price && !category && !brand && !quantity) {
    res.status(400).send("missing arguments");
  }
  try {
    const { error } = await supabase
      .from("products")
      .update({
        name: name,
        price: price,
        category: category,
        brand: brand,
        quantity: quantity,
      })
      .eq("id", id);

    if (error) {
      res.status(500).send(error);
    }
    res.status(200).send(`O produto ID:${id} foi alterado`);
  } catch (err) {
    res.status(500);
  }
});

produtosRoute.patch("/delete", async (req, res) => {
  const { id } = req.body;
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      res.status(500).send(error);
    }
    res.status(200).send(`O produto ID:${id} foi deletado`);
  } catch (error) {
    res.status(500);
  }
});
export default produtosRoute;
