#!/usr/bin/env python3
"""UWAGA: pliki w public/assets/img/ zostały zastąpione zdjęciami z Unsplash — NIE uruchamiaj tego skryptu bez potrzeby (nadpisze zdjęcia szarymi grafikami).
Generuje neutralne grafiki zastępcze WebP opisane [ZDJĘCIE: ...], favicony i og-image.
Uruchom z katalogu głównego projektu: python3 narzedzia/generuj-grafiki-zastepcze.py
Podmień pliki w public/assets/img/ własnymi zdjęciami (te same nazwy) albo wgraj nowe z panelu."""
import os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'img')
ICO = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'icons')
PUB = os.path.join(os.path.dirname(__file__), '..', 'public')
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
SERIFI = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf'
random.seed(7)
# (plik, opis, kolor1, kolor2)
IMGS = [
 ('hero-sesja-lifestyle-lancut', 'naturalne ujęcie kobiety w ciepłym świetle, sesja lifestylowa w plenerze', (92,78,66), (186,168,148)),
 ('o-mnie-portret-fotografki', 'portret Natalii Perkowskiej z aparatem, naturalne światło', (110,96,84), (206,192,176)),
 ('oferta-tlo-sesje-zdjeciowe', 'kadr z sesji w plenerze o złotej godzinie', (84,74,66), (176,160,142)),
 ('cennik-tlo-pakiety-sesji', 'detal: odbitki zdjęć na jasnym stole', (120,112,104), (214,206,196)),
 ('portfolio-tlo-galerie', 'kolaż kadrów reporterskich, ciepłe barwy', (70,64,60), (160,150,140)),
 ('bony-tlo-prezent-sesja', 'prezent z wstążką, jasne wnętrze', (140,124,110), (226,216,204)),
 ('kontakt-tlo-sesja-w-domu', 'wnętrze domu z dużym oknem, miękkie światło', (96,88,80), (198,188,176)),
 ('dlaczego-warto-tlo', 'zbliżenie na aparat i obiektyw, jasne tło', (60,56,54), (150,142,134)),
 ('sesje-portretowe-wizerunkowe', 'portret kobiety, naturalny makijaż, ciepłe światło', (104,88,76), (196,176,158)),
 ('sesje-rodzinne-noworodkowe-ciazowe', 'rodzina z dzieckiem w domu lub w plenerze', (112,100,86), (208,196,176)),
 ('sesje-lifestyle-w-domu-klienta', 'codzienna chwila w domu: kawa, okno, uśmiech', (98,90,80), (200,190,174)),
 ('sesje-studyjne', 'portret w studiu na jasnym tle', (130,126,120), (222,218,210)),
 ('pakiet-chwila', 'pojedyncza, krótka sesja: jedno ujęcie w świetle okna', (118,104,92), (212,198,182)),
 ('pakiet-pamiatka', 'zestaw kilku ujęć z sesji w plenerze', (100,92,84), (196,186,172)),
 ('pakiet-opowiesc', 'reportaż z dłuższej sesji: różne miejsca i emocje', (84,76,70), (178,166,152)),
] + [(f'galeria-{i:02d}-{n}', d, c1, c2) for i,(n,d,c1,c2) in enumerate([
 ('portret-kobiecy-plener','portret kobiecy w plenerze', (96,84,72),(190,172,152)),
 ('rodzina-w-domu','rodzina na kanapie w domu', (108,98,88),(204,192,176)),
 ('para-spacer','para na spacerze, ujęcie reporterskie', (88,82,76),(182,172,160)),
 ('studio-portret','portret w studiu, jasne tło', (128,122,116),(220,214,206)),
 ('dziecko-zabawa','dziecko podczas zabawy, naturalne ujęcie', (112,102,90),(210,198,182)),
 ('ciaza-okno','sesja ciążowa przy oknie', (100,90,80),(198,184,168)),
 ('lifestyle-kawiarnia','lifestyle: kawa i rozmowa', (92,80,70),(186,168,150)),
 ('detal-dlonie','detal: splecione dłonie', (118,108,98),(214,202,186)),
], start=1)]

