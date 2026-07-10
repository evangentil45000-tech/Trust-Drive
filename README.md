# 🚗 TrustDrive

**La bonne affaire, ou l'arnaque ? Sachez-le avant d'y aller.**

TrustDrive analyse les annonces de voitures d'occasion (Le bon coin) : collez le lien,
confirmez le véhicule, et obtenez un rapport complet — cote calculée, défauts connus de
la motorisation, budget d'usage, contre-visite guidée et stratégie de négociation chiffrée.

## Ce que contient le rapport

- **Indice de confiance 0–100** construit facteur par facteur (prix vs cote, kilométrage,
  fiabilité documentée de la motorisation, Crit'Air/ZFE, âge)
- **Prix vs cote estimée** : cote reconstruite = prix neuf × courbe de décote du segment
  × correction kilométrage (planchers spécifiques pour sportives et véhicules de collection)
- **Défauts connus** par famille moteur/boîte : courroie humide PureTech, chaîne N47,
  mécatronique DSG7, roulement IMS, embrayage e-gear… avec coûts et fenêtres kilométriques
- **Détection d'anomalies** : prix anormalement bas → alerte arnaque explicite,
  kilométrage incohérent → vérifications Histovec
- **Contre-visite guidée** : quoi écouter/contrôler sur place, quelles questions poser
- **Négociation** : fourchette d'offre argumentée + message prêt à envoyer au vendeur

## La base de connaissances

| | |
|---|---|
| Marques | **109** — de Dacia à Bugatti, VSP et youngtimers inclus |
| Modèles | **1 001** — générations distinctes (une 996 n'est pas une 992) |
| Familles moteur & boîte | **216** — avec défauts réels documentés |
| Points de contrôle | **330+** — contrôles sur place et questions vendeur |

Les défauts proviennent des rappels constructeurs, bulletins techniques et retours
d'ateliers documentés. Les cotes sont des **estimations** affichées comme telles.

## Lancer le site

Aucune dépendance, aucun build : c'est un site statique.

```bash
# ouvrir directement
open index.html
# ou servir localement
python3 -m http.server 8000
```

Le déploiement GitHub Pages est automatique à chaque push sur `main`
(workflow `.github/workflows/pages.yml`).

## Structure

```
index.html   — interface + moteur d'analyse (identification, scoring, rendu)
db.js        — base de connaissances (marques, modèles, familles moteur, décotes)
```

## Limites assumées

Les liens Le bon coin ne contiennent qu'un identifiant d'annonce : TrustDrive détecte
marque/modèle/année quand ils figurent dans le lien, sinon il les fait confirmer en
quatre champs — il n'invente jamais. La lecture automatique complète de l'annonce
nécessitera un back-end (scraping + CORS), prévu pour la version connectée.

TrustDrive est un service indépendant, non affilié à leboncoin.fr. Les rapports
éclairent votre décision mais ne remplacent ni une expertise mécanique ni un
historique officiel (Histovec).
