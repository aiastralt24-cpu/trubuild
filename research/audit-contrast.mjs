import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('docs/text-colors.json'));
const rgb=s=>s.match(/[\d.]+/g).map(Number);
const lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
let fails=[],checked=0;
for(const page of data) for(const s of page.samples){if(s.chain.some(x=>x.image!=='none'||+x.opacity<1))continue; let bg=[255,255,255];for(const c of [...s.chain].reverse()){let v=rgb(c.bg),a=v[3]??1;bg=bg.map((x,i)=>x*(1-a)+v[i]*a);}const fg=rgb(s.color),a=fg[3]??1,c=bg.map((x,i)=>x*(1-a)+fg[i]*a),ratio=(Math.max(lum(c),lum(bg))+.05)/(Math.min(lum(c),lum(bg))+.05);const min=parseFloat(s.size)>=24||(parseFloat(s.size)>=18.66&&+s.weight>=700)?3:4.5;checked++;if(ratio<min)fails.push({path:page.path,text:s.text,class:s.class,ratio:+ratio.toFixed(2),min,fg:s.color,bg});}
fs.writeFileSync('docs/contrast-audit.json',JSON.stringify({checked,fails,note:'Solid computed backgrounds only. Image/gradient/opacity contexts require visual inspection.'},null,2));console.log(JSON.stringify({checked,fails},null,2));