def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur+' '+w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def make(name, desc, c1, c2, W=1600, H=1000):
    sw, sh = 160, 100
    base = Image.new('RGB', (sw, sh), c1)
    px = base.load()
    for y in range(sh):
        for x in range(sw):
            t = (x/sw*0.55 + y/sh*0.45)
            px[x,y] = tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(3))
    dr = ImageDraw.Draw(base, 'RGBA')
    for _ in range(5):
        cx, cy, r = random.randint(0,sw), random.randint(0,sh), random.randint(20,50)
        col = tuple(min(255,int(c2[i]+random.randint(-30,30))) for i in range(3)) + (random.randint(60,120),)
        dr.ellipse((cx-r,cy-r,cx+r,cy+r), fill=col)
    base = base.filter(ImageFilter.GaussianBlur(14)).resize((W,H), Image.LANCZOS)
    noise = Image.effect_noise((W,H), 12).convert('L')
    base = Image.blend(base, Image.merge('RGB',(noise,noise,noise)), 0.04)
    d = ImageDraw.Draw(base, 'RGBA')
    f = ImageFont.truetype(SERIFI, max(14, W//62))
    label = '[ZDJĘCIE: ' + desc + ']'
    lines = wrap(d, label, f, W*0.5)
    y = H - 24 - len(lines)*(f.size+6)
    for ln in lines:
        w = d.textlength(ln, font=f)
        d.text(((W-w)/2, y), ln, font=f, fill=(255,255,255,150))
        y += f.size+6
    for w,h,suf in ((W,H,''),(800,500,'-800')):
        im = base if w==W else base.resize((w,h), Image.LANCZOS)
        im.save(os.path.join(OUT, f'{name}{suf}.webp'), 'WEBP', quality=62, method=6)

for n,d,c1,c2 in IMGS: make(n,d,c1,c2)

# og-image 1200x630 typograficzny (JPG)
og = Image.new('RGB',(1200,630),(244,241,236)); d = ImageDraw.Draw(og)
d.rectangle((0,0,1200,630), fill=(244,241,236))
d.rectangle((60,60,1140,570), outline=(207,203,196), width=2)
fb = ImageFont.truetype(SERIF, 70); fs = ImageFont.truetype(SERIFI, 34); fk = ImageFont.truetype(SERIF, 24)
def ctr(t,f,y,fill):
    w = d.textlength(t,font=f); d.text(((1200-w)/2,y),t,font=f,fill=fill)
ctr('Natalia Perkowska',fb,205,(20,20,20)); ctr('FOTOGRAFIA',fk,300,(122,92,69))
ctr('Fotograf Łańcut · Rzeszów — naturalne sesje zdjęciowe',fs,380,(94,90,84))
og.save(os.path.join(OUT,'og-image.jpg'),'JPEG',quality=88)

# favicony i logo tymczasowe (monogram NP)
def mono(size):
    im = Image.new('RGBA',(size,size),(20,20,20,255)); dd = ImageDraw.Draw(im)
    f = ImageFont.truetype(SERIF, int(size*0.46)); t='NP'
    w = dd.textlength(t,font=f); dd.text(((size-w)/2, size*0.22), t, font=f, fill=(244,241,236))
    return im
mono(32).save(os.path.join(PUB,'favicon-32.png')); mono(180).save(os.path.join(PUB,'apple-touch-icon.png'))
mono(192).save(os.path.join(ICO,'icon-192.png')); mono(512).save(os.path.join(ICO,'icon-512.png'))
mono(512).save(os.path.join(OUT,'logo-tymczasowe.png'))
open(os.path.join(PUB,'favicon.svg'),'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#141414"/><text x="32" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#F4F1EC">NP</text></svg>')
print('OK', len(IMGS), 'grafik')
