
function createElement(a, b = {}) {
  let elem = document.createElement(a);
  for (i in Object.keys(b)) {
    elem[Object.keys(b)[i]] = b[Object.keys(b)[i]];
  }
  return elem;
}


function abbrNum(number) {

  // 1000 > 1k

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

  // ms to 00:00:00:00
  
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds; // + milliseconds
}