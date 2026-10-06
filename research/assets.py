import json,subprocess,concurrent.futures,pathlib
ps=json.load(open('src/products.json')); docs=json.load(open('src/resources.json'));pathlib.Path('public/documents').mkdir(exist_ok=True)
items=[(p['imageSource'],'public'+p['image']) for p in ps if p['imageSource']]
items += [('https://www.trubuild.in/wp-content/uploads/2026/05/Trubuild-Logo-1.png','public/images/logo.png'),('https://www.trubuild.in/wp-content/uploads/2025/07/about.avif','public/images/about.avif')]
for i,d in enumerate(docs):
 d['local']='/documents/document-'+str(i)+'.pdf'; items.append((d['url'],'public'+d['local']))
def fetch(item):
 u,p=item;r=subprocess.run(['curl','-L','--fail','-s',u,'-o',p]);return [p,r.returncode]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex: results=list(ex.map(fetch,items))
for d in docs:
 if not pathlib.Path('public'+d['local']).exists(): d.pop('local',None)
json.dump(docs,open('src/resources.json','w'),indent=2)
json.dump(results,open('research/asset-status.json','w'),indent=2)
print('Assets:',len(results),'Failures:',[r for r in results if r[1]])
