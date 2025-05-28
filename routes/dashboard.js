import express from "express";
import supabase from "../supabase.js";
import { DateTime } from "luxon";

const dashboardRoute = express.Router();

const now = new Date();

const localNow = new Date(now.getTime() - 4 * 60 * 60 * 1000);

const localYear = localNow.getFullYear();
const localMonth = localNow.getMonth();
const localDay = localNow.getDate();

const startOfDayUTC = new Date(
  Date.UTC(localYear, localMonth, localDay, 4, 0, 0)
);
const endOfDayUTC = new Date(startOfDayUTC);
endOfDayUTC.setUTCDate(endOfDayUTC.getUTCDate() + 1);

let localToday = new Date();
localToday.setUTCHours(localToday.getUTCHours() - 4);
localToday.setUTCMinutes(0, 0, 0);

let endUTC = new Date(localToday);
endUTC.setDate(endUTC.getDate() + 1);

const today = new Date();

const mondayOfCurrentWeek = new Date(today);
mondayOfCurrentWeek.setUTCDate(
  today.getUTCDate() - (today.getUTCDay() === 0 ? 6 : today.getUTCDay() - 1)
);

const endOfCurrentWeek = new Date(mondayOfCurrentWeek);
endOfCurrentWeek.setUTCDate(mondayOfCurrentWeek.getUTCDate() + 6);

const startOfThisMonth = new Date(today);
startOfThisMonth.setUTCDate(1);

const lastMonth = new Date(today);
lastMonth.setUTCMonth(today.getUTCMonth() - 1);
lastMonth.setUTCDate(1);

const thisYear = new Date(today);
thisYear.setHours(0, 0, 0, 0);
thisYear.setUTCFullYear(today.getUTCFullYear(), 0, 1);

function convertedData(data) {
  return data.map((row) => ({
    ...row,
    datetime_utc4: DateTime.fromISO(row.datetime, { zone: "utc" })
      .setZone("America/Cuiaba")
      .toISO(),
  }));
}

