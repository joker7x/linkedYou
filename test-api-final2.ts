import fetch from 'node-fetch';
async function test() {
  const body = 'searchForFlutter=div&lastpricesForFlutter=0';
  const res = await fetch("https://dwaprices.com/api_dr88g/serverz.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: body
  });
  const text = await res.text();
  console.log("TEXT:", text);
}
test();
