"""Freeze Valve art and one base-hero response per hero. Requires Pillow.
Downloads are cached; original Android assets are never modified.
Classic line IDs are checked against the December 2018 response-rule scripts;
this verifies the line's existence, NOT byte-identical historical audio.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import hashlib, io, json, re, shutil, subprocess, time, urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.asset-cache'
PUBLIC = ROOT / 'public/assets'
OLD = '823a1df1cbf4bbee72e6d13a56bc464303417049'
CDN = 'https://cdn.steamstatic.com/apps/dota2/'
DB = 'https://raw.githubusercontent.com/mdiller/dotabase/7ec2f5a91d21f52aae5a37bf12caa3c057fdbffa/json/'
VPK = 'https://dotabase.dillerm.io/dota-vpk'
for folder in [CACHE, PUBLIC / 'heroes', PUBLIC / 'audio', PUBLIC / 'archive', PUBLIC / 'original']:
    folder.mkdir(parents=True, exist_ok=True)

def fetch(url):
    path = CACHE / hashlib.sha256(url.encode()).hexdigest()
    if path.exists(): return path.read_bytes()
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'GuessTheHero-asset-audit/1.0'})
            data = urllib.request.urlopen(req, timeout=45).read()
            path.write_bytes(data)
            return data
        except Exception:
            if attempt == 2: raise
            time.sleep(attempt + 1)

def image(data, dest, size=720):
    destination = PUBLIC / dest
    if destination.exists():
        try:
            with Image.open(destination) as existing: existing.verify()
            return
        except Exception: destination.unlink()
    im = Image.open(io.BytesIO(data)).convert('RGBA')
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    temporary = destination.with_suffix('.tmp')
    im.save(temporary, 'WEBP', quality=86, method=6)
    temporary.replace(destination)

roster = json.loads((ROOT / 'research/valve-roster.json').read_text())['result']['data']['heroes']
classic = json.loads((ROOT / 'research/heroes-2018.json').read_text())
db = {x['id']: x for x in json.loads(fetch(DB + 'heroes.json'))}
original_dir = ROOT.parent / 'main/res/drawable'
original_names = {'life_stealer': 'life_stealer', 'magnataur': 'magnus', 'doom_bringer': 'doom'}
rule_names = {'storm_spirit': 'stormspirit', 'crystal_maiden': 'crystalmaiden', 'drow_ranger': 'drowranger', 'pangolier': 'pangolin', 'sand_king': 'sandking', 'shadow_shaman': 'shadowshaman', 'witch_doctor': 'witchdoctor', 'abyssal_underlord': 'abyssal_underlord', 'obsidian_destroyer': 'outworld_destroyer'}
response_names = {'antimage': 'antimage', 'centaur': 'centaur_warrunner', 'doom_bringer': 'doom', 'furion': 'natures_prophet', 'life_stealer': 'lifestealer', 'magnataur': 'magnus', 'necrolyte': 'necrophos', 'nevermore': 'shadow_fiend', 'obsidian_destroyer': 'outworld_destroyer', 'queenofpain': 'queen_of_pain', 'rattletrap': 'clockwerk', 'shredder': 'timbersaw', 'skeleton_king': 'wraith_king', 'treant': 'treant_protector', 'vengefulspirit': 'vengeful_spirit', 'windrunner': 'windranger', 'wisp': 'io', 'zuus': 'zeus', 'abyssal_underlord': 'underlord'}
signatures = {'axe': 'There is no team in Axe!', 'pudge': 'Fresh meat!', 'earthshaker': 'Let the earth shake!', 'invoker': 'I am a beacon of knowledge blazing out across a black sea of ignorance.', 'juggernaut': 'Juggernaut!', 'kez': 'Kez.', 'largo': 'Largo!'}
records = {}

def process(hero):
    key = hero['name'].removeprefix('npc_dota_hero_')
    old = str(hero['id']) in classic
    source = CDN + f'videos/dota_react/heroes/renders/{key}.png'
    image(fetch(source), f'heroes/{key}.webp')
    record = {'id': hero['id'], 'name': hero['name_loc'], 'classic': old, 'attribute': db.get(hero['id'], {}).get('primary_attr', 'unknown'), 'roles': db.get(hero['id'], {}).get('roles', '').split('|'), 'aliases': db.get(hero['id'], {}).get('aliases', '').split('|'), 'image': f'assets/heroes/{key}.webp', 'imageSource': source}
    original_key = original_names.get(key, key)
    files = {p.stem.lower(): p for p in original_dir.iterdir()}
    full = files.get(original_key + '_full') or files.get(original_key + '_ful')
    guess = files.get(original_key + '_guess')
    if full and guess:
        image(full.read_bytes(), f'original/{key}-full.webp')
        image(guess.read_bytes(), f'original/{key}-guess.webp')
        record['originalImage'] = f'assets/original/{key}-full.webp'
        record['originalSilhouette'] = f'assets/original/{key}-guess.webp'
    old_rules = ''
    if old:
        archive = f'https://raw.githubusercontent.com/SteamDatabase/GameTracking-Dota2/{OLD}/game/dota/pak01_dir/resource/flash3/images/heroes/{key}.png'
        try:
            image(fetch(archive), f'archive/{key}.webp')
            record['archiveImage'] = f'assets/archive/{key}.webp'
            record['archiveSource'] = archive
        except Exception as e: record['archiveNote'] = str(e)
        rule = f'https://raw.githubusercontent.com/SteamDatabase/GameTracking-Dota2/{OLD}/game/dota/pak01_dir/scripts/talker/response_rules_{rule_names.get(key,key)}.txt'
        try: old_rules = fetch(rule).decode('utf-8', errors='replace')
        except Exception: pass
        record['historicalRuleSource'] = rule
    response_key = response_names.get(key, key)
    responses = json.loads(fetch(DB + f'responses/{response_key}.json'))
    candidates = []
    for response in responses:
        historic = response['name'].lower() in old_rules.lower()
        active = 'Unused' not in response.get('pretty_criteria', '')
        score = 0
        if active: score += 10
        if old and historic: score += 100
        if 'spawn' in response['name'].lower() or 'Spawning' in response.get('pretty_criteria', ''): score += 20
        if response.get('text') == signatures.get(key): score += 50
        if response.get('text', '').strip(' .!').lower() == hero['name_loc'].strip(' .!').lower(): score += 15
        if len(response.get('text', '')) > 150: score -= 15
        candidates.append((score, response, historic))
    candidates.sort(key=lambda x: x[0], reverse=True)
    for _, response, historic in candidates:
        try:
            audio_source = VPK + response['mp3']
            audio = fetch(audio_source)
            if len(audio) < 300: continue
            audio_path = PUBLIC / f'audio/{key}.mp3'
            if audio[:4] == b'RIFF':
                wav_path = CACHE / f'{key}.wav'
                wav_path.write_bytes(audio)
                subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav_path), '-codec:a', 'libmp3lame', '-b:a', '96k', str(audio_path)], check=True)
                record['audioConversion'] = 'Source WAV converted to 96 kbps MP3; no generated/replacement voice.'
            else:
                audio_path.write_bytes(audio)
            record.update({'audio': f'assets/audio/{key}.mp3', 'audioSource': audio_source, 'quote': response.get('text', '') or '(Hero vocalization)', 'responseId': response['name'], 'historicalLineVerified': bool(old and historic), 'responseSource': DB + f'responses/{response_key}.json'})
            break
        except Exception: continue
    if 'audio' not in record: raise RuntimeError(f'No playable audio for {key}')
    print(key, 'classic' if old else 'new', 'historical-line' if record['historicalLineVerified'] else '', flush=True)
    return key, record

with ThreadPoolExecutor(max_workers=8) as pool:
    for key, record in pool.map(process, roster): records[key] = record
# Freeze provenance and game records as one auditable object.
(ROOT / 'src/data').mkdir(parents=True, exist_ok=True)
(ROOT / 'src/data/heroes.json').write_text(json.dumps(records, indent=2) + '\n')
# Preserve all original voices too, even where the curated signature differs.
for p in (ROOT.parent / 'main/res/raw').glob('*.mp3'):
    shutil.copy2(p, PUBLIC / 'original' / p.name)
for name in ['bg_main', 'bg_start_screen', 'bg_end']:
    p = next(p for p in original_dir.iterdir() if p.stem.lower() == name)
    image(p.read_bytes(), f'original/{name}.webp', 1280)
manifest = {}
for p in sorted(PUBLIC.rglob('*')):
    if p.is_file() and p.suffix in ['.mp3', '.webp']:
        manifest[str(p.relative_to(ROOT / 'public'))] = {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
(ROOT / 'research/asset-checksums.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('TOTAL',len(records),'classic',sum(x['classic'] for x in records.values()),'historical lines',sum(x['historicalLineVerified'] for x in records.values()))
