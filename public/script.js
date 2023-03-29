const socket = io({ autoConnect: true });

var data;
var network_data;

var username;
var uuid;

var selected_profile = -1;

var collections;
var skills;
var minions = {};
var skill_levels = {};

var rank;

socket.on("collections", (c) => {
  console.log("received collections");
  collections = c;
});

socket.on("skills", (s) => {
  console.log("received skills");
  skills = s;
});

socket.on("status", (data, user) => {
  console.log("received status for " + user.username);
  if (!data.success) {
    alert("error fetching hypixel status for " + user.username);
    return;
  }
  if (data.session.online == true) {
    let location = data.session.mode;
    if (locations[data.session.mode]) {
      location = locations[data.session.mode];
    }
    document.querySelector("#current-game").innerHTML = 'Location: ' + data.session.gameType + " - " + location;
  }
});

socket.on("network_data", (data, user) => {
  if (!data.success) {
    alert("error fetching hypixel network data for " + user.username);
    return;
  }

  network_data = data.player;
  username = network_data.displayname;

  document.querySelector("#network-level").innerHTML =
    "Network Level: " + (Math.sqrt(2 * network_data.networkExp + 30625) / 50 - 2.5).toFixed(2);

  document.querySelector("#karma").innerHTML = "Karma: " + network_data.karma.toLocaleString("en");
  document.querySelector("#achievement-points").innerHTML =
    "Achievement Points: " + network_data.achievementPoints.toLocaleString("en");

  if (network_data.prefix) {
    rank = network_data.prefix;
  } else if (network_data.rank && network_data.rank != "NORMAL") {
    rank = network_data.rank;
  } else if (network_data.monthlyPackageRank && network_data.monthlyPackageRank != "NONE") {
    rank = network_data.monthlyPackageRank;
  } else if (network_data.newPackageRank && network_data.newPackageRank != "NONE") {
    rank = network_data.newPackageRank;
  } else if (network_data.packageRank && network_data.packageRank != "NONE") {
    rank = network_data.packageRank;
  }

  if (rank == "MVP_PLUS") {
    rank = "MVP+";
  }

  if (rank == "YOUTUBER") {
    rank = "YOUTUBE+";
  }
  if (rank == "VIP_PLUS") {
    rank = "VIP";
  }

  if (rank == "§c[OWNER]") {
    rank = "OWNER";
  }

  if (rank == "SUPERSTAR") {
    rank = "MVP++";
  }

  if (network_data.lastLogin > network_data.lastLogout) {
    // online
    let d = new Date();
    document.querySelector("#last-session").innerHTML = `Online for ${msToTime(d.getTime() - network_data.lastLogin)}`;
  } else {
    document.querySelector("#last-session").innerHTML = `Last Session: ${relativeTime(
      network_data.lastLogout
    )} ago for ${msToTime(network_data.lastLogout - network_data.lastLogin)}`;
  }

  document.querySelector("#username").innerHTML = `${username}`;

  if (rank) document.querySelector("#username").innerHTML = `[${rank}] ${username}`;
});

socket.on("skyblock_data", (skyblock, user) => {
  // data

  data = skyblock;
  uuid = user.uuid;

  if (data == null || data == undefined) {
    alert("error in request");
    return;
  }

  console.log(`received data for ${username}`);
  console.log(skyblock);

  if (!data.success) {
    alert("error fetching hypixel skyblock data for " + user.username);
    return;
  }

  if (!data.profiles) return;

  for (i in data.profiles) {
    // for each profile

    if (data.profiles[i].game_mode == "bingo") continue;

    let option = document.createElement("option");
    option.value = i;
    option.text = data.profiles[i].cute_name;

    document.querySelector("#profile-selector").append(option);

    //
    document.querySelector("#profile-selector").value = i;
    selected_profile = i;
  }

  showData();
});

function showData() {
  document.querySelector("#minions").innerHTML = "";
  document.querySelector("#collections").innerHTML = "";
  document.querySelector("#skills").innerHTML = "";
  document.querySelector("#bank").innerHTML = "Bank: 0";
  document.querySelector("#purse").innerHTML = "Coin Purse: 0";
  document.querySelector("#fairy-souls").innerHTML = "Fairy Souls: 0";

  // basic info
  if (data.profiles[selected_profile].banking) {
    document.querySelector("#bank").innerHTML = "Bank: " + abbrNum(data.profiles[selected_profile].banking.balance);
  }

  document.querySelector("#purse").innerHTML =
    "Coin Purse: " + abbrNum(data.profiles[selected_profile].members[uuid].coin_purse);

  document.querySelector("#fairy-souls").innerHTML =
    "Fairy Souls: " + abbrNum(data.profiles[selected_profile].members[uuid].fairy_souls_collected);

  // skills
  showSkillsData();

  // collections
  showCollectionsData();

  // minions
  for (g in data.profiles[selected_profile].members[uuid].crafted_generators) {
    // for every crafted minion
    // find your highest level for each minion
    let minion = data.profiles[selected_profile].members[uuid].crafted_generators[g];
    let split = minion.lastIndexOf("_");
    let tier = minion.substr(split + 1);
    let name = minion.substr(0, split);

    if (tier < minions[name]) continue;
    minions[name] = tier;
  }

  for (m in minions) {
    let container = document.createElement("div");
    let name = document.createElement("p");
    name.innerHTML = m + " " + minions[m];
    container.append(name);
    document.querySelector("#minions").append(container);
  }
}

