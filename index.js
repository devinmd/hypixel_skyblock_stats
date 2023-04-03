const express = require("express");
const app = express();
const http = require("http");
const https = require("https");

const fetch = require("node-fetch");

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = 5050;

const fs = require("fs");

require("dotenv").config();

const key = process.env.KEY;

const dev = process.env.DEVELOPMENT;

// host html

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/stats", function (req, res) {
  res.sendFile(__dirname + "/public/stats/stats.html");
});

app.get("/bz", function (req, res) {
  res.sendFile(__dirname + "/public/bazaar/bazaar.html");
});

app.get("/ah", function (req, res) {
  res.sendFile(__dirname + "/public/auctions/auctions.html");
});

// listen
server.listen(port, () => {
  console.log(`PORT: ${port}`);
});

io.on("connection", (socket) => {
  console.log(`(${socket.id}) joined`);

  socket.on("disconnect", () => {
    console.log(`(${socket.id}) left`);
  });

  socket.on("request_collections", () => {
    fetchCollections(socket);
  });

  socket.on("request_skills", () => {
    fetchSkills(socket);
  });

  socket.on("request_bazaar", () => {
    fetchBazaar(socket);
  });

  socket.on("request_hypixel_status", (uuid) => {
    fetchHypixelStatus(socket, uuid);
  });

  socket.on("request_hypixel_data", (uuid) => {
    fetchHypixelData(socket, uuid);
  });

  socket.on("request_skyblock_data", (uuid) => {
    fetchSkyblockData(socket, uuid);
  });

  socket.on("request_uuid", (username) => {
    fetchUUID(socket, username);
  });

  socket.on("request_items", () => {
    fetchUUID(socket);
  });
});

async function fetchUUID(socket, username) {
  if (dev) {
    socket.emit('uuid', { id: '000d22007fe84958a9d0c00e1d3a329e', name: 'auvocado' });
  } else {
    //
    let response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    let data = await response.json();
    socket.emit("uuid", data);
  }

  console.log("fetched uuid for " + username);
}

async function fetchSkills(socket) {
  if (dev) {
    fs.readFile("./temp/skills.json", "utf-8", (err, data) => {
      socket.emit("skills", JSON.parse(data));
    });
  } else {
    let response = await fetch(`https://api.hypixel.net/resources/skyblock/skills?key=${key}`);
    let data = await response.json();
    socket.emit("skills", data);
  }
  console.log("fetched skills");
}

async function fetchCollections(socket) {
  if (dev) {
    fs.readFile("./temp/collections.json", "utf-8", (err, data) => {
      socket.emit("collections", JSON.parse(data));
    });
  } else {
    let response = await fetch(`https://api.hypixel.net/resources/skyblock/collections?key=${key}`);
    let data = await response.json();
    socket.emit("collections", data);
  }
  console.log("fetched collections");
}
async function fetchBazaar(socket) {
  if (dev) {
    fs.readFile("./temp/bazaar.json", "utf-8", (err, data) => {
      socket.emit("bazaar", JSON.parse(data));
    });
  } else {
    let response = await fetch(`https://api.hypixel.net/skyblock/bazaar?key=${key}`);
    let data = await response.json();
    socket.emit("bazaar", data);
  }
  console.log("fetched bazaar");
}


async function fetchItems(socket) {
  //if (dev) {
    fs.readFile("./temp/items.json", "utf-8", (err, data) => {
      socket.emit("items", JSON.parse(data));
    });
 // } else {
    //let response = await fetch(`https://api.hypixel.net/skyblock/bazaar?key=${key}`);
    //let data = await response.json();
    //socket.emit("bazaar", data);
 // }
  console.log("fetched items");
}

async function fetchSkyblockData(socket, uuid) {
  if (dev) {
    fs.readFile("./temp/profiles.json", "utf-8", (err, data) => {
      socket.emit("skyblock_data", JSON.parse(data));
    });
  } else {
    let response = await fetch(`https://api.hypixel.net/skyblock/profiles?uuid=${uuid}&key=${key}`);
    let data = await response.json();
    socket.emit("skyblock_data", data);
  }
  console.log("fetched skyblock data for " + uuid);
}

async function fetchHypixelData(socket, uuid) {
  if (dev) {
    fs.readFile("./temp/player.json", "utf-8", (err, data) => {
      socket.emit("hypixel_data", JSON.parse(data));
    });
  } else {
    let response = await fetch(`https://api.hypixel.net/player?uuid=${uuid}&key=${key}`);
    let data = await response.json();
    socket.emit("hypixel_data", data);
  }
  console.log("fetched hypixel data for " + uuid);
}

async function fetchHypixelStatus(socket, uuid) {
  if (dev) {
    fs.readFile("./temp/status.json", "utf-8", (err, data) => {
      socket.emit("hypixel_status", JSON.parse(data));
    });
  } else {
    let response = await fetch(`https://api.hypixel.net/status?uuid=${uuid}&key=${key}`);
    let data = await response.json();
    socket.emit("hypixel_status", data);
  }
  console.log("fetched hypixel status for " + uuid);
}

// set public
app.use(express.static(__dirname + "/public"));
