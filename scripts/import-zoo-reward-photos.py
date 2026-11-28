#!/usr/bin/env python3
"""Import freely licensed real animal reward photographs from Wikimedia Commons.
Keeps image data local so iPad/PC games don't need cross-domain requests at runtime.
Source and copyright metadata are in zoo-photo-manifest.json.
"""
import io, json, pathlib, time, urllib.parse, urllib.request
from PIL import Image, ImageOps

ROOT=pathlib.Path(__file__).resolve().parents[1]
M=json.loads((ROOT/'zoo-photo-manifest.json').read_text(encoding='utf-8'))['photographs']
OUT=ROOT/'images'
OUT.mkdir(exist_ok=True)
ua={'User-Agent':'TivvigZooEducation/1.0 (https://github.com/nilitaleo-crypto/lada-nikita-monster-school-2; educational photo attribution)',
    'Accept':'application/json,image/webp,image/jpeg,*/*'}
fail=[]
for animal,item in M.items():
    title='File:'+item['filename']
    query=urllib.parse.urlencode({'action':'query','format':'json','prop':'imageinfo',
           'titles':title,'iiprop':'url','iiurlwidth':'1100'})
    api='https://commons.wikimedia.org/w/api.php?'+query
    dest=OUT/('zoo-reward-'+animal+'.webp')
    try:
        response=None
        for attempt in range(4):
            try:
                r=urllib.request.Request(api,headers=ua)
                with urllib.request.urlopen(r,timeout=30) as res:
                    obj=json.load(res)
                info=next(iter(obj['query']['pages'].values()))['imageinfo'][0]
                url=info.get('thumburl') or info['url']
                req=urllib.request.Request(url,headers=ua)
                with urllib.request.urlopen(req,timeout=45) as res:
                    response=res.read()
                if len(response)<5000:raise ValueError('Image response too small')
                break
            except Exception:
                if attempt==3:raise
                time.sleep(2**attempt)
        im=Image.open(io.BytesIO(response))
        im=ImageOps.exif_transpose(im).convert('RGB')
        if min(im.size)<350:raise ValueError('Source resolution too low: '+str(im.size))
        im.thumbnail((1100,850),Image.Resampling.LANCZOS)
        im.save(dest,'WEBP',quality=84,method=6)
        check=Image.open(dest)
        check.verify()
        print('OK',animal,im.size,dest.stat().st_size,'bytes',item['source'])
    except Exception as exc:
        fail.append((animal,str(exc)))
for k,v in fail:print('FAIL',k,v)
if fail:raise SystemExit('Failed to fetch '+str(len(fail))+' licensed photos')
