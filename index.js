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

const dev = false;

// host html

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/stats", function (req, res) {
  res.sendFile(__dirname + "/public/stats.html");
});

app.get("/bz", function (req, res) {
  res.sendFile(__dirname + "/public/bazaar.html");
});

app.get("/ah", function (req, res) {
  res.sendFile(__dirname + "/public/auctionhouse.html");
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

  socket.on("request_status", (uuid) => {
    fetchBazaar(socket);
  });

  socket.on("request_network", (uuid) => {
    fetchNetwork(socket);
  });

  socket.on("request_skyblock", (uuid) => {
    fetchSkyblock(socket);
  });

  socket.on("request_uuid", (username) => {
    fetchUUID(socket, username);
  });
});

async function fetchUUID(s, username) {
  if (dev) {
    s.emit("uuid", "000d22007fe84958a9d0c00e1d3a329e");
  } else {
    //
    let response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    let data = await response.json();
    console.log(data)
    s.emit("uuid", data);
  }
}

function fetchSkills(s) {
  if (dev) {
    fs.readFile("./temp/skills.json", "utf-8", (err, data) => {
      s.emit("skills", JSON.parse(data));
    });
  } else {
    fetch(`https://api.hypixel.net/resources/skyblock/skills?key=${key}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(`fetched skyblock skills`);
        s.emit("skills", data);
      });
  }
}
function fetchCollections(s) {
  if (dev) {
    fs.readFile("./temp/collections.json", "utf-8", (err, data) => {
      s.emit("collections", JSON.parse(data));
    });
  } else {
    fetch(`https://api.hypixel.net/resources/skyblock/collections?key=${key}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(`fetched skyblock collections`);
        s.emit("collections", data);
      });
  }
}

function fetchUser(s, username) {
  if (dev) {
    data = { id: "000d22007fe84958a9d0c00e1d3a329e" };
    fs.readFile("./temp/profiles.json", "utf-8", (err, data1) => {
      s.emit("skyblock_data", JSON.parse(data1), { uuid: data.id, username: username });
    });

    fs.readFile("./temp/player.json", "utf-8", (err, data2) => {
      s.emit("network_data", JSON.parse(data2), { uuid: data.id, username: username });
    });

    fs.readFile("./temp/status.json", "utf-8", (err, data3) => {
      s.emit("status", JSON.parse(data3), { uuid: data.id, username: username });
    });
  } else {
    fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
      .then((res) => res.json())
      .then((data) => {
        fetch(`https://api.hypixel.net/skyblock/profiles?uuid=${data.id}&key=${key}`)
          .then((res1) => res1.json())
          .then((data1) => {
            console.log(`fetched skyblock data for minecraft user ${username}`);
            s.emit("skyblock_data", data1, { uuid: data.id, username: username });
          });

        fetch(`https://api.hypixel.net/player?uuid=${data.id}&key=${key}`)
          .then((res2) => res2.json())
          .then((data2) => {
            console.log(`fetched hypixel network data for minecraft user ${username}`);
            s.emit("network_data", data2, { uuid: data.id, username: username });
          });

        fetch(`https://api.hypixel.net/status?uuid=${data.id}&key=${key}`)
          .then((res3) => res3.json())
          .then((data3) => {
            console.log(`fetched hypixel status for minecraft user ${username}`);
            s.emit("status", data3, { uuid: data.id, username: username });
          });
      });
  }
}


// set public
app.use(express.static(__dirname + "/public"));
