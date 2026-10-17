"""Il caso svolto dell'articolo, numero per numero.

Riproduce l'esempio della figura e del testo: ingressi 1, 0 e 1; pesi 0,5,
-0,3 e 0,1; soglia 0,8; tasso di apprendimento 0,5. Un errore, una
correzione, e l'esempio e' imparato - col secondo peso che non si muove,
perche' il suo ingresso era spento.
"""

ingressi = [1, 0, 1]
pesi = [0.5, -0.3, 0.1]
soglia = 0.8
tasso = 0.5
risposta_giusta = 1

somma = sum(p * x for p, x in zip(pesi, ingressi))
risposta = 1 if somma > soglia else 0
print(f"Somma pesata: {somma:.1f}  (soglia {soglia}) -> risposta {risposta}")

errore = risposta_giusta - risposta
print(f"Risposta giusta: {risposta_giusta} -> errore {errore}")

pesi = [p + tasso * errore * x for p, x in zip(pesi, ingressi)]
soglia = soglia - tasso * errore
print(f"Pesi corretti: {[round(p, 1) for p in pesi]}  (il secondo non si muove)")
print(f"Soglia corretta: {soglia:.1f}")

somma = sum(p * x for p, x in zip(pesi, ingressi))
risposta = 1 if somma > soglia else 0
print(f"Stesso esempio: somma {somma:.1f} > soglia {soglia:.1f} -> risposta {risposta}")

assert risposta == risposta_giusta, "l'esempio dovrebbe essere imparato"
print("Un errore, una correzione: imparato.")
