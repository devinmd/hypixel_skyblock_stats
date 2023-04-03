// socketio
const socket = io({ autoConnect: true });

// start
function requestUserData() {
  username = document.querySelector("#user-input").value;

  socket.emit("request_uuid", username);

  console.log(`requested minecraft uuid for ${username}`);

  document.querySelector("#profile-selector").innerHTML = "";



  // change url query

  // Construct URLSearchParams object instance from current URL querystring.
  // var queryParams = new URLSearchParams(window.location.search);

  // Set new or modify existing parameter value.
  //queryParams.set("u", user);
  //history.replaceState(null, null, "?" + queryParams.toString());
}

socket.on("uuid", (u) => {
  console.log("received minecraft uuid for " + username);

  uuid = u.id;
  username = u.name;

  document.querySelector("#player-head").src = "https://crafatar.com/avatars/" + uuid + "?size=32&overlay";


  socket.emit("request_hypixel_status", uuid);
  console.log("requesting hypixel status for " + username);

  socket.emit("request_hypixel_data", uuid);
  console.log("requesting hypixel data for " + username);

  socket.emit("request_skyblock_data", uuid);
  console.log("requesting skyblock data for " + username);
});

socket.on("skills", (s) => {
  console.log("received skills");

  skills = s;
});

socket.on("collections", (c) => {
  console.log("received collections");
  collections = c;
});

socket.on("hypixel_status", (data) => {
  //
  console.log("received hypixel status");
  //
  if (!data.success) {
    alert("error fetching hypixel status for " + username);
    return;
  }

  if (!data.session.online) {
    // if offline
    document.querySelector("#skyblock-location").innerHTML = "Location: Offline";
    document.querySelector("#current-game").innerHTML = "Server: Offline";
    // console.log(username + " is offline");
    return;
  }

  location1 = data.session.mode;

  document.querySelector("#current-game").innerHTML = "Server: " + data.session.gameType + " - " + location1;

  if (data.session.gameType == "SKYBLOCK") {
    // if in skyblock
    if (locations[data.session.mode]) {
      location1 = locations[data.session.mode];
    }
    document.querySelector("#skyblock-location").innerHTML = "Location: " + location1;
  } else {
    // not in skyblock
    document.querySelector("#skyblock-location").innerHTML = "Location: Other Gamemode";
  }
});

socket.on("hypixel_data", (data) => {
  //
  console.log("received hypixel data");
  //
  if (!data.success) {
    alert("error fetching hypixel data for " + username);
    return;
  }

  hypixel_data = data.player;

  // network data
  let network_lvl = (Math.sqrt(2 * hypixel_data.networkExp + 30625) / 50 - 2.5).toFixed(2);
  let achievement_points = hypixel_data.achievementPoints.toLocaleString("en");
  let karma = hypixel_data.karma.toLocaleString("en");

  document.querySelector("#network-level").innerHTML = `Network Level: ${network_lvl}`;
  document.querySelector("#karma").innerHTML = `Karma: ${karma}`;
  document.querySelector("#achievement-points").innerHTML = `Achievement Points: ${achievement_points}`;

  // session data
  if (hypixel_data.lastLogin > hypixel_data.lastLogout) {
    // online
    let d = new Date();
    document.querySelector("#last-session").innerHTML = `Online for ${msToTime(d.getTime() - hypixel_data.lastLogin)}`;
  } else {
    // offline
    document.querySelector("#last-session").innerHTML = `Last Session: ${relativeTime(
      hypixel_data.lastLogout
    )} ago for ${msToTime(hypixel_data.lastLogout - hypixel_data.lastLogin)}`;
  }

  let rank = getRank();

  document.querySelector("#username").innerHTML = `${username}`;

  if (rank) {
    document.querySelector("#username").innerHTML = `[${rank}] ${username}`;
    document.querySelector("#username").className = rank;
  }
});