function showSkillsData() {
  // skills

  for (s in skills.skills) {
    // for each skill
    let skill = skills.skills[s];
    let skill_container = document.createElement("div");
    skill_container.className = "skill-container";
    let skill_name_container = document.createElement("div");
    skill_name_container.className = "skill-name-container";
    let skill_image = document.createElement("img");
    skill_image.src = "./assets/" + images.skills[s.toLowerCase()];
    let skill_name = document.createElement("h3");
    skill_name_container.append(skill_image, skill_name);
    let bar = document.createElement("div");
    bar.className = "bar";
    let bar_fill = document.createElement("div");
    let progress = document.createElement("p");
    progress.className = "progress";

    let amount = data.profiles[selected_profile].members[uuid][`experience_skill_${skill.name.toLowerCase()}`];

    if (skill.name.toLowerCase() == "social")
      amount = data.profiles[selected_profile].members[uuid][`experience_skill_social2`];

    for (l in skill.levels) {
      if (isNaN(amount)) amount = 0;

      let required = skill.levels[l].totalExpRequired;

      if (amount > required) continue;

      let last_required = 0;

      if (l > 0) last_required = skill.levels[l - 1].totalExpRequired;

      amount -= last_required;

      skill_name.innerHTML = `${skill.name} ${l}`;

      bar_fill.className = "bar-fill";
      bar_fill.style.width = (amount / (required - last_required)) * 100 + "%";

      progress.innerHTML = `${abbrNum(amount)} / ${abbrNum(required - last_required)}`;

      bar.append(bar_fill, progress);

      if (skill.name != "Runecrafting" && skill.name != "Social")
        skill_levels[skill.name] = parseInt(l) + amount / (required - last_required);

      break;
    }

    skill_container.append(skill_name_container, bar);
    document.querySelector("#skills").append(skill_container);
  }

  let temp = 0;
  for (i in skill_levels) {
    temp += skill_levels[i];
  }

  let avg_container = document.createElement("div");
  avg_container.className = "skill-container";
  let avg = document.createElement("h3");
  avg.className = "name";
  avg.innerHTML = "Average: " + (temp / Object.keys(skill_levels).length).toFixed(2);

  avg_container.append(avg);
  document.querySelector("#skills").append(avg_container);
}

function showCollectionsData() {
  if (data.profiles[selected_profile].members[uuid].collection == undefined) {
    console.log("collections api is disabled");
    let collection_err = document.createElement("p");
    collection_err.innerHTML = username + " has their collections API disabled";
    document.querySelector("#collections").append(collection_err);
    return;
  }

  for (c in collections.collections) {
    // each category
    let collection_title = document.createElement("h2");
    collection_title.innerHTML = collections.collections[c].name;

    let collection_category = document.createElement("div");
    collection_category.className = "category";

    document.querySelector("#collections").append(collection_title);

    for (i in collections.collections[c].items) {
      let item = collections.collections[c].items[i];
      let container = document.createElement("div");
      container.className = "collection-item-container";
      let item_name = document.createElement("p");
      item_name.className = "item-name";
      let bar_container = document.createElement("div");
      bar_container.className = "bar-container";
      let unlocks = document.createElement("p");
      unlocks.className = "unlocks";

      for (t in item.tiers) {
        // for each tier
        let bar = document.createElement("div");
        bar.className = "bar";
        let bar_fill = document.createElement("div");
        bar_fill.className = "bar-fill";

        let collected = data.profiles[selected_profile].members[uuid].collection[i];
        let required = item.tiers[t].amountRequired;
        let last_required = -1;

        if (t > 0) last_required = item.tiers[t - 1].amountRequired;

        let fill = (collected / required) * 100;

        if (collected > required) {
          // you have this tier
          fill = 100;
          item_name.innerHTML = `${item.name} ${parseInt(t) + 1} (${abbrNum(collected)})`;
        }

        if (collected < last_required) {
          // did not have last tier
          fill = 0;
        }

        if (isNaN(collected)) {
          // undiscovered collection
          fill = 0;
          collected = 0;
          item_name.innerHTML = `${item.name} (Undiscovered)`;
          container.classList.add("undiscovered");
        }
        if (collected > required && t == item.tiers.length - 1) {
          // maxed collection
          item_name.classList.add("maxed");
        }
        if (collected < required && (collected >= last_required || last_required == -1)) {
          // is the current tier you're working on
          for (u in item.tiers[t].unlocks) {
            if (item.tiers[t].unlocks[u].includes("SkyBlock XP")) continue;
            unlocks.innerHTML += item.tiers[t].unlocks[u] + "<br>";
          }
          item_name.innerHTML = `${item.name} ${parseInt(t)} (${abbrNum(collected)}/${abbrNum(required)})`;
        }

        bar_fill.style.width = fill + "%";

        bar.append(bar_fill);
        bar_container.append(bar);
      }

      container.append(item_name, bar_container, unlocks);
      collection_category.append(container);
    }
    document.querySelector("#collections").append(collection_category);
  }
}

function init() {
  socket.emit("request_collections");
  socket.emit("request_skills");
}

function selectProfile() {
  selected_profile = document.querySelector("#profile-selector").value;
  showData();
}

function requestUserData() {
  let user = document.querySelector("#user-input").value;
  socket.emit("request_user", user);
  console.log(`requested data for ${user}`);
  document.querySelector("#profile-selector").innerHTML = "";

  document.querySelector("#input").style.display = "none";
}

document.querySelector("#user-input").onkeydown = function (e) {
  if (e.key == "Enter") {
    requestUserData();
  }
};

init();

function abbrNum(number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(number)
    .toLowerCase();
}

function relativeTime(time) {
  let d = new Date();
  let now = d.getTime();

  let dif = now - time;

  let times = [86400000, 3600000, 60000, 1000];
  let letters = ["d", "h", "m", "s"];

  for (let i in times) {
    if (dif < 1000) return "1s";

    if (dif < times[i]) continue;

    let count = Math.floor(dif / times[i]);

    return `${count}${letters[i]}`;
  }
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}
