import torch, json, pickle, numpy as np, sys
sys.path.insert(0, 'nanoGPT')
from model import GPT, GPTConfig

ck = torch.load('nanoGPT/out-commedia-char/ckpt.pt', map_location='cpu')
modello = GPT(GPTConfig(**ck['model_args']))
modello.load_state_dict({k.replace('_orig_mod.',''): v for k,v in ck['model'].items()})
modello.eval()
meta = pickle.load(open('nanoGPT/data/commedia_char/meta.pkl','rb'))
stoi, itos = meta['stoi'], meta['itos']

def carica(dirp):
    man = json.load(open(f'{dirp}/manifest.json'))
    blob = open(f'{dirp}/pesi.bin','rb').read()
    T = {}
    for v in man['tensori']:
        forma = v['forma']
        if v['tipo'] == 'int8_riga':
            n = forma[0]*forma[1]
            q = np.frombuffer(blob, np.int8, n, v['offset']).reshape(forma).astype(np.float32)
            s = np.frombuffer(blob, np.float32, forma[0], v['offset_scale']).reshape(-1,1)
            T[v['nome']] = q*s
        elif v['tipo'] == 'int4_gruppo':
            r, c = forma; G = v['gruppo']
            pk = np.frombuffer(blob, np.uint8, r*c//2, v['offset']).reshape(r, c//2)
            u = np.empty((r, c), np.uint8); u[:,0::2] = pk & 15; u[:,1::2] = pk >> 4
            q = u.astype(np.float32) - 8
            s = np.frombuffer(blob, np.float32, r*(c//G), v['offset_scale']).reshape(r, c//G, 1)
            T[v['nome']] = (q.reshape(r, c//G, G)*s).reshape(r, c)
        else:
            T[v['nome']] = np.frombuffer(blob, np.float32, forma[0], v['offset']).astype(np.float32)
    return T, man['config']

def fai_avanti(T, cfg):
    def ln(x,w):
        m=x.mean(-1,keepdims=True); vr=x.var(-1,keepdims=True); return (x-m)/np.sqrt(vr+1e-5)*w
    def gelu(x): return 0.5*x*(1+np.tanh(np.sqrt(2/np.pi)*(x+0.044715*x**3)))
    E,H = cfg['n_embd'], cfg['n_head']
    def avanti(idx):
        x = T['transformer.wte.weight'][idx] + T['transformer.wpe.weight'][:len(idx)]
        for l in range(cfg['n_layer']):
            p=f'transformer.h.{l}.'
            h = ln(x, T[p+'ln_1.weight']); qkv = h @ T[p+'attn.c_attn.weight'].T
            q,k,v = np.split(qkv,3,-1); Tn=len(idx); hd=E//H
            q=q.reshape(Tn,H,hd).transpose(1,0,2); k=k.reshape(Tn,H,hd).transpose(1,0,2); v=v.reshape(Tn,H,hd).transpose(1,0,2)
            att = q@k.transpose(0,2,1)/np.sqrt(hd)
            att[:, np.triu(np.ones((Tn,Tn)),1).astype(bool)] = -1e9
            att = np.exp(att-att.max(-1,keepdims=True)); att/=att.sum(-1,keepdims=True)
            x = x + (att@v).transpose(1,0,2).reshape(Tn,E) @ T[p+'attn.c_proj.weight'].T
            h = ln(x, T[p+'ln_2.weight'])
            x = x + gelu(h @ T[p+'mlp.c_fc.weight'].T) @ T[p+'mlp.c_proj.weight'].T
        return ln(x, T['transformer.ln_f.weight']) @ T['transformer.wte.weight'].T
    return avanti

T8, cfg = carica('export'); T4, _ = carica('export4')
a8, a4 = fai_avanti(T8, cfg), fai_avanti(T4, cfg)

brano = open('commedia.txt').read()[3000:3128]
idx = [stoi[c] for c in brano]
with torch.no_grad():
    # logits del riferimento su OGNI posizione: passiamo finestre crescenti? costoso; usiamo il trucco: targets fittizi
    lt = modello(torch.tensor([idx]), targets=torch.tensor([idx]))[0][0].numpy()
l8, l4 = a8(np.array(idx)), a4(np.array(idx))
def top1(l): return l.argmax(-1)
conc8 = float((top1(lt)==top1(l8)).mean()); conc4 = float((top1(lt)==top1(l4)).mean())
def probs(l):
    e=np.exp(l-l.max(-1,keepdims=True)); return e/e.sum(-1,keepdims=True)
d8 = float(np.abs(probs(lt)-probs(l8)).max()); d4 = float(np.abs(probs(lt)-probs(l4)).max())
print(f'concordanza primo candidato su {len(idx)} posizioni: 8bit {conc8:.1%} | 4bit {conc4:.1%}')
print(f'massima differenza di probabilita: 8bit {d8:.4f} | 4bit {d4:.4f}')
# campione dal 4 bit, temperatura 0.8
rng = np.random.default_rng(42)
seq = [stoi[c] for c in "Nel mezzo del"]
for _ in range(300):
    lg = a4(np.array(seq[-cfg['block_size']:]))[-1]/0.8
    p = np.exp(lg-lg.max()); p/=p.sum()
    seq.append(int(rng.choice(len(p), p=p)))
print('--- campione 4 bit ---')
print(''.join(itos[i] for i in seq))
