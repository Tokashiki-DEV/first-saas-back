import express from "express";
import supabase from "../supabase.js";

const sallesRoute = express.Router();

sallesRoute.get("/", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from("salles")
      .select(
        `
          id,
          created_at,
          product_id,
          barber_id,
          client_id,
          quantity,
          price,
          clients(name),
          products(name, quantity, brand)
          `
      )
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

    const formattedData = data.map(({ clients, products, ...item }) => ({
      ...item,
      client_name: clients?.name,
      product_name: products?.name,
      product_brand: products?.brand,
    }));

    res.status(200).send(formattedData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

sallesRoute.post("/", async (req, res) => {
  const { product_id, quantity } = req.body;
  const body = req.body;
  try {
    const salles = Array.isArray(body) ? body : [body];

    if (salles.length === 0) {
      return res.status(400).send({ error: "missing arguments" });
    }

    const { error } = await supabase
      .from("salles")
      .insert(Array.isArray(salles) ? salles : [salles]);

    // const { data, error } = await supabase.from("salles").insert({
    //   product_id: product_id,
    //   barber_id: barber_id,
    //   client_id: client_id,
    //   price: price,
    //   quantity: quantity,
    // });

    const { error2 } = await supabase.rpc("decrement", {
      column_name: "quantity",
      row_id: product_id,
      decrement_value: quantity,
    });

    if (error) {
      return res.status(500).send({ error: error.message });
    }
    if (error2) {
      return res.status(500).send({ error: error.message });
    }

    res.status(201).send("Venda(s) cadastra(s) com sucesso!");
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

sallesRoute.patch("/", async (req, res) => {
  const { name, category, brand, quantity, id, price } = req.body;
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

sallesRoute.patch("/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).send("missing id");
  }
  try {
    const { error } = await supabase.from("salles").delete().eq("id", id);

    if (error) {
      res.status(500).send(error);
    }
    res.status(200).send(`A venda ID:${id} foi deletado`);
  } catch (error) {
    res.status(500);
  }
});
export default sallesRoute;
