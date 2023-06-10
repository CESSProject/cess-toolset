import "@polkadot/api";
import "@polkadot/util-crypto";

const numStr = "70 235 221 239 140 217 187 22 125 195 8 120 215 17 59 126 22 142 111 6 70 190 255 215 125 105 211 155 173 118 180 122";

const bSpace = true;

function run() {
  const strArr = numStr
    .split(" ")
    .map(s => parseInt(s, 10))
    .map(v => v.toString(16).toUpperCase())
    .map(s => s.length < 2 ? `0${s}` : s)

  const res = strArr.join(bSpace ? " " : "");
  console.log(res);
}

run();
