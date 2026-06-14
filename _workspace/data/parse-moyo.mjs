import { readFileSync, writeFileSync } from 'fs';
let raw = readFileSync('/tmp/moyo-merged.txt','utf8');
// drop page markers and nav boilerplate
raw = raw.replace(/===PAGE \d+===/g,'');
// strong card regex anchored on 통화..문자..망..tech..월 price
const re = /(\d\.\d)(.+?)(통화 (?:무제한|\d+분))(문자 (?:무제한|\d+건))(LG U\+망|KT망|SKT망)(LTE|5G)월 ([\d,]+)원(?:(\d+)개월 이후 ([\d,]+)원)?([\d,]+)명이 선택(?:사은품 최대 (\d+)개)?/g;
const num = s => s ? parseInt(String(s).replace(/[^\d]/g,''),10) : null;
const out = [];
let m;
while ((m = re.exec(raw)) !== null) {
  const [, rating, nameData, callRaw, smsRaw, net, tech, price, promoM, regRaw, , gift] = m;
  // split name / data: data is trailing "월 ...GB.../Mbps" or "무제한"
  let name = nameData, dataStr = '';
  const lastWol = nameData.lastIndexOf('월 ');
  if (lastWol >= 0 && /GB|Mbps/.test(nameData.slice(lastWol))) {
    name = nameData.slice(0, lastWol);
    dataStr = nameData.slice(lastWol);
  } else if (/무제한$/.test(nameData)) {
    name = nameData.replace(/(데이터 )?무제한$/,'');
    dataStr = '무제한';
  }
  name = name.replace(/\[모요핫딜\]|\[모요only\]|\[K\]\s?/g,'').trim();
  // data parse
  let dataGb=null, dataUnlimited=false, throttleKbps=null, dailyGb=null;
  if (dataStr==='무제한' || /^무제한/.test(dataStr)) { dataUnlimited=true; }
  else {
    const gb = dataStr.match(/월 ([\d.]+)\s?GB/); if (gb) dataGb=parseFloat(gb[1]);
    const daily = dataStr.match(/매일 ([\d.]+)\s?GB/); if (daily) dailyGb=parseFloat(daily[1]);
    const mb = dataStr.match(/([\d.]+)\s?Mbps/); if (mb) throttleKbps=Math.round(parseFloat(mb[1])*1000);
  }
  const network = net==='LG U+망'?'LGU':net==='KT망'?'KT':'SKT';
  const monthlyPrice = num(price);
  const regularPrice = regRaw?num(regRaw):monthlyPrice;
  const promoMonths = promoM?parseInt(promoM,10):0;
  const mnoBrand = /너겟|요고|다이렉트|\bair\b|0 ?청년|광대역|napzone/i.test(name);
  out.push({
    name, network, tech,
    dataGb, dataUnlimited, throttleKbps, dailyGb,
    callUnlimited: callRaw.includes('무제한'), callMinutes: callRaw.includes('무제한')?null:num(callRaw),
    smsUnlimited: smsRaw.includes('무제한'), smsCount: smsRaw.includes('무제한')?null:num(smsRaw),
    monthlyPrice, regularPrice, promoMonths,
    mvno: !mnoBrand,
    giftCount: gift?parseInt(gift,10):0,
    rating: parseFloat(rating),
  });
}
// dedupe by name+network+monthlyPrice
const seen=new Set(); const uniq=[];
for (const p of out){ const k=p.name+'|'+p.network+'|'+p.monthlyPrice; if(seen.has(k))continue; seen.add(k); uniq.push(p);}
writeFileSync('/tmp/moyo-plans.json', JSON.stringify(uniq,null,2));
console.log('parsed', out.length, '→ unique', uniq.length);
console.log('price range:', Math.min(...uniq.map(p=>p.monthlyPrice)), '~', Math.max(...uniq.map(p=>p.monthlyPrice)));
console.log('networks:', JSON.stringify(uniq.reduce((a,p)=>{a[p.network]=(a[p.network]||0)+1;return a;},{})));
console.log('mvno:', uniq.filter(p=>p.mvno).length, '/ mno:', uniq.filter(p=>!p.mvno).length);
console.log('unlimited:', uniq.filter(p=>p.dataUnlimited).length);
console.log('--- cheapest 6 ---');
uniq.sort((a,b)=>a.monthlyPrice-b.monthlyPrice).slice(0,6).forEach(p=>console.log(`  ${p.monthlyPrice}원  ${p.name} (${p.network} ${p.tech} ${p.dataUnlimited?'무제한':p.dataGb+'GB'})${p.promoMonths?` →${p.promoMonths}개월후 ${p.regularPrice}`:''}`));
