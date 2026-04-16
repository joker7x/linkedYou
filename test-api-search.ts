import fetch from 'node-fetch';
async function test() {
  const res = await fetch("https://dwaprices.com/api_dr88g/serverz.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: 'searchForFlutter=panadol'
  });
  const text = await res.text();
  console.log(text.slice(0, 500));
}
test();