# Recortes para sacar la caja y dejar solo el frasco.
# crop: (left, top, right, bottom) en px de la foto original (None = borde).
# white: rectángulos (coordenadas originales) que se pintan de blanco.
CROPS = {
    "al-haramain-amber-oud": {"crop": (267, 116, 396, 364)},
    "asad-zanzibar": {"crop": (132, 70, 181, 197)},
    "chants": {"crop": (243, 150, 403, 362)},
    "hayaati-black": {"crop": (60, 120, 179, 392)},
    "mayar-natural-intense": {"crop": (104, 118, 203, 364)},
    "odyssey-candee": {"crop": (204, 136, 347, 352)},
    "odyssey-chocolat": {"crop": (233, 160, 373, 366)},
    "odyssey-homme": {"crop": (26, 104, 200, 360), "white": [(172, 0, 999, 115), (172, 166, 999, 999), (199, 0, 999, 999)]},
    "oud-for-glory": {"crop": (300, 164, 470, 482), "white": [(0, 0, 333, 250), (0, 0, 307, 999)]},
    "the-kingdom": {"crop": (106, 168, 252, 438)},
    "victoria": {"crop": (76, 198, 213, 449)},
}
