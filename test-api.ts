import fetch from 'node-fetch';
async function test() {
  const res = await fetch("https://dwaprices.com/api_dr88g/serverz.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: 'lastpricesForFlutter=0'
  });
  const data = await res.json();
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
}
test();