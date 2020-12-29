export function uuid() {
    const hex = [];

    for (let i = 0; i < 256; i++) {
        hex[i] = (i < 16 ? "0" : "") + i.toString(16);
    }

    const r = crypto.getRandomValues(new Uint8Array(16));

    r[6] = (r[6] & 0x0F) | 0x40;
    r[8] = (r[8] & 0x3F) | 0x80;

    const h = (...n) => n.map((i) => hex[r[i]]).join("");

    return `${h(0, 1, 2, 3)}-${h(4, 5)}-${h(6, 7)}-${h(8, 9)}-${h(10, 11, 12, 13, 14, 15)}`;
}
