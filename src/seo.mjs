import products from './products.json' with { type: 'json' };
import { solutionContent } from './solutionContent.mjs';
export const SITE_URL = (import.meta.env?.VITE_SITE_URL || 'https://www.trubuild.in').replace(/\/$/, '');
const defaults = {
  '/': ['TruBuild Waterproofing, Tile Adhesives & Repair Solutions', 'Explore Astral TruBuild waterproofing, tile adhesives, grouts and concrete repair materials. Find application guidance, products and technical data sheets.'],
  '/solutions': ['Waterproofing, Tiling & Repair Solutions | TruBuild', 'Find TruBuild solutions for roofs, bathrooms, exterior walls, concrete repair, basements, water tanks, tile installation and joint sealing.'],
  '/products': ['Product Catalogue: Waterproofing & Construction | TruBuild', 'Browse TruBuild waterproofing, tiling, grouting and repair products. Filter by application, compare products and download technical data sheets.'],
  '/resources': ['Technical Data Sheets & Product Guides | TruBuild', 'Download TruBuild technical data sheets and brochures for waterproofing, tile adhesives, grouts, joint sealants and concrete repair products.'],
  '/about': ['About Astral TruBuild | Construction Solutions', 'Learn about Astral TruBuild and its waterproofing, tiling, grouting and concrete repair product range.'],
  '/contact': ['Contact TruBuild | Product & Technical Enquiries', 'Contact TruBuild for product enquiries and technical assistance. Share your surface, application and project requirements with the team.'],
  '/advisor': ['Find a Product for Your Project | TruBuild', 'Explore TruBuild products by project area, substrate and application requirements with the Product Advisor.'],
  '/compare': ['Compare Products | TruBuild', 'Compare selected TruBuild products, applications and technical specifications.'],
  '/sources': ['Content & Image Sources | TruBuild', 'View the sources used for product information and illustrative imagery on this website.'],
};
export const publicRoutes = [...Object.keys(defaults).filter(x => !['/compare', '/sources'].includes(x)), ...Object.keys(solutionContent).map(id => '/solutions/' + id), ...products.map(p => '/products/' + p.id)];
export function metadata(pathname, origin = SITE_URL) {
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const solution = solutionContent[path.split('/')[2]] && /^\/solutions\/[^/]+$/.test(path) ? solutionContent[path.split('/')[2]] : null;
  const p = products.find(item => path === '/products/' + item.id);
  const known = !!(solution || p || defaults[path]);
  const [title, description] = solution ? [solution.title, solution.description] : p ? [p.name + ' | TruBuild Product & Technical Data', p.description.slice(0, 157).replace(/\s+\S*$/, '') + '…'] : defaults[path] || ['Page Not Found | TruBuild', 'The requested page could not be found. Explore TruBuild products and solutions.'];
  const url = origin + path;
  const image = origin + (p?.image || ({roof:'/images/hero-roof-coating.webp',tiling:'/images/hero-interior-floor.webp',wet:'/images/application-wet-v2.webp',exterior:'/images/hero-exterior-home-v3.webp',repair:'/images/application-repair-v2.webp',basement:'/images/application-basement-v2.webp',tanks:'/images/application-tanks-v2.webp',sealants:'/images/application-sealants-v2.webp'}[path.split('/')[2]]) || '/images/architecture.webp');
  const graph = [];
  if (solution) {
    const pageId = url + '#webpage';
    graph.push({'@type':'WebPage','@id':pageId,url,name:title,description,inLanguage:'en-IN',breadcrumb:{'@id':url+'#breadcrumb'},hasPart:{'@id':url+'#faq'}});
    graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[{ '@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:'Solutions',item:origin+'/solutions'},{'@type':'ListItem',position:3,name:solution.heading+' '+solution.accent.replace(/\.$/,''),item:url}]});
    graph.push({'@type':'FAQPage','@id':url+'#faq',isPartOf:{'@id':pageId},mainEntity:solution.faqs.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))});
  }
  return {title,description,url,image,robots:!known || ['/compare','/sources'].includes(path) ? 'noindex, follow' : 'index, follow, max-image-preview:large',schema:graph.length ? {'@context':'https://schema.org','@graph':graph} : null};
}
export const safeJson = value => JSON.stringify(value).replace(/</g,'\\u003c');
export function applyMetadata(path) {
  const data = metadata(path);
  document.title = data.title;
  const set = (key, value, property = false) => {
    const attr = property ? 'property' : 'name';
    let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attr,key); document.head.append(tag); }
    tag.content = value;
  };
  set('description',data.description); set('robots',data.robots);
  for (const [key,value] of Object.entries({'og:title':data.title,'og:description':data.description,'og:url':data.url,'og:image':data.image,'og:type':'website','og:site_name':'TruBuild','og:locale':'en_IN'})) set(key,value,true);
  set('twitter:card','summary_large_image');set('twitter:title',data.title);set('twitter:description',data.description);set('twitter:image',data.image);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}canonical.href=data.url;
  document.getElementById('page-schema')?.remove();
  if(data.schema){const script=document.createElement('script');script.id='page-schema';script.type='application/ld+json';script.textContent=safeJson(data.schema);document.head.append(script);}
}
