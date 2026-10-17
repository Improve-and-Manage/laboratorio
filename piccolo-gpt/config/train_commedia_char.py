out_dir = 'out-commedia-char'
eval_interval = 250
eval_iters = 100
log_interval = 50
always_save_checkpoint = False
dataset = 'commedia_char'
batch_size = 64
block_size = 128
n_layer = 4
n_head = 4
n_embd = 128
dropout = 0.1
learning_rate = 1e-3
max_iters = 5000
lr_decay_iters = 5000
min_lr = 1e-4
beta2 = 0.99
warmup_iters = 100
device = 'mps'
compile = False

import torch as _t
_t.set_float32_matmul_precision("medium")