function dataHandlerDashboard(data, filter, reqBarberId) {
  const filteredByBarberId = data.filter(
    (cut) => Number(cut.barbers?.barber_id) === Number(reqBarberId)
  );
  if (reqBarberId) {
    data = filteredByBarberId;
  }
  const totalProfit = data.reduce((sum, item) => sum + item.haircut_price, 0);
  const totalHaircuts = Object.keys(data).length;
  const barberCounts = data.reduce((acc, item) => {
    const barberName = item.barbers.name;
    acc[barberName] = (acc[barberName] || 0) + 1;
    return acc;
  }, {});
  const barberProfit = data.reduce((acc, item) => {
    const barberName = item.barbers.name;
    acc[barberName] = (acc[barberName] || 0) + item.haircut_price;
    return acc;
  }, {});
  const haircutTypeCounts = data.reduce((acc, item) => {
    const haircutType = item.haircut_type;
    acc[haircutType] = (acc[haircutType] || 0) + 1;
    return acc;
  }, {});

  if (filter === "daily") {
    const totalProfitsByHour = data.reduce((acc, item) => {
      const date = new Date(item.datetime_utc4);
      const hour = date.getUTCHours();
      acc[hour] = (acc[hour] || 0) + item.haircut_price;
      return acc;
    }, {});

    const barberProfitByHour = data.reduce((acc, item) => {
      const date = new Date(item.datetime_utc4);
      const hour = date.getUTCHours();
      const barber = item.barbers.name;
      if (!acc[hour]) {
        acc[hour] = {};
      }
      acc[hour][barber] = (acc[hour][barber] || 0) + item.haircut_price;
      return acc;
    }, {});

    const dailyData = data.map((item) => {
      const date = new Date(item.datetime_utc4);
      const hour = date.getUTCHours();
      const hourKey = `${hour}`;

      if (hourKey >= 4) {
        return {
          id: Number(hourKey - 4),
          haircut_id: item.haircut_id,
          haircut_price: item.haircut_price,
          client_id: item.client_id,
          barberName: item.barbers.name,
          barber_id: item.barber_id,
          datetime_utc4: item.datetime_utc4,
          totalprofit: {
            id: Number(hourKey - 4),
            value: totalProfitsByHour[hour],
          },
          totalbarbersprofit: {
            id: Number(hourKey - 4),
            value: barberProfitByHour[hour],
          },
        };
      } else {
        return {
          id: Number(hourKey) + 20,
          haircut_id: item.haircut_id,
          haircut_price: item.haircut_price,
          client_id: item.client_id,
          barberName: item.barbers.name,
          barber_id: item.barber_id,
          datetime_utc4: item.datetime_utc4,
          totalprofit: {
            id: Number(hourKey) + 20,
            value: totalProfitsByHour[hour],
          },
          totalbarbersprofit: {
            id: Number(hourKey) + 20,
            value: barberProfitByHour[hour],
          },
        };
      }
    });

    return dailyData;
  }
  if (filter === "weekly") {
    const weeklyData = data.reduce((acc, item) => {
      let date = new Date(item.datetime_utc4);
      const numberDay = date.getUTCDay();
      if (!acc[numberDay]) {
        acc[numberDay] = [];
      }

      acc[numberDay].push({
        haircut_id: item.haircut_id,
        haircut_price: item.haircut_price,
        client_id: item.client_id,
        barberName: item.barbers.name,
        barber_id: item.barber_id,
        datetime_utc4: item.datetime_utc4,
      });

      return acc;
    }, Array(7).fill(null)); //anota essa porra    tags: MUITO ROUBADO, BROKEN

    const totalProfit = weeklyData.map((day) =>
      day ? day.reduce((sum, item) => sum + item.haircut_price, 0) : null
    );

    const totalBarbersProfit = weeklyData.map((day) =>
      day
        ? day.reduce((acc, item) => {
            const barberName = item.barberName;
            acc[barberName] = (acc[barberName] || 0) + item.haircut_price;
            return acc;
          }, {})
        : null
    );

    return {
      totalProfit: totalProfit,
      totalBarbersProfit: totalBarbersProfit,
    };
  }

  // if (filter === "monthly") {
  //   const monthlyData = data.reduce((acc, item) => {
  //     let date = new Date(item.datetime_utc4);
  //     const numberWeek = date.getUtc();
  //     if (!acc[numberWeek]) {
  //       acc[numberWeek] = [];
  //     }

  //     acc[numberWeek].push({
  //       haircut_id: item.haircut_id,
  //       haircut_price: item.haircut_price,
  //       client_id: item.client_id,
  //       barberName: item.barbers.name,
  //       barber_id: item.barber_id,
  //       datetime_utc4: item.datetime_utc4,
  //     });

  //     return acc;
  //   }, Array(4).fill(null)); //anota essa porra    tags: MUITO ROUBADO, BROKEN

  //   const totalProfit = monthlyData.map((day) =>
  //     day ? day.reduce((sum, item) => sum + item.haircut_price, 0) : null
  //   );

  //   const totalBarbersProfit = monthlyData.map((day) =>
  //     day
  //       ? day.reduce((acc, item) => {
  //           const barberName = item.barberName;
  //           acc[barberName] = (acc[barberName] || 0) + item.haircut_price;
  //           return acc;
  //         }, {})
  //       : null
  //   );

  //   return {
  //     totalProfit: totalProfit,
  //     totalBarbersProfit: totalBarbersProfit,
  //   };
  // }

  if (filter === "annual") {
    const monthlyData = data.reduce((acc, item) => {
      let date = new Date(item.datetime_utc4);
      const numberMonth = date.getUTCMonth();

      if (!acc[numberMonth]) {
        acc[numberMonth] = [];
      }

      acc[numberMonth].push({
        haircut_id: item.haircut_id,
        haircut_price: item.haircut_price,
        client_id: item.client_id,
        barberName: item.barbers.name,
        barber_id: item.barber_id,
        datetime_utc4: item.datetime_utc4,
      });

      return acc;
    }, Array(12).fill(null));

    const totalProfit = monthlyData.map((month) =>
      month ? month.reduce((sum, item) => sum + item.haircut_price, 0) : null
    );

    const totalBarbersProfit = monthlyData.map((month) =>
      month
        ? month.reduce((acc, item) => {
            const barberName = item.barberName;
            acc[barberName] = (acc[barberName] || 0) + item.haircut_price;
            return acc;
          }, {})
        : null
    );

    return {
      totalProfit: totalProfit,
      totalBarbersProfit: totalBarbersProfit,
    };
  }
  if (reqBarberId) {
    return {
      totalBarberProfit: totalProfit,
      totalHaircuts: totalHaircuts,
      haircutTypeCounts: haircutTypeCounts,
      haircutList: data,
    };
  }
  return {
    totalProfit: totalProfit,
    totalHaircuts: totalHaircuts,
    barberCounts: barberCounts,
    barberProfit: barberProfit,
    haircutTypeCounts: haircutTypeCounts,
  };
}

