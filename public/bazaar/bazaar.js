const socket = io({ autoConnect: true });

var products = {};

function init() {
  console.log("requested bazaar");
  socket.emit("request_bazaar");
}

init();

socket.on("bazaar", (b) => {
  console.log("received bazaar");

  if (!b.success) {
    alert("error fetching bazaar data");
    return;
  }

  products = b.products;

  document.querySelector("#last-updated").innerHTML = `Last Updated: ${relativeTime(b.lastUpdated)} ago`;

  let tr = createElement("tr", {});
  let name = createElement("th", { innerHTML: "Product" });
  let buy = createElement("th", { innerHTML: "Instant Sell<br>Buy Order" });
  let sell = createElement("th", { innerHTML: "Instant Buy<br>Sell Offer" });
  let profit = createElement("th", { innerHTML: "Buy / Sell Difference<br>Profit" });
  let supply = createElement("th", { innerHTML: "Items In Sell Offers<br>Supply" });
  let demand = createElement("th", { innerHTML: "Items In Buy Orders<br>Demand" });
  let hourly_sell = createElement("th", {
    innerHTML: "Estimated Hourly Instant Sells<br>Estimated Hourly Filled Buy Orders",
  });
  let hourly_buy = createElement("th", {
    innerHTML: "Estimated Hourly Instant Buys<br>Estimated Hourly Filled Sell Offers",
  });

  tr.append(name, buy, sell, profit, hourly_sell, hourly_buy, supply, demand);

  document.querySelector("#table").append(tr);

  document.querySelectorAll("th").forEach((th) =>
    th.addEventListener("click", () => {
      const table = th.closest("table");
      Array.from(table.querySelectorAll("tr:nth-child(n+2)"))
        .sort(comparer(Array.from(th.parentNode.children).indexOf(th), (this.asc = !this.asc)))
        .forEach((tr) => table.appendChild(tr));
    })
  );

  for (i in products) {
    let product = products[i];

    if (product.product_id.startsWith("ENCHANTMENT")) {
      // ignore enchantments
      continue;
    }

    // sum of item amounts in all orders
    let buy_volume = product.quick_status.buyVolume; //    VOLUME OF SELL OFFERS / NEEDED INSTANT BUYS TO FILL SELL ORDERS / SUPPLY
    let sell_volume = product.quick_status.sellVolume; //  TOTAL VOLUME OF BUY ORDERS / NEEDED INSTANT SELLS TO FILL BUY ORDERS  /  DEMAND /

    //
    let buy_orders = product.quick_status.buyOrders; // ACTIVE BUY ORDERS
    let sell_orders = product.quick_status.sellOrders; // ACTIVE SELL OFFERS

    // weighted average of the top 2% of orders by volume.
    let instant_buy_price = product.quick_status.buyPrice; // LOWEST SELL OFFER / INSTANT BUYS
    let instant_sell_price = product.quick_status.sellPrice; // HIGHEST BUY ORDER / INSTANT SELLS

    // instant sell/buy in the last 7 days
    let week_instant_buys = product.quick_status.buyMovingWeek; // INSANT BUYS IN THE LAST 7 DYAYS
    let week_instant_sells = product.quick_status.sellMovingWeek; // INSANT SELLS IN THE LAST 7 DYAYS

    if (instant_buy_price == 0 || instant_sell_price == 0) {
      // ignore these items
      continue;
    }

    /*
    fields: 
      - image
      - name
      - buy order $
      - sell offer $
      - margin/difference from flip
      - buy volume
      - sell volume
      - estimated hourly buy
      - estimated hourly sell
    */

    // item name
    item_name = product.product_id;
    if (bazaar_item_names[product.product_id]) {
      item_name = bazaar_item_names[product.product_id];
    }

    let tr = createElement("tr", {});
    let name = createElement("td", { innerHTML: item_name });
    let buy = createElement("td", { innerHTML: formatNumber(instant_sell_price) });
    let sell = createElement("td", { innerHTML: formatNumber(instant_buy_price) });
    let profit = createElement("td", { innerHTML: (instant_buy_price - instant_sell_price).toFixed(2) });
    let supply = createElement("td", { innerHTML: formatNumber(buy_volume, 0) });
    let demand = createElement("td", { innerHTML: formatNumber(sell_volume, 0) });
    let hourly_buy = createElement("td", { innerHTML: (week_instant_buys / 168).toFixed(2) });
    let hourly_sell = createElement("td", { innerHTML: (week_instant_sells / 168).toFixed(2) });

    tr.append(name, buy, sell, profit, hourly_sell, hourly_buy, supply,demand);

    document.querySelector("#table").append(tr);
  }
});

function formatNumber(number, decimals = 2) {
  return number.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

const comparer = (idx, asc) => (a, b) =>
  ((v1, v2) => (v1 !== "" && v2 !== "" && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)))(
    getCellValue(asc ? a : b, idx),
    getCellValue(asc ? b : a, idx)
  );
