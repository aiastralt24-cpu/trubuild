import re,subprocess,concurrent.futures,pathlib,json
s=pathlib.Path('research/trubuild.html').read_text()
urls=list(dict.fromkeys(re.findall(r'href=["\'](https://www.trubuild.in/products/[^"\']+)',s)))
urls += ['https://www.trubuild.in/about-us/','https://www.trubuild.in/downloads/','https://www.trubuild.in/contact-us/','https://www.trubuild.in/technical-information/']
def fetch(url):
 name=url.rstrip('/').split('/')[-1]
 p=pathlib.Path('research')/(name+'.html')
 r=subprocess.run(['curl','-L','--fail','-s',url,'-o',str(p)])
 return [url,r.returncode]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex: print(json.dumps(list(ex.map(fetch,urls))))
