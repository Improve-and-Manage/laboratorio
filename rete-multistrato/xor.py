"""La rete minima che abbatte il muro: due ingressi, due neuroni nascosti,
un'uscita. I pesi sono scritti a mano - l'addestramento li troverebbe da
solo, ed e' il tema dell'articolo - per mostrare che il problema XOR,
impossibile per un percettrone, si risolve impilandone tre.

Il primo neurone nascosto si accende se ALMENO UNO degli ingressi e' acceso
(un OR); il secondo se lo sono ENTRAMBI (un AND); l'uscita si accende se il
primo e' acceso ma il secondo no. Accompagna l'articolo sulle reti
multistrato di improveandmanage.com. Nessuna dipendenza: basta Python 3.
"""


def percettrone(ingressi, pesi, soglia):
    somma = sum(p * x for p, x in zip(pesi, ingressi))
    return 1 if somma > soglia else 0


def rete_xor(a, b):
    almeno_uno = percettrone([a, b], [1, 1], soglia=0.5)   # neurone nascosto 1: OR
    entrambi = percettrone([a, b], [1, 1], soglia=1.5)     # neurone nascosto 2: AND
    uscita = percettrone([almeno_uno, entrambi], [1, -1], soglia=0.5)
    return almeno_uno, entrambi, uscita


print("a b | almeno uno  entrambi | uscita (XOR)")
for a in (0, 1):
    for b in (0, 1):
        n1, n2, y = rete_xor(a, b)
        print(f"{a} {b} |     {n1}          {n2}     |   {y}")
        assert y == (a ^ b), "la rete deve calcolare XOR"
print("La retta che il percettrone non trovava esiste nello spazio dei due")
print("neuroni nascosti: uscita accesa quando (almeno uno) - (entrambi) > 0,5.")
