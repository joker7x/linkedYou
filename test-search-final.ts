import fetch from 'node-fetch';
async function test() {
  const params = new URLSearchParams();
  params.append('search', 'div');
  const res = await fetch("https://dwaprices.com/api_dr88g/serverz.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: params.toString()
  });
  const text = await res.text();
  console.log("RESPONSE TEXT:", text);
  try {
    const data = JSON.parse(text);
    console.log("JSON DATA LENGTH:", Array.isArray(data) ? data.length : typeof data);
    console.log("DATA SAMPLE:", JSON.stringify(Array.isArray(data) ? data.slice(0, 1) : data, null, 2));
  } catch (e) {
    console.log("NOT JSON");
  }
}
test();
