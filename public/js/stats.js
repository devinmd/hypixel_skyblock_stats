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

window.onload = function () {
  headings = document.querySelectorAll("h1");

  document.addEventListener("scroll", (e) => {
    //on scroll
    /*	for(i in headings){
					let h = headings[i]
					const rect = h.getBoundingClientRect();
      	if(rect.top > 0 && rect.top < 150) {
        const location = window.location.toString().split('#')[0];
 				let oldHash = window.location.hash; 
					if ('#' + h.name != oldHash) {  
					//	history.replaceState(null, null, location + '#' + h.innerHTML);
 }  
				}
			}*/
  });
};

function page(p) {
  //				history.replaceState(null, null, location + '#' + p);
}

socket.on("collections", (c) => {
  console.log("received collections");
  collections = c;

  let url_search_params = new URLSearchParams(window.location.search);
  let user = url_search_params.get("u");
  console.log(user);

  if (user != null && user.replaceAll(" ", "") != "") {
    // is a user in url provided
    document.querySelector("#user-input").value = user;
    requestUserData();
  }

  //let page = window.location.hash;
  //  console.log(page.split("#"));
});

socket.on("skills", (s) => {
  console.log("received skills");
  skills = s;
});

socket.on("status", (data, user) => {
  console.log("received status for " + user.username);
  console.log(data);

  if (!data.success) {
    alert("error fetching hypixel status for " + user.username);
    return;
  }

  if (!data.session.online) {
    // if offline
    document.querySelector("#skyblock-location").innerHTML = "Location: Offline";
    document.querySelector("#current-game").innerHTML = "Server: Offline";
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

  let rank = getRank();

  if (network_data.lastLogin > network_data.lastLogout) {
    // online
    let d = new Date();
    document.querySelector("#last-session").innerHTML = `Online for ${msToTime(d.getTime() - network_data.lastLogin)}`;
  } else {
    // offline
    document.querySelector("#last-session").innerHTML = `Last Session: ${relativeTime(
      network_data.lastLogout
    )} ago for ${msToTime(network_data.lastLogout - network_data.lastLogin)}`;
  }

  document.querySelector("#username").innerHTML = `${username}`;

  if (rank) {
    document.querySelector("#username").innerHTML = `[${rank}] ${username}`;
    document.querySelector("#username").className = rank;
  }
});
socket.emit("request_uuid", "auvocado");

socket.on("uuid", (data) => {
  user = data;
  console.log("USERNAME: " + data.name);
  console.log("UUID: " + data.uuid);
});



socket.on("skyblock_data", (skyblock, user) => {
  // data
  data = skyblock;
  uuid = user.uuid;

  document.querySelector("#player-head").src = "https://crafatar.com/avatars/" + uuid + "?size=32&overlay";

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
  document.querySelector("#purse").innerHTML = "Purse: 0";
  document.querySelector("#fairy-souls").innerHTML = "Fairy Souls: 0";

  // basic info
  if (data.profiles[selected_profile].banking) {
    document.querySelector("#bank").innerHTML = "Bank: " + abbrNum(data.profiles[selected_profile].banking.balance);
  }

  document.querySelector("#purse").innerHTML =
    "Purse: " + abbrNum(data.profiles[selected_profile].members[uuid].coin_purse);

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
    let progress = document.createElement("p");
    progress.className = "progress";
    skill_name_container.append(skill_image, skill_name, progress);
    let bar = document.createElement("div");
    bar.className = "bar";
    let bar_fill = document.createElement("div");

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

      bar.append(bar_fill);

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
  document.querySelector("#avg-skill-lvl").innerHTML =
    "Average Skill Level: " + (temp / Object.keys(skill_levels).length).toFixed(2);

  avg_container.append(avg);
  document.querySelector("#skills").append(avg_container);
}

function showCollectionsData() {
  if (data.profiles[selected_profile].members[uuid].collection == undefined) {
    // no collections api
    console.log("collections api is disabled");
    let collection_err = createElement("p", { innerHTML: `${username} has their collections API disabled` });
    document.querySelector("#collections").append(collection_err);
    return;
  }

  for (c in collections.collections) {
    // for each category
    let collection_category = createElement("div", { className: "collections-category" });
    let collection_category_title_container = createElement("button", {
      className: "collection-category-title-container",
    });

    collection_category_title_container.onclick = function () {
      collection_category.style.display = collection_category.style.display == "none" ? "grid" : "none";
    };
    let collection_category_image = createElement("img", {
      src: "./assets/" + images.skills[collections.collections[c].name.toLowerCase()],
    });

    let collection_category_title = createElement("h2", {
      innerHTML: collections.collections[c].name,
    });

    collection_category_title_container.append(collection_category_image, collection_category_title);

    document.querySelector("#collections").append(collection_category_title_container);

    for (i in collections.collections[c].items) {
      // for each item in category
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
          container.classList.add("maxed");
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
  // change url query

  // Construct URLSearchParams object instance from current URL querystring.
  var queryParams = new URLSearchParams(window.location.search);

  // Set new or modify existing parameter value.
  queryParams.set("u", user);
  history.replaceState(null, null, "?" + queryParams.toString());
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

function getRank() {
  let rank = "";
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
    rank = "YOUTUBE";
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

  return rank;
}

function createElement(a, b = {}) {
  let elem = document.createElement(a);
  for (i in Object.keys(b)) {
    elem[Object.keys(b)[i]] = b[Object.keys(b)[i]];
  }
  return elem;
}
