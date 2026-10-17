import torch, json, pickle, numpy as np, sys
sys.path.insert(0, 'nanoGPT')
from model import GPT, GPTConfig

ck = torch.load('nanoGPT/out-commedia-char/ckpt.pt', map_location='cpu')
modello = GPT(GPTConfig(**ck['model_args']))
modello.load_state_dict({k.replace('_orig_mod.',''): v for k,v in ck['model'].items()})
modello.eval()

man = json.load(open('export/manifest.json'))
blob = open('export/pesi.bin','rb').read()
cfg = man['config']
T = {}
for v in man['tensori']:
    forma = v['forma']
    if v['tipo'] == 'int8_riga':
        n = forma[0]*forma[1]
        q = np.frombuffer(blob, dtype=np.int8, count=n, offset=v['offset']).reshape(forma).astype(np.float32)
        s = np.frombuffer(blob, dtype=np.float32, count=forma[0], offset=v['offset_scale']).reshape(forma[0],1)
        T[v['nome']] = q*s
    else:
        T[v['nome']] = np.frombuffer(blob, dtype=np.float32, count=forma[0], offset=v['offset']).astype(np.float32)

def ln(x, w): 
    m = x.mean(-1, keepdims=True); vr = x.var(-1, keepdims=True)
    return (x-m)/np.sqrt(vr+1e-5)*w
def gelu(x): return 0.5*x*(1+np.tanh(np.sqrt(2/np.pi)*(x+0.044715*x**3)))

def avanti(idx):
    E, H, L = cfg['n_embd'], cfg['n_head'], cfg['n_layer']
    x = T['transformer.wte.weight'][idx] + T['transformer.wpe.weight'][:len(idx)]
    for l in range(L):
        p = f'transformer.h.{l}.'
        h = ln(x, T[p+'ln_1.weight'])
        qkv = h @ T[p+'attn.c_attn.weight'].T
        q,k,v = np.split(qkv, 3, axis=-1)
        Tn = len(idx); hd = E//H
        q = q.reshape(Tn,H,hd).transpose(1,0,2); k = k.reshape(Tn,H,hd).transpose(1,0,2); v = v.reshape(Tn,H,hd).transpose(1,0,2)
        att = q @ k.transpose(0,2,1) / np.sqrt(hd)
        mask = np.triu(np.ones((Tn,Tn)), 1).astype(bool)
        att[:, mask] = -1e9
        att = np.exp(att - att.max(-1, keepdims=True)); att /= att.sum(-1, keepdims=True)
        y = (att @ v).transpose(1,0,2).reshape(Tn,E)
        x = x + y @ T[p+'attn.c_proj.weight'].T
        h = ln(x, T[p+'ln_2.weight'])
        x = x + gelu(h @ T[p+'mlp.c_fc.weight'].T) @ T[p+'mlp.c_proj.weight'].T
    x = ln(x, T['transformer.ln_f.weight'])
    return x @ T['transformer.wte.weight'].T   # lm_head legato

meta = pickle.load(open('nanoGPT/data/commedia_char/meta.pkl','rb'))
stoi = meta['stoi']
prompt = "Nel mezzo del cammin di nostra vita\n  mi ritrovai per una selva oscura"
idx = [stoi[c] for c in prompt]
lg_np = avanti(np.array(idx))
with torch.no_grad():
    lg_t = modello(torch.tensor([idx]))[0][0,-1].numpy()  # nanoGPT: solo ultima posizione in eval
p_np = np.exp(lg_np[-1]-lg_np[-1].max()); p_np/=p_np.sum()
p_t  = np.exp(lg_t-lg_t.max()); p_t/=p_t.sum()
print('top1 uguale:', p_np.argmax()==p_t.argmax(), '| char:', repr(meta['itos'][int(p_np.argmax())]))
print('massima differenza di probabilità:', float(np.abs(p_np-p_t).max()))
# generazione greedy di 120 caratteri coi pesi quantizzati
seq = idx[:]
for _ in range(120):
    lg = avanti(np.array(seq[-cfg['block_size']:]))
    seq.append(int(lg[-1].argmax()))
print(''.join(meta['itos'][i] for i in seq[len(idx):]))
