# tuples
(a, b) = (1, 2)
print(a)
print(b)


# Bambous
def deplacer_bambous(hauteur, debut, fin):
  # Condition d'arrêt
  if debut == fin: return
  # Recherche d'un maximum
  maxi = debut
  for i in range(debut, fin):
    if hauteur[maxi] < hauteur[i]:
      maxi = i
  # On place le maximum au milieu
  milieu = (debut + fin) // 2
  hauteur[milieu], hauteur[maxi] = hauteur[maxi], hauteur[milieu]
  # On place les bambous récursivement
  deplacer_bambous(hauteur, debut, milieu)
  deplacer_bambous(hauteur, milieu+1, fin)

bambous = [14, 15, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
deplacer_bambous(bambous, 0, len(bambous))
print(bambous)