dashboardRoute.get("/:filter/:reqBarberId?", async (req, res) => {
  const { filter, reqBarberId } = req.params;
  
  const now = new Date();

  const offset = 4 * 60 * 60 * 1000;
  const adjustedNow = new Date(now.getTime() - offset);

  const localYear = adjustedNow.getUTCFullYear();
  const localMonth = adjustedNow.getUTCMonth();
  const localDay = adjustedNow.getUTCDate();

  const startOfTheDay = new Date(
    Date.UTC(localYear, localMonth, localDay, 4, 0, 0)
  );
  const endOfTheDay = new Date(
    startOfTheDay.getTime() + 24 * 60 * 60 * 1000 - 1
  );

  const dayOfWeek = adjustedNow.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayLocal = new Date(adjustedNow);
  mondayLocal.setUTCDate(adjustedNow.getUTCDate() - diffToMonday);
  const startOfTheWeek = new Date(
    Date.UTC(
      mondayLocal.getUTCFullYear(),
      mondayLocal.getUTCMonth(),
      mondayLocal.getUTCDate(),
      4,
      0,
      0
    )
  );
  const endOfTheWeek = new Date(
    startOfTheWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1
  );

  const startOfThisMonth = new Date(
    Date.UTC(localYear, localMonth, 1, 4, 0, 0)
  );

  const startOfNextMonth = new Date(
    Date.UTC(localYear, localMonth + 1, 1, 4, 0, 0)
  );
  const endOfThisMonth = new Date(startOfNextMonth.getTime() - 1);

  let lastMonth, lastMonthYear;
  if (localMonth === 0) {
    lastMonth = 11;
    lastMonthYear = localYear - 1;
  } else {
    lastMonth = localMonth - 1;
    lastMonthYear = localYear;
  }
  const startOfLastMonth = new Date(
    Date.UTC(lastMonthYear, lastMonth, 1, 4, 0, 0)
  );

  const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

  const startOfThisYear = new Date(Date.UTC(localYear, 0, 1, 4, 0, 0));

  const startOfNextYear = new Date(Date.UTC(localYear + 1, 0, 1, 4, 0, 0));
  const endOfThisYear = new Date(startOfNextYear.getTime() - 1);

  // --- Output the results ---
  // console.log("Start of the Day:", startOfTheDay.toISOString());
  // console.log("End of the Day:", endOfTheDay.toISOString());
  // console.log("Start of the Week:", startOfTheWeek.toISOString());
  // console.log("End of the Week:", endOfTheWeek.toISOString());
  // console.log("Start of This Month:", startOfThisMonth.toISOString());
  // console.log("End of This Month:", endOfThisMonth.toISOString());
  // console.log("Start of Last Month:", startOfLastMonth.toISOString());
  // console.log("End of Last Month:", endOfLastMonth.toISOString());
  // console.log("Start of This Year:", startOfThisYear.toISOString());
  // console.log("End of This Year:", endOfThisYear.toISOString());

  const filterHandler = (filterstring) => {
    if (filterstring === "day") {
      return [
        {
          column: "datetime",
          operator: "gte",
          value: startOfTheDay.toISOString(),
        },
        {
          column: "datetime",
          operator: "lt",
          value: endOfTheDay.toISOString(),
        },
      ];
    }
    if (filterstring === "week") {
      return [
        {
          column: "datetime",
          operator: "gte",
          value: startOfTheWeek.toISOString(),
        },
        {
          column: "datetime",
          operator: "lt",
          value: endOfTheWeek.toISOString(),
        },
      ];
    }
    if (filterstring === "thismonth") {
      return [
        {
          column: "datetime",
          operator: "gte",
          value: startOfThisMonth.toISOString(),
        },
        {
          column: "datetime",
          operator: "lt",
          value: endOfThisMonth.toISOString(),
        },
      ];
    }
    if (filterstring === "lastmonth") {
      return [
        {
          column: "datetime",
          operator: "gte",
          value: startOfLastMonth.toISOString(),
        },
        {
          column: "datetime",
          operator: "lt",
          value: endOfLastMonth.toISOString(),
        },
      ];
    }
    if (filterstring === "thisyear") {
      return [
        {
          column: "datetime",
          operator: "gte",
          value: startOfThisYear.toISOString(),
        },
        {
          column: "datetime",
          operator: "lt",
          value: endOfThisYear.toISOString(),
        },
      ];
    }

    return [];
  };

  const applyFilters = (query, filters) => {
    filters.forEach((filter) => {
      query = query.filter(filter.column, filter.operator, filter.value);
    });
    return query;
  };

  let query = supabase.from("haircuts").select(`
    haircut_id,
    haircut_type,
    haircut_price,
    client_id,
    datetime,
    barbers!inner (barber_id, name),
    clients!inner (name)
`);

  if (filter === "day") {
    query = applyFilters(query, filterHandler(filter));

    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "", reqBarberId);
      res.status(200).json(dadosTratados);
    } catch (err) {
      res.status(500);
      console.log(err);
    }
  }
  if (filter === "week") {
    query = applyFilters(query, filterHandler(filter));
    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "", reqBarberId);

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }
  if (filter === "thismonth") {
    query = applyFilters(query, filterHandler(filter));
    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "", reqBarberId);

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }
  if (filter === "lastmonth") {
    query = applyFilters(query, filterHandler(filter));
    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "", reqBarberId);

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }
  if (filter === "total") {
    query = applyFilters(query, filterHandler("thisyear"));
    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "", reqBarberId);

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }

  if (filter === "graphday") {
    query = applyFilters(query, filterHandler("day"));
    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "daily");

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }
  if (filter === "graphweekly") {
    query = applyFilters(query, filterHandler("week"));
    try {
      const { data, error } = await query;
      const converted = convertedData(data);
      const dadosTratados = dataHandlerDashboard(converted, "week");

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }
  // if (filter === "graphmonthly") {
  //   query = applyFilters(query, filterHandler("thismonth"));
  //   try {
  //     const { data, error } = await query;
  //     const converted = convertedData(data);
  //     const dadosTratados = dataHandlerDashboard(converted, "monthly");

  //     res.json(dadosTratados);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  if (filter === "graphannual") {
    query = applyFilters(query, filterHandler("thisyear"));

    try {
      const { data, error } = await query;
      const converted = convertedData(data);

      const dadosTratados = dataHandlerDashboard(converted, "annual");

      res.status(200).json(dadosTratados);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  }
});

export default dashboardRoute;
