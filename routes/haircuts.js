import express from "express";
import supabase from "../supabase.js";
import { formatInTimeZone } from "date-fns-tz";

const haircutRoute = express.Router();

haircutRoute.get("/", async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let haircutQuery = supabase
      .from("haircuts")
      .select(
        `
        haircut_id,
        haircut_type,
        haircut_price,
        datetime,
        barber_id,
        client_id,
        clients(name,phone)
        `
      )
      .order("haircut_id", { ascending: false });
    if (start_date && end_date) {
      haircutQuery = haircutQuery
        .gte("datetime", start_date)
        .lte("datetime", end_date);
    } else if (start_date) {
      haircutQuery = haircutQuery.gte("datetime", start_date);
    } else if (end_date) {
      haircutQuery = haircutQuery.lte("datetime", end_date);
    }

    const { data: haircuts, error: haircutError } = await haircutQuery;
    if (haircutError) {
      return res.status(500).send({ error: haircutError.message });
    }

    const { data: barberData, error: barberError } = await supabase
      .from("barbers")
      .select("barber_id, name")
      .order("barber_id", { ascending: false });

    if (barberError) {
      return res.status(500).send({ error: barberError.message });
    }
    const clientHaircuts = haircuts.reduce((acc, item) => {
      const { client_id, clients, haircut_price } = item;
      if (!acc[client_id]) {
        acc[client_id] = {
          client_id,
          name: clients.name,
          haircut_quantity: 0,
          haircut_totalSpend: 0,
        };
      }
      acc[client_id].haircut_quantity += 1;
      acc[client_id].haircut_totalSpend += haircut_price;
      return acc;
    }, {});

    const transformedData = haircuts.map((item) => {
      const barber = barberData.find((b) => b.barber_id === item.barber_id);

      return {
        haircut_id: item.haircut_id,
        haircut_type: item.haircut_type,
        haircut_price: item.haircut_price,
        datetime: item.datetime,
        client_id: item.client_id || "N/A",
        barber_id: item.barber_id,
        barbername: barber?.name || "Barbeiro Desconhecido",
        clientname: item.clients?.name || "N/A",
        clientphone: item.clients?.phone || "N/A",
      };
    });
    const final = {
      haircuts: transformedData,
      clients_resume: Object.values(clientHaircuts),
    };
    res.status(200).json(final);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

haircutRoute.get("/type", async (req, res) => {
  const { data, error } = await supabase.from("haircut_types").select();
  if (error) {
    res.status(500);
  }
  res.status(200).send(data);
});

haircutRoute.patch("/delete", async (req, res) => {
  const { id } = req.body;
  try {
    const { error } = await supabase
      .from("haircuts")
      .delete()
      .eq("haircut_id", id);
    res.status(200).send(`O Corte ID:${id} foi deletado`);
  } catch (error) {
    res.status(500);
  }
});

haircutRoute.patch("/", async (req, res) => {
  const { id, haircut_type, barber_id, haircut_price } = req.body;
  if (id == undefined) {
    res.status(400).send("missing Id");
  }
  if (
    haircut_type == undefined &&
    barber_id == undefined &&
    haircut_price == undefined
  ) {
    res.status(400).send("Missing arguments");
  }
  try {
    const { error } = await supabase
      .from("haircuts")
      .update({
        haircut_type: haircut_type,
        barber_id: barber_id,
        haircut_price: haircut_price,
      })
      .eq("haircut_id", id);
    res.status(200).send(`O Pedido ID:${id} foi alterado`);
  } catch (err) {
    res.status(500);
  }
});

haircutRoute.patch("/type", async (req, res) => {
  const { id, type, price } = req.body;
  if (id == undefined) {
    res.status(400).send("Missing id");
  }
  if (type == undefined && price == undefined) {
    res.status(400).send("Missing arguments");
  }
  try {
    const { error } = await supabase
      .from("haircut_types")
      .update({
        type: type,
        price: price,
      })
      .eq("id", id);
    res.status(200).send(`O Corte ${type} ID:${id} foi alterado`);
  } catch (error) {
    res.status(500);
  }
});

haircutRoute.patch("/type/delete", async (req, res) => {
  const { id } = req.body;
  if (id == undefined) {
    res.status(400).send("missing id");
  }
  try {
    await supabase.from("haircut_types").delete().eq("id", id);
    res.status(200).send(`O Corte ID:${id} foi deletado`);
  } catch (err) {
    res.status(500);
  }
});

haircutRoute.post("/type", async (req, res) => {
  const body = req.body;
  if (body == undefined) {
    res.status(400).send("Missing arguments");
  }
  try {
    const { error } = await supabase.from("haircut_types").insert({
      type: body.type,
      price: body.price,
    });

    res.status(201).send("Tipo de corte cadastrado com sucesso!");
  } catch (err) {
    res.status(500);
  }
});

haircutRoute.post("/", async (req, res) => {
  try {
    const body = req.body;

    if (!body || (Array.isArray(body) && body.length === 0)) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    const haircuts = Array.isArray(body) ? body : [body];

    const { error } = await supabase
      .from("haircuts")
      .insert(Array.isArray(body) ? body : [body]);

    if (error) {
      return res.status(500).json({ error: "Error inserting haircuts" });
    }

    const clientIds = [...new Set(haircuts.map((hc) => hc.client_id))];

    const now = new Date();
    const formattedDate = formatInTimeZone(
      now,
      "UTC",
      "yyyy-MM-dd HH:mm:ssXXX"
    );

    await Promise.all(
      clientIds.map((client_id) =>
        supabase
          .from("clients")
          .update({ last_haircut: formattedDate })
          .eq("client_id", client_id)
      )
    );

    res.status(201).json({ message: "Corte(s) cadastrado(s) com sucesso" });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default haircutRoute;
