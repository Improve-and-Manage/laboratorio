import torch, pickle, json, numpy as np, os

ck = torch.load('nanoGPT/out-commedia-char/ckpt.pt', map_location='cpu')
cfg = ck['model_args']
sd = {k.replace('_orig_mod.', ''): v for k, v in ck['model'].items()}
meta = pickle.load(open('nanoGPT/data/commedia_char/meta.pkl', 'rb'))
itos = ''.join(meta['itos'][i] for i in range(meta['vocab_size']))

ordine = ['transformer.wte.weight', 'transformer.wpe.weight']
for l in range(cfg['n_layer']):
    p = f'transformer.h.{l}.'
    ordine += [p+'ln_1.weight',
               p+'attn.c_attn.weight',
               p+'attn.c_proj.weight',
               p+'ln_2.weight',
               p+'mlp.c_fc.weight',
               p+'mlp.c_proj.weight']
ordine += ['transformer.ln_f.weight']

os.makedirs('export', exist_ok=True)
blob = bytearray(); manifest = []
for nome in ordine:
    w = sd[nome].float().numpy()
    voce = {'nome': nome, 'forma': list(w.shape), 'offset': len(blob)}
    if w.ndim == 2:
        scala = np.abs(w).max(axis=1, keepdims=True) / 127.0
        scala[scala == 0] = 1e-8
        q = np.clip(np.round(w / scala), -127, 127).astype(np.int8)
        voce['tipo'] = 'int8_riga'
        blob += q.tobytes()
        voce['offset_scale'] = len(blob)
        blob += scala.astype(np.float32).tobytes()
    else:
        voce['tipo'] = 'float32'
        blob += w.astype(np.float32).tobytes()
    manifest.append(voce)

open('export/pesi.bin', 'wb').write(bytes(blob))
json.dump({'config': {k: cfg[k] for k in ('n_layer','n_head','n_embd','block_size','vocab_size','bias')},
           'vocabolario': itos, 'tensori': manifest}, open('export/manifest.json', 'w'), ensure_ascii=False)
print('pesi.bin:', len(blob), 'byte =', round(len(blob)/1024/1024, 3), 'MB')
print('manifest:', os.path.getsize('export/manifest.json'), 'byte')
print('config:', {k: cfg[k] for k in ('n_layer','n_head','n_embd','block_size','vocab_size','bias')})
