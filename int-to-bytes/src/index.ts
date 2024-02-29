import "@polkadot/api";
import "@polkadot/util-crypto";

const numStr = "38 170 57 78 234 86 48 224 124 72 174 12 149 88 206 247 185 157 136 14 198 129 121 156 12 243 14 136 134 55 29 169 97 242 65 112 60 223 148 157 108 22 167 218 142 208 194 23 70 235 221 239 140 217 187 22 125 195 8 120 215 17 59 126 22 142 111 6 70 190 255 215 125 105 211 155 173 118 180 122";

const bSpace = false;

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
