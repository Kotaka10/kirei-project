const text = "Hello Blob World";

//　文字列　→ Blob
const blob = new Blob([text], { type: "text/plain" });

// Blob → 文字列
const restoredText = await blob.text();

console.log(restoredText);

const data = {
    id: 1,
    name: "komiya",
    tags: ["react", "blob"],
};

// JSON → 文字列
const jsonString = JSON.stringify(data);

// 文字列 → Blob
const blob2 = new Blob([jsonString], { type: "application/json" });

// Blob → 文字列
const restoredText2 = await blob2.text();

// 文字列 → JSON
const restoredJson = JSON.parse(restoredText2);

console.log(restoredJson);

const text2 = "Hello";

// Blob作成
const blob3 = new Blob([text2], { type: "text/plain" });

// ArrayBufferに変換
const buffer = await blob3.arrayBuffer();

// Unit8Arrayに変換
const unit8 = new Uint8Array(buffer);

console.log(unit8);

// 文字列に戻す
const decodor = new TextDecoder();
const restored = decodor.decode(unit8);

console.log(restored);