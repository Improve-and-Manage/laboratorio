import torch, pickle, json, numpy as np, os

G = 32  # dimensione del gruppo
ck = torch.load('nanoGPT/out-commedia-char/ckpt.pt', map_location='cpu')
cfg = ck['model_args']
sd = {k.replace('_orig_mod.', ''): v for k, v in ck['model'].items()}
meta = pickle.load(open('nanoGPT/data/commedia_char/meta.pkl', 'rb'))
itos = ''.join(meta['itos'][i] for i in range(meta['vocab_size']))

ordine = ['transformer.wte.weight', 'transformer.wpe.weight']
for l in range(cfg['n_layer']):
    p = f'transformer.h.{l}.'
    ordine += [p+'ln_1.weight', p+'attn.c_attn.weight', p+'attn.c_proj.weight',
               p+'ln_2.weight', p+'mlp.c_fc.weight', p+'mlp.c_proj.weight']
ordine += ['transformer.ln_f.weight']

blob = bytearray(); manifest = []
for nome in ordine:
    w = sd[nome].float().numpy()
    voce = {'nome': nome, 'forma': list(w.shape), 'offset': len(blob)}
    if w.ndim == 2:
        r, c = w.shape
        assert c % G == 0, (nome, c)
        wg = w.reshape(r, c//G, G)
        scala = np.abs(wg).max(axis=2, keepdims=True) / 7.0
        scala[scala == 0] = 1e-8
        q = np.clip(np.round(wg/scala), -7, 7).astype(np.int8).reshape(r, c)
        # impacchetta: due valori per byte (basso = pari, alto = dispari), senza segno con +8
        u = (q + 8).astype(np.uint8)
        pk = (u[:, 0::2] | (u[:, 1::2] << 4)).astype(np.uint8)
        voce.update(tipo='int4_gruppo', gruppo=G)
        blob += pk.tobytes()
        voce['offset_scale'] = len(blob)
        blob += scala.astype(np.float32).tobytes()
    else:
        voce['tipo'] = 'float32'
        blob += w.astype(np.float32).tobytes()
    manifest.append(voce)

os.makedirs('export4', exist_ok=True)
open('export4/pesi.bin', 'wb').write(bytes(blob))
json.dump({'config': {k: cfg[k] for k in ('n_layer','n_head','n_embd','block_size','vocab_size','bias')},
           'quantizzazione': {'bit': 4, 'gruppo': G},
           'vocabolario': itos, 'tensori': manifest}, open('export4/manifest.json', 'w'), ensure_ascii=False)
print('pesi.bin (4 bit):', len(blob), 'byte =', round(len(blob)/1024, 1), 'KB')
