import fs from 'node:fs';
import * as cheerio from 'cheerio';
const clean=s=>s.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
const home=cheerio.load(fs.readFileSync('research/trubuild.html','utf8'));
const urls=[...new Set(home('a[href*="/products/"]').map((i,a)=>home(a).attr('href')).get())].filter(url=>/\/products\/[^/]+\//.test(url)&&!url.includes('/trubuild-cps-111/')); 
const products=urls.map(url=>{
 const id=url.split('/').filter(Boolean).at(-1),$=cheerio.load(fs.readFileSync(`research/${id}.html`,'utf8'));
 const get=s=>clean($(s).first().text());
 const cat=home(`a[href="${url}"]`).filter((i,e)=>home(e).closest('.subMenuLinks2').find('h3.blueColor').length).first().closest('.subMenuLinks2').find('h3.blueColor').first().text().trim();
 const applications=[...new Set(home(`a[href="${url}"]`).map((i,e)=>clean(home(e).closest('.subMenuLinks2').find('h3.orangeColor').first().text())).get().filter(Boolean))];
 const image=$('.productPic img').first().attr('data-lazy-src')||$('.productPic img').first().attr('src');
 const sizes=$('#sizes-pane .otherTabContent').clone();sizes.find('.tabSubTitle').remove();
 return {id,name:get('h1').replace(/^TRUBUILD /,'').replace(/^Trubuild /,''),category:applications.at(-1)||cat,applications:applications.filter(x=>['Concrete and Mortar','Exterior Waterproofing','Professional Sealants','Roof Waterproofing','Substructure Waterproofing','Tiling and Grouting','Water Tanks and Other Areas','Wet Areas'].includes(x)),source:url,imageSource:image,image:`/images/${id}.png`,subtitle:get('.bSubhead'),description:get('.productDetailWrap .brief')||get('.brief'),benefits:$('#features-pane .list').map((i,e)=>clean($(e).text())).get(),packaging:clean(sizes.text()),fields:$('#fields-pane li').map((i,e)=>clean($(e).text())).get(),applicationNotes:$('#fields-pane p').map((i,e)=>clean($(e).text())).get(),specs:$('#specification-pane tbody tr').map((i,e)=>[$(e).find('td').map((j,c)=>clean($(c).text())).get()]).get(),tds:$('a[download][href*=".pdf"]').first().attr('href')||null,verified:'2026-10-05'};
});
fs.writeFileSync('src/products.json',JSON.stringify(products,null,2));
const dl=cheerio.load(fs.readFileSync('research/downloads.html','utf8'));
const docs=[...new Map(dl('a[href*=".pdf"]').map((i,e)=>({url:dl(e).attr('href'),title:clean(dl(e).text())||decodeURIComponent(dl(e).attr('href').split('/').at(-1)).replaceAll('-',' ').replace('.pdf','')})).get().map(d=>[d.url,d])).values()];
fs.writeFileSync('src/resources.json',JSON.stringify(docs,null,2));
/*console.log(products.map(p=>({name:p.name,category:p.category,applications:p.applications,fields:p.fields,packaging:p.packaging,specs:p.specs.length,tds:!!p.tds})));console.log(docs);*/
