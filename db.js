/* ============================================================
   TRUST DRIVE — BASE DE CONNAISSANCES AUTOMOBILE v2
   Familles moteur réelles (défauts connus, coûts, fenêtres km),
   ~95 modèles / 30 marques du marché français, courbes de décote
   par segment. Sources : rappels constructeurs, TSB, retours
   ateliers et cotes marché publiques (valeurs indicatives).
   ============================================================ */
'use strict';

/* ---------- Courbes de rétention de valeur (âge 0 → 12 ans) ---------- */
const DEPRECIATION = {
  citadine:   [1,.85,.76,.68,.62,.57,.52,.48,.44,.40,.37,.34,.31],
  compacte:   [1,.84,.74,.66,.60,.55,.50,.46,.42,.38,.35,.32,.30],
  berline:    [1,.81,.70,.61,.54,.49,.44,.40,.37,.34,.31,.29,.27],
  suv:        [1,.85,.76,.68,.62,.57,.52,.48,.44,.41,.38,.35,.32],
  sport:      [1,.87,.79,.73,.68,.64,.61,.58,.56,.54,.52,.50,.48],
  supercar:   [1,.90,.85,.81,.78,.76,.74,.72,.71,.70,.69,.68,.67],
  electrique: [1,.76,.64,.55,.48,.43,.39,.35,.32,.29,.27,.25,.23]
};
const SEG_LABEL = {citadine:"Citadine",compacte:"Compacte",berline:"Berline",suv:"SUV / Crossover",sport:"Sportive",supercar:"GT / Supercar",electrique:"Électrique"};
const EXP_KM_YEAR = {citadine:12000,compacte:14000,berline:16000,suv:14000,sport:8000,supercar:3500,electrique:12000};
const MAINT_BASE = {citadine:450,compacte:560,berline:720,suv:660,sport:1400,supercar:3800,electrique:320};

/* ---------- Familles moteur (issues: t=texte, sev, cost€, km=seuil, yMax/yMin=années concernées, chk=contrôle sur place, ask=question vendeur) ---------- */
const ENGINES = {
  /* --- Groupe PSA / Stellantis --- */
  eb2_puretech:{label:"1.0–1.2 PureTech",fuel:"Essence",conso:5.4,rel:52,issues:[
    {t:"Courroie de distribution humide : dégradation dans l'huile — remplacement impératif entre 60 et 100 000 km (≈ 700 €)",sev:"bad",cost:700,km:45000,yMax:2022,chk:"Ouvrir le bouchon d'huile : dépôts noirs de courroie = fuyez",ask:"La courroie de distribution a-t-elle été remplacée ? Facture ?"},
    {t:"Consommation d'huile à surveiller (jusqu'à 0,5 L / 1 000 km sur certains blocs)",sev:"warn",km:50000,chk:"Contrôler le niveau d'huile moteur froid"},
    {t:"Pompe à eau et thermostat fragiles (≈ 300 €)",sev:"warn",cost:300,km:80000}]},
  psa_bluehdi15:{label:"1.5 BlueHDi",fuel:"Diesel",conso:4.2,rel:68,issues:[
    {t:"Capteurs et injecteur AdBlue capricieux (≈ 400 €)",sev:"warn",cost:400,km:80000,ask:"Des voyants AdBlue/dépollution sont-ils apparus ?"},
    {t:"Encrassement EGR/FAP en usage urbain exclusif",sev:"warn",km:60000,chk:"Essai routier : accélération franche, aucune fumée noire"}]},
  psa_bluehdi20:{label:"2.0 BlueHDi",fuel:"Diesel",conso:4.9,rel:76,issues:[
    {t:"FAP à contrôler au-delà de 150 000 km (≈ 800 € si colmaté)",sev:"warn",cost:800,km:150000}]},
  psa_thp:{label:"1.6 THP / PureTech turbo",fuel:"Essence",conso:6.8,rel:46,issues:[
    {t:"Chaîne de distribution et tendeur fragiles : cliquetis à froid = intervention 1 200 €",sev:"bad",cost:1200,km:60000,yMax:2019,chk:"Démarrage moteur froid : aucun cliquetis métallique les 5 premières secondes",ask:"La chaîne de distribution a-t-elle été remplacée ?"},
    {t:"Consommation d'huile et encrassement admission",sev:"warn",km:80000}]},
  psa_vti:{label:"1.4–1.6 VTi",fuel:"Essence",conso:6.2,rel:62,issues:[
    {t:"Chaîne de distribution à surveiller après 100 000 km",sev:"warn",cost:900,km:100000}]},
  ev_psa:{label:"Électrique (e-CMP 136 ch)",fuel:"Électrique",conso:"15,4 kWh",rel:74,issues:[
    {t:"Chargeur embarqué : quelques remplacements sous garantie recensés",sev:"warn",km:60000,ask:"Le véhicule est-il à jour de ses mises à jour constructeur ?"}]},

  /* --- Renault / Nissan / Dacia --- */
  ren_tce90:{label:"0.9–1.0 TCe 90–100",fuel:"Essence",conso:5.3,rel:60,issues:[
    {t:"Bobines et bougies à changer tôt (≈ 180 €)",sev:"warn",cost:180,km:60000},
    {t:"Embrayage parfois faible avant 100 000 km",sev:"warn",cost:800,km:80000,chk:"Essai : patinage en côte en 3e"}]},
  ren_tce_12:{label:"1.2 TCe 115–130 (av. 2018)",fuel:"Essence",conso:6.0,rel:44,issues:[
    {t:"Consommation d'huile excessive pouvant mener à la casse moteur — défaut notoire du 1.2 TCe",sev:"bad",cost:3500,km:60000,yMax:2018,chk:"Niveau d'huile + traces de rajouts fréquents dans le carnet",ask:"Le moteur a-t-il fait l'objet de la campagne de reprogrammation Renault ?"}]},
  ren_tce13:{label:"1.3 TCe 130–160",fuel:"Essence",conso:5.8,rel:70,issues:[
    {t:"Calaminage admission (injection directe) au-delà de 100 000 km",sev:"warn",cost:400,km:100000}]},
  ren_dci15:{label:"1.5 dCi / Blue dCi",fuel:"Diesel",conso:4.0,rel:70,issues:[
    {t:"Vanne EGR à nettoyer/remplacer (≈ 350 €)",sev:"warn",cost:350,km:100000},
    {t:"Injecteurs sensibles à la qualité du gazole après 130 000 km",sev:"warn",cost:900,km:130000}]},
  ren_etech:{label:"E-Tech hybride 140–145",fuel:"Hybride",conso:4.5,rel:72,issues:[
    {t:"Boîte à crabots : à-coups possibles à basse vitesse (mises à jour correctives)",sev:"warn",km:20000,chk:"Essai en ville : passages de rapports sans secousses"}]},
  ev_zoe:{label:"R90–R135 électrique",fuel:"Électrique",conso:"13,2 kWh",rel:78,issues:[
    {t:"Batterie parfois en LOCATION (39–120 €/mois à vie) : vérifiez le contrat",sev:"warn",ask:"La batterie est-elle en pleine propriété ou en location Diac ?"},
    {t:"Réducteur bruyant sur les premiers modèles",sev:"warn",yMax:2016,km:60000}]},
  ev_spring:{label:"Spring 45–65 électrique",fuel:"Électrique",conso:"13,9 kWh",rel:60,issues:[
    {t:"Charge lente (6,6 kW), finition économique, tenue de route limitée sur autoroute",sev:"warn"}]},

  /* --- Groupe VW --- */
  vag_ea211:{label:"1.0–1.5 TSI (EA211)",fuel:"Essence",conso:5.6,rel:76,issues:[
    {t:"Pompe à eau / thermostat à prévoir vers 90 000 km (≈ 350 €)",sev:"warn",cost:350,km:90000},
    {t:"1.5 TSI av. 2019 : à-coups à froid (« kangourou ») corrigés par mise à jour",sev:"warn",yMax:2019,chk:"Essai moteur froid : accélérations douces sans à-coups"}]},
  vag_ea111:{label:"1.2–1.4 TSI (EA111, av. 2015)",fuel:"Essence",conso:6.2,rel:42,issues:[
    {t:"Chaîne de distribution qui s'allonge : risque de casse — cliquetis à froid = 900 € minimum",sev:"bad",cost:900,km:60000,chk:"Démarrage à froid impératif : tout bruit de chaîne disqualifie",ask:"La chaîne et le tendeur ont-ils été remplacés ?"},
    {t:"Consommation d'huile importante sur les 1.4 TSI twincharger",sev:"bad",cost:2500,km:80000}]},
  vag_ea888:{label:"1.8–2.0 TSI (EA888)",fuel:"Essence",conso:7.0,rel:70,issues:[
    {t:"Consommation d'huile à surveiller (gén. antérieures à 2013 surtout)",sev:"warn",km:100000,chk:"Niveau + demander la fréquence des appoints"},
    {t:"Pompe à eau (≈ 400 €) et encrassement admission",sev:"warn",cost:400,km:90000}]},
  vag_ea288:{label:"1.6–2.0 TDI (EA288)",fuel:"Diesel",conso:4.6,rel:78,issues:[
    {t:"Vanne EGR à prévoir vers 130 000 km (≈ 600 €)",sev:"warn",cost:600,km:130000},
    {t:"Volant moteur bi-masse en fin de vie vers 150 000 km (≈ 900 €)",sev:"warn",cost:900,km:150000,chk:"Vibrations/claquements au ralenti embrayé"}]},

  /* --- BMW / Mini --- */
  bmw_n47:{label:"2.0d (N47, 2007–2014)",fuel:"Diesel",conso:5.0,rel:40,issues:[
    {t:"Chaîne de distribution (côté boîte !) : défaut notoire — casse = moteur HS, remplacement préventif 3 200 €",sev:"bad",cost:3200,km:80000,chk:"Moteur froid : bruit de chaîne à l'arrière du moteur = danger",ask:"La chaîne de distribution a-t-elle été refaite ? Facture ?"},
    {t:"Volant bi-masse et injecteurs sensibles",sev:"warn",cost:1100,km:140000}]},
  bmw_b47:{label:"2.0d (B47, 2014+)",fuel:"Diesel",conso:4.9,rel:65,issues:[
    {t:"Chaîne de distribution à surveiller au-delà de 120 000 km (2 500 € si usée)",sev:"warn",cost:2500,km:120000,chk:"Bruit métallique à froid",ask:"Des factures d'entretien récentes chez BMW ?"},
    {t:"Rappel refroidisseur EGR (risque incendie) : vérifier qu'il a été traité",sev:"warn",yMax:2019,ask:"Le rappel EGR a-t-il été effectué ?"}]},
  bmw_b48:{label:"1.5–2.0i (B38/B48)",fuel:"Essence",conso:6.4,rel:78,issues:[
    {t:"Pompe à eau électrique à prévoir vers 120 000 km (≈ 600 €)",sev:"warn",cost:600,km:120000}]},
  bmw_6cyl:{label:"3.0i 6 cylindres (B58/N55)",fuel:"Essence",conso:8.3,rel:74,issues:[
    {t:"Joint de carter et bobines : entretien préventif conseillé",sev:"warn",cost:500,km:110000}]},
  bmw_s55:{label:"3.0 S55 (M3/M4)",fuel:"Essence",conso:10.2,rel:60,issues:[
    {t:"Moyeu de vilebrequin (crank hub) : renfort préventif recommandé en usage circuit (≈ 3 000 €)",sev:"warn",cost:3000,ask:"Le crank hub a-t-il été traité ? Usage circuit ?"},
    {t:"Consommables sport très coûteux (freins ≈ 2 000 €/train)",sev:"warn",cost:2000,km:40000}]},

  /* --- Mercedes --- */
  mb_om651:{label:"2.1 CDI (OM651)",fuel:"Diesel",conso:5.2,rel:64,issues:[
    {t:"Injecteurs Delphi défaillants sur les premières années (pris en charge tardivement)",sev:"bad",cost:1500,yMax:2011,km:60000,ask:"Les injecteurs ont-ils été remplacés (campagne Mercedes) ?"},
    {t:"Chaîne de distribution à écouter après 150 000 km",sev:"warn",cost:1800,km:150000}]},
  mb_om654:{label:"2.0d (OM654)",fuel:"Diesel",conso:4.7,rel:82,issues:[]},
  mb_m270:{label:"1.3–2.0 essence (M270/M282)",fuel:"Essence",conso:6.1,rel:74,issues:[
    {t:"Chaîne de distribution à contrôler après 130 000 km",sev:"warn",cost:1200,km:130000}]},

  /* --- Ford --- */
  ford_eco10:{label:"1.0 EcoBoost",fuel:"Essence",conso:5.9,rel:48,issues:[
    {t:"Courroie de distribution baignant dans l'huile : dégradation précoce — remplacement ≈ 900 € impératif",sev:"bad",cost:900,km:60000,chk:"Dépôts dans le carter d'huile ; historique des vidanges (huile spécifique WSS)",ask:"La courroie humide a-t-elle été remplacée ? Avec la bonne huile ?"},
    {t:"Durites de refroidissement / risque de surchauffe sur les premières séries",sev:"bad",cost:1200,yMax:2014,km:60000}]},
  ford_eco15:{label:"1.5 EcoBoost",fuel:"Essence",conso:6.4,rel:64,issues:[
    {t:"Sondes et thermostat fragiles",sev:"warn",cost:300,km:90000}]},
  ford_tdci:{label:"1.5 TDCi / EcoBlue",fuel:"Diesel",conso:4.3,rel:66,issues:[
    {t:"Injecteurs et EGR à surveiller après 120 000 km",sev:"warn",cost:700,km:120000}]},

  /* --- Toyota / Lexus / Honda / Mazda / Suzuki --- */
  toy_hsd:{label:"Hybride HSD",fuel:"Hybride",conso:4.3,rel:90,issues:[
    {t:"Batterie hybride : rarement avant 250 000 km (≈ 1 500 € reconditionnée)",sev:"warn",cost:1500,km:200000},
    {t:"Freins arrière qui grippent si le véhicule roule peu",sev:"warn",km:60000,chk:"Contrôler l'état des disques arrière"}]},
  toy_atmo:{label:"1.0–1.5 VVT-i",fuel:"Essence",conso:5.4,rel:86,issues:[]},
  honda_turbo:{label:"1.0–1.5 VTEC Turbo",fuel:"Essence",conso:6.0,rel:78,issues:[
    {t:"Dilution d'huile par l'essence sur 1.0/1.5 première génération (trajets courts)",sev:"warn",yMax:2019,chk:"Odeur d'essence sur la jauge d'huile"}]},
  mazda_sky:{label:"Skyactiv-G 2.0",fuel:"Essence",conso:6.1,rel:86,issues:[]},
  suzuki_jet:{label:"1.0–1.4 Boosterjet / Dualjet",fuel:"Essence",conso:5.2,rel:82,issues:[]},

  /* --- Hyundai / Kia --- */
  hk_tgdi:{label:"1.0–1.6 T-GDI",fuel:"Essence",conso:6.0,rel:70,issues:[
    {t:"Calaminage admission (injection directe) après 90 000 km",sev:"warn",cost:400,km:90000}]},
  hk_crdi:{label:"1.6 CRDi",fuel:"Diesel",conso:4.4,rel:72,issues:[
    {t:"FAP en usage urbain : régénérations à vérifier",sev:"warn",km:80000}]},
  hk_hev:{label:"Hybride 141–230",fuel:"Hybride",conso:4.8,rel:78,issues:[]},
  hk_ev:{label:"Électrique 136–204",fuel:"Électrique",conso:"15,0 kWh",rel:74,issues:[
    {t:"Kona EV : rappel batterie LG (risque incendie) — vérifier le remplacement",sev:"bad",yMax:2021,ask:"Le rappel batterie a-t-il été réalisé ? Justificatif ?"}]},

  /* --- Fiat / Alfa / Jeep --- */
  fiat_fire:{label:"1.2 69 Fire / FireFly",fuel:"Essence",conso:5.6,rel:70,issues:[]},
  fiat_twinair:{label:"0.9 TwinAir",fuel:"Essence",conso:6.2,rel:50,issues:[
    {t:"Consommation d'huile et distribution fragile — bien plus gourmand que l'homologation",sev:"warn",cost:600,km:70000}]},
  fiat_multiair:{label:"1.4 MultiAir",fuel:"Essence",conso:6.3,rel:55,issues:[
    {t:"Actuateur MultiAir défaillant (≈ 900 €)",sev:"warn",cost:900,km:80000}]},
  fiat_mjet:{label:"1.3–1.6 MultiJet",fuel:"Diesel",conso:4.5,rel:68,issues:[
    {t:"EGR et FAP à surveiller",sev:"warn",km:100000}]},
  alfa_22d:{label:"2.2 Diesel 150–210",fuel:"Diesel",conso:5.3,rel:65,issues:[
    {t:"EGR et capteurs : passages atelier fréquents les 2 premières années",sev:"warn",yMax:2018}]},
  alfa_veloce:{label:"2.0 Turbo 200–280",fuel:"Essence",conso:7.4,rel:68,issues:[
    {t:"Électronique embarquée capricieuse (capteurs, infotainment)",sev:"warn"}]},

  /* --- Opel (pré-PSA) --- */
  opel_sge:{label:"1.0–1.4 Turbo (av. 2019)",fuel:"Essence",conso:6.0,rel:60,issues:[
    {t:"Chaîne de distribution bruyante sur 1.0/1.4 Turbo",sev:"warn",cost:800,km:90000}]},
  opel_cdti:{label:"1.6 CDTI",fuel:"Diesel",conso:4.4,rel:66,issues:[
    {t:"Vanne EGR et FAP à surveiller",sev:"warn",km:100000}]},

  /* --- Volvo / Tesla --- */
  volvo_de:{label:"2.0 Drive-E (D3/D4/T4/B4)",fuel:"Diesel",conso:5.0,rel:74,issues:[
    {t:"Courroie de distribution à respecter scrupuleusement (120 000 km)",sev:"warn",cost:700,km:110000}]},
  tesla_3y:{label:"Électrique (SR+/LR/Perf)",fuel:"Électrique",conso:"14,9 kWh",rel:72,issues:[
    {t:"Bras de suspension avant : jeu prématuré possible (≈ 400 €)",sev:"warn",cost:400,km:80000},
    {t:"Qualité d'assemblage variable avant 2021 (joints, alignements)",sev:"warn",yMax:2021,chk:"Inspecter ajustements de carrosserie et infiltrations coffre"},
    {t:"Dégradation batterie normale ≈ 8 % à 150 000 km : vérifier l'autonomie réelle",sev:"warn",km:150000,chk:"Charge à 100 % et relever l'autonomie affichée"}]},
  tesla_s:{label:"Électrique (75D–P100D)",fuel:"Électrique",conso:"18,5 kWh",rel:64,issues:[
    {t:"Écran MCU1 (av. 2018) : défaillance mémoire connue (≈ 1 800 €)",sev:"bad",cost:1800,yMax:2018,ask:"Le MCU a-t-il été remplacé/upgradé ?"},
    {t:"Poignées affleurantes et suspension pneumatique coûteuses",sev:"warn",cost:900,km:120000}]},

  /* --- Land Rover / Jaguar --- */
  jlr_ing_d:{label:"2.0d Ingenium",fuel:"Diesel",conso:5.5,rel:45,issues:[
    {t:"Chaîne de distribution défaillante sur les premières années (casse recensées) — 2 800 €",sev:"bad",cost:2800,km:80000,yMax:2019,chk:"Bruit de chaîne à froid ; exiger l'historique complet",ask:"La chaîne a-t-elle été remplacée ? Entretien 100 % réseau ?"},
    {t:"Électronique et capteurs : pannes récurrentes hors garantie",sev:"warn",cost:600}]},
  jlr_ing_p:{label:"2.0 Ingenium essence",fuel:"Essence",conso:7.6,rel:58,issues:[
    {t:"Fiabilité électronique moyenne : privilégier un historique réseau complet",sev:"warn"}]},

  /* --- Porsche --- */
  por_flat6:{label:"Flat-6 3.0–4.0",fuel:"Essence",conso:9.6,rel:82,issues:[
    {t:"Entretien exclusivement spécialiste/centre Porsche recommandé (vidange PDK 60 000 km)",sev:"warn",cost:600,km:60000,ask:"Carnet tamponné centre Porsche ou spécialiste reconnu ?"}]},
  por_flat4:{label:"Flat-4 2.0–2.5 (718)",fuel:"Essence",conso:8.4,rel:74,issues:[
    {t:"Rien de rédhibitoire ; décote plus marquée que les 6 cylindres",sev:"warn"}]},
  por_v6:{label:"V6 3.0 (Macan/Cayenne)",fuel:"Essence",conso:9.8,rel:72,issues:[
    {t:"Boîtier de transfert (Macan) à surveiller après 100 000 km (≈ 1 500 €)",sev:"warn",cost:1500,km:100000},
    {t:"Fuites carter/joints possibles avec l'âge",sev:"warn",cost:800,km:120000}]},
  por_ev:{label:"Taycan électrique",fuel:"Électrique",conso:"20 kWh",rel:75,issues:[
    {t:"Rappel batterie 12 V sur premiers millésimes",sev:"warn",yMax:2021,ask:"Rappels constructeur soldés ?"}]},

  /* --- Exotiques --- */
  fer_v8:{label:"V8 Ferrari 3.9–4.5",fuel:"Essence",conso:13.5,rel:76,issues:[
    {t:"Entretien annuel obligatoire (≈ 1 800 €/an) — programme « Genuine Maintenance » 7 ans sur 458+",sev:"warn",cost:1800,ask:"Carnet concession complet ? Dernière révision ?"},
    {t:"Vérifier l'absence de témoins « slow down » et l'état des silentblocs moteur",sev:"warn",chk:"Diagnostic OBD Ferrari (SD3) avant achat fortement conseillé"}]},
  lam_gallardo:{label:"V10 5.0–5.2 (Gallardo)",fuel:"Essence",conso:15.0,rel:62,issues:[
    {t:"Boîte e-gear : embrayage robotisé à durée de vie courte — relevé d'usure indispensable (remplacement 8 000–10 000 €)",sev:"bad",cost:9000,km:20000,chk:"Faire lire le pourcentage d'usure embrayage à la valise",ask:"Quel est le relevé d'usure e-gear ? Factures d'embrayage ?"},
    {t:"Entretien annuel ≈ 2 000 € ; suspension et supports moteur à contrôler",sev:"warn",cost:2000}]},
  lam_huracan:{label:"V10 5.2 (Huracán 580–640)",fuel:"Essence",conso:14.0,rel:80,issues:[
    {t:"Boîte LDF7 double embrayage réputée robuste ; vidange régulière impérative",sev:"warn",cost:1200,ask:"Historique d'entretien réseau Lamborghini complet ?"},
    {t:"Consommables élevés : pneus ≈ 1 200 €/train, freins carbone-céramique très coûteux si équipé",sev:"warn",cost:1200,km:15000,chk:"Mesurer les disques ; vérifier l'absence d'usage piste intensif"}]},
  lam_v12:{label:"V12 6.5 (Aventador)",fuel:"Essence",conso:18.0,rel:70,issues:[
    {t:"Boîte ISR mono-embrayage : embrayage ≈ 6 000 € (20–30 000 km en usage sportif)",sev:"warn",cost:6000,km:20000,ask:"Relevé d'usure embrayage ISR ?"},
    {t:"Entretien annuel ≈ 2 500 € minimum",sev:"warn",cost:2500}]},
  lam_urus:{label:"V8 4.0 biturbo (Urus)",fuel:"Essence",conso:12.7,rel:70,issues:[
    {t:"Consommables démesurés : freins ≈ 6 000 €, pneus 23\" ≈ 2 000 €/train",sev:"warn",cost:2000,km:15000}]},
  mas_v6:{label:"3.0 V6 (Ghibli/Levante)",fuel:"Essence",conso:9.5,rel:55,issues:[
    {t:"Chaînes et tendeurs à écouter dès 90 000 km (≈ 1 800 €)",sev:"warn",cost:1800,km:90000},
    {t:"Électronique et multimédia capricieux ; réseau SAV limité",sev:"warn"},
    {t:"Décote très forte : négociez agressivement, revente difficile",sev:"warn"}]},
  aston_v8:{label:"V8 4.0 biturbo (AMG)",fuel:"Essence",conso:11.5,rel:72,issues:[
    {t:"Base moteur AMG fiable ; électronique Aston à vérifier poste par poste",sev:"warn",chk:"Tester chaque équipement (vitres, clim, infotainment)"}]},
  mcl_v8:{label:"V8 3.8–4.0 (McLaren)",fuel:"Essence",conso:12.5,rel:58,issues:[
    {t:"Fuites hydrauliques suspension et pannes électroniques récurrentes hors garantie",sev:"bad",cost:3000,km:15000,ask:"Extension de garantie McLaren en cours ?"},
    {t:"Entretien annuel ≈ 2 000 € ; historique concession indispensable",sev:"warn",cost:2000}]},
  bentley_w12:{label:"W12 6.0 / V8 4.0",fuel:"Essence",conso:14.0,rel:70,issues:[
    {t:"Suspension pneumatique et électronique : budget entretien ≈ 3 000 €/an",sev:"warn",cost:3000}]}
};

/* ---------- Boîtes automatiques à risque connu ---------- */
const GEARBOXES = {
  dq200:{label:"DSG7 à sec (DQ200)",issues:[
    {t:"Mécatronique et embrayages DSG7 DQ200 : à-coups puis panne — 2 000 € (véhicules 60–140 000 km les plus touchés)",sev:"bad",cost:2000,km:60000,chk:"Essai : à-coups 1→2 à froid, recul en côte, vibrations au démarrage",ask:"La mécatronique a-t-elle été remplacée ? Mises à jour faites ?"}]},
  dsg_wet:{label:"DSG6/7 à bain d'huile",issues:[
    {t:"Vidange DSG obligatoire tous les 60 000 km (≈ 250 €) — exiger les factures",sev:"warn",cost:250,km:55000,ask:"Vidanges de boîte DSG faites aux intervalles ?"}]},
  edc:{label:"EDC double embrayage",issues:[
    {t:"Boîte EDC : à-coups et usure prématurée possibles (≈ 1 800 € hors garantie)",sev:"warn",cost:1800,km:70000,chk:"Essai en ville : passages 1→2 sans secousse"}]},
  zf8:{label:"BVA8 ZF",issues:[
    {t:"BVA ZF8 très fiable ; vidange conseillée vers 100 000 km (≈ 350 €)",sev:"warn",cost:350,km:100000}]},
  pdk:{label:"PDK",issues:[]},
  dct7_mb:{label:"7G/8G-DCT",issues:[
    {t:"Vidange boîte double embrayage à respecter (60–80 000 km)",sev:"warn",cost:300,km:70000}]}
};


/* ============================================================
   v3 — EXTENSION DE LA BASE : familles moteur supplémentaires
   ============================================================ */
Object.assign(ENGINES, {
  /* --- PSA / Stellantis anciens & hybrides --- */
  psa_tu:{label:"1.0–1.6 TU/ET atmo",fuel:"Essence",conso:6.5,rel:80,issues:[
    {t:"Allumage (bobines/faisceau) vieillissant, sans gravité (≈ 150 €)",sev:"warn",cost:150,km:120000}]},
  psa_pt_atmo:{label:"1.0–1.2 VTi/PureTech atmo",fuel:"Essence",conso:5.0,rel:58,issues:[
    {t:"Courroie de distribution humide : même défaut que les PureTech turbo — remplacement ≈ 550 €",sev:"bad",cost:550,km:50000,yMax:2022,chk:"Bouchon d'huile : dépôts de courroie",ask:"Courroie remplacée ? Facture ?"}]},
  psa_hdi16:{label:"1.6 HDi 90–110",fuel:"Diesel",conso:4.5,rel:58,issues:[
    {t:"Turbo détruit par vidanges espacées : exigez un entretien tous les 10 000 km (≈ 1 400 €)",sev:"bad",cost:1400,km:90000,chk:"Fumée bleue à l'accélération = turbo fatigué",ask:"Fréquence réelle des vidanges ?"},
    {t:"Encrassement EGR/FAP en usage urbain",sev:"warn",km:80000}]},
  psa_hdi20_old:{label:"2.0 HDi 90–136 (av. 2010)",fuel:"Diesel",conso:5.3,rel:80,issues:[
    {t:"Vanne EGR et FAP à surveiller à fort kilométrage",sev:"warn",cost:500,km:150000}]},
  psa_ew:{label:"1.8–2.2 essence (EW)",fuel:"Essence",conso:7.4,rel:72,issues:[
    {t:"Thermostat et joint de culasse à surveiller après 130 000 km",sev:"warn",cost:700,km:130000}]},
  psa_22hdi:{label:"2.2 HDi",fuel:"Diesel",conso:6.0,rel:62,issues:[
    {t:"Injection et volant moteur à surveiller (≈ 1 000 €)",sev:"warn",cost:1000,km:130000}]},
  psa_hy48:{label:"Hybrid 136/145 (48V)",fuel:"Hybride",conso:4.7,rel:66,issues:[
    {t:"Boîte ë-DCS6 récente : peu de recul, mises à jour fréquentes",sev:"warn",chk:"Essai : transitions thermique/électrique sans à-coups"}]},

  /* --- Renault / Nissan anciens --- */
  ren_k4m:{label:"1.4–1.6 16v (K4M)",fuel:"Essence",conso:6.8,rel:78,issues:[
    {t:"Bobines d'allumage fragiles (≈ 150 €)",sev:"warn",cost:150,km:90000}]},
  ren_d4f:{label:"1.2 16v (D4F)",fuel:"Essence",conso:5.9,rel:64,issues:[
    {t:"Consommation d'huile à surveiller",sev:"warn",km:90000,chk:"Niveau d'huile à froid"}]},
  ren_f9q:{label:"1.9 dCi (F9Q)",fuel:"Diesel",conso:5.2,rel:50,issues:[
    {t:"Turbo fragile : casse fréquente — 1 300 €",sev:"bad",cost:1300,km:100000,chk:"Fumées et sifflements à l'accélération"},
    {t:"Injection et débitmètre capricieux",sev:"warn",cost:400,km:120000}]},
  ren_m9r:{label:"2.0 dCi (M9R)",fuel:"Diesel",conso:5.6,rel:70,issues:[
    {t:"Volant bi-masse en fin de vie vers 140 000 km (≈ 900 €)",sev:"warn",cost:900,km:140000}]},
  ren_r9m:{label:"1.6 dCi (R9M)",fuel:"Diesel",conso:4.4,rel:70,issues:[
    {t:"Vanne EGR à nettoyer vers 110 000 km",sev:"warn",cost:350,km:110000}]},
  ren_f4r:{label:"2.0 16v turbo (F4R — RS)",fuel:"Essence",conso:8.5,rel:76,issues:[
    {t:"Distribution stricte tous les 90 000 km : facture exigée",sev:"warn",cost:800,km:80000,ask:"Distribution faite ? Usage circuit ?"}]},
  ren_ev5:{label:"Mégane/R5 E-Tech électrique",fuel:"Électrique",conso:"15,2 kWh",rel:76,issues:[
    {t:"Plateforme récente : peu de recul au-delà de 100 000 km",sev:"warn",km:80000}]},
  nis_hr16:{label:"1.6 atmo (HR16)",fuel:"Essence",conso:6.3,rel:76,issues:[]},
  nis_dig16:{label:"1.6 DIG-T",fuel:"Essence",conso:6.8,rel:62,issues:[
    {t:"Chaîne de distribution à écouter après 100 000 km",sev:"warn",cost:900,km:100000}]},
  nis_vq:{label:"V6 3.5/3.7 (VQ)",fuel:"Essence",conso:10.5,rel:82,issues:[
    {t:"Embrayage et volant coûteux sur 370Z (≈ 1 500 €)",sev:"warn",cost:1500,km:100000}]},
  nis_vr38:{label:"3.8 V6 biturbo (GT-R)",fuel:"Essence",conso:12.0,rel:72,issues:[
    {t:"Boîte GR6 sensible aux launch controls répétés (≈ 4 000 €)",sev:"warn",cost:4000,km:60000,ask:"Usage circuit/launch ? Factures boîte ?"}]},
  nis_leaf:{label:"Leaf électrique",fuel:"Électrique",conso:"15,0 kWh",rel:72,issues:[
    {t:"Batterie sans refroidissement liquide : dégradation plus rapide — contrôlez le SOH",sev:"warn",km:80000,chk:"SOH batterie ≥ 85 % (lecture LeafSpy)"},
    {t:"Charge rapide CHAdeMO en voie d'abandon en Europe",sev:"warn"}]},

  /* --- VAG anciens & électriques --- */
  vag_mpi:{label:"1.0–1.6 MPI atmo",fuel:"Essence",conso:6.6,rel:80,issues:[]},
  vag_19tdi:{label:"1.9 TDI (PD)",fuel:"Diesel",conso:5.1,rel:84,issues:[
    {t:"Volant bi-masse et pompe tandem à fort kilométrage",sev:"warn",cost:900,km:180000}]},
  vag_20tdipd:{label:"2.0 TDI PD (av. 2009)",fuel:"Diesel",conso:5.6,rel:50,issues:[
    {t:"Culasse fissurée (BKD/BMN) : défaut notoire — 3 000 €",sev:"bad",cost:3000,km:120000,chk:"Liquide de refroidissement : traces d'huile/mayonnaise"},
    {t:"Pompes-injecteurs coûteuses (≈ 1 200 €)",sev:"warn",cost:1200,km:150000}]},
  vag_fsi:{label:"1.4–2.0 FSI (av. 2013)",fuel:"Essence",conso:6.6,rel:54,issues:[
    {t:"Chaîne et tendeur fragiles — 900 €",sev:"bad",cost:900,km:90000,chk:"Cliquetis à froid"},
    {t:"Calaminage soupapes (injection directe) — nettoyage 400 €",sev:"warn",cost:400,km:100000}]},
  vag_18t:{label:"1.8T 20v (150–225)",fuel:"Essence",conso:7.8,rel:72,issues:[
    {t:"Boues moteur si vidanges espacées : historique impératif",sev:"warn",km:120000,ask:"Vidanges tous les 10 000 km ?"}]},
  vag_30tdi:{label:"3.0 TDI V6",fuel:"Diesel",conso:6.4,rel:66,issues:[
    {t:"Chaîne de distribution côté boîte : intervention lourde (≈ 3 000 €)",sev:"warn",cost:3000,km:180000},
    {t:"Système AdBlue et thermostat",sev:"warn",cost:500,km:130000}]},
  vag_meb:{label:"ID. électrique (MEB)",fuel:"Électrique",conso:"16,5 kWh",rel:66,issues:[
    {t:"Logiciel capricieux sur les premiers millésimes : mises à jour indispensables",sev:"warn",yMax:2022,chk:"Version logicielle ≥ 3.0",ask:"Mises à jour faites en concession ?"},
    {t:"Batterie 12V faible (immobilisations recensées)",sev:"warn",yMax:2021}]},
  vag_etron:{label:"e-tron / Q4 électrique",fuel:"Électrique",conso:"17,5 kWh",rel:72,issues:[]},
  vag_5cyl:{label:"2.5 TFSI 5 cylindres",fuel:"Essence",conso:8.8,rel:74,issues:[
    {t:"Consommables sport coûteux (freins, pneus)",sev:"warn",cost:1500,km:40000}]},
  audi_v10:{label:"V10 5.2 (R8)",fuel:"Essence",conso:13.8,rel:78,issues:[
    {t:"Suspension magnetic ride : fuites amortisseurs (≈ 1 200 €/coin)",sev:"warn",cost:1200,km:60000}]},

  /* --- BMW anciens --- */
  bmw_m57:{label:"2.0d/3.0d (M47/M57)",fuel:"Diesel",conso:5.8,rel:78,issues:[
    {t:"Turbo et clapets d'admission à fort kilométrage",sev:"warn",cost:1200,km:180000}]},
  bmw_n46:{label:"1.8–2.0i (N42/N46)",fuel:"Essence",conso:7.2,rel:52,issues:[
    {t:"Consommation d'huile et joints (carter, vanos) — 800 €",sev:"bad",cost:800,km:120000,chk:"Fumée bleue au démarrage"}]},
  bmw_n52:{label:"2.5–3.0i atmo (N52)",fuel:"Essence",conso:8.2,rel:74,issues:[
    {t:"Bobines et joint de carter à prévoir",sev:"warn",cost:500,km:130000}]},
  bmw_n20:{label:"2.0i turbo (N20)",fuel:"Essence",conso:7.0,rel:56,issues:[
    {t:"Chaîne de distribution fragile : défaut connu — 2 200 €",sev:"bad",cost:2200,km:90000,chk:"Bruit de chaîne à froid",ask:"Chaîne remplacée ?"}]},
  bmw_n57:{label:"3.0d (N57)",fuel:"Diesel",conso:6.2,rel:74,issues:[
    {t:"Admission/EGR à nettoyer vers 150 000 km",sev:"warn",cost:600,km:150000}]},
  bmw_s65:{label:"4.0 V8 (M3 E9x)",fuel:"Essence",conso:11.8,rel:58,issues:[
    {t:"Coussinets de bielles : remplacement préventif recommandé — 2 500 €",sev:"bad",cost:2500,km:80000,ask:"Coussinets faits ? Facture ?"},
    {t:"Actionneurs de papillons (≈ 1 200 €)",sev:"warn",cost:1200,km:100000}]},
  bmw_iev:{label:"i3/iX électrique",fuel:"Électrique",conso:"14,8 kWh",rel:76,issues:[]},

  /* --- Mercedes anciens --- */
  mb_m271:{label:"1.8 Kompressor/CGI (M271)",fuel:"Essence",conso:7.4,rel:52,issues:[
    {t:"Chaîne de distribution étirée + pignons d'arbre à cames : défaut notoire — 1 800 €",sev:"bad",cost:1800,km:120000,chk:"Cliquetis à froid",ask:"Chaîne/pignons remplacés ?"}]},
  mb_om642:{label:"3.0 V6 CDI (OM642)",fuel:"Diesel",conso:6.8,rel:62,issues:[
    {t:"Fuites d'huile (joint de turbo, radiateur) — 900 €",sev:"warn",cost:900,km:140000},
    {t:"Volets de tourbillonnement (swirl flaps)",sev:"warn",cost:600,km:160000}]},
  mb_om611:{label:"2.0–2.7 CDI (av. 2006)",fuel:"Diesel",conso:6.2,rel:82,issues:[
    {t:"Injecteurs à très fort kilométrage — mécanique de taxi, quasi increvable",sev:"warn",cost:700,km:250000}]},
  mb_m113:{label:"V8 4.3–5.5 atmo (M113)",fuel:"Essence",conso:11.5,rel:85,issues:[]},
  mb_m156:{label:"6.2 V8 AMG (M156)",fuel:"Essence",conso:13.5,rel:58,issues:[
    {t:"Boulons de culasse et arbres à cames : défauts documentés — 3 000 €",sev:"bad",cost:3000,km:100000,ask:"Boulons de culasse remplacés ?"}]},
  mb_eq:{label:"EQ électrique",fuel:"Électrique",conso:"17,8 kWh",rel:74,issues:[]},

  /* --- Ford --- */
  ford_duratec:{label:"1.25–1.6 Duratec atmo",fuel:"Essence",conso:6.2,rel:78,issues:[]},
  ford_tdci18:{label:"1.8 TDCi",fuel:"Diesel",conso:5.4,rel:58,issues:[
    {t:"Injection et turbo sensibles à l'entretien",sev:"warn",cost:800,km:120000}]},
  ford_st:{label:"2.0–2.3 EcoBoost (ST/RS)",fuel:"Essence",conso:8.2,rel:62,issues:[
    {t:"Focus RS : culasse fissurée sur premiers millésimes — 2 500 €",sev:"bad",cost:2500,yMax:2017,km:40000,ask:"Rappel culasse effectué ?"}]},
  ford_v8:{label:"5.0 V8 Coyote (Mustang)",fuel:"Essence",conso:11.8,rel:80,issues:[
    {t:"Boîte manuelle MT82 imprécise, consommation d'huile légère",sev:"warn",km:80000}]},

  /* --- Toyota / Honda / Mazda / Subaru / Mitsubishi --- */
  toy_d4d:{label:"D-4D diesel",fuel:"Diesel",conso:5.4,rel:76,issues:[
    {t:"Injecteurs (2.0/2.2 av. 2009) et EGR à surveiller",sev:"warn",cost:900,km:130000}]},
  toy_gr:{label:"1.6 turbo (GR Yaris)",fuel:"Essence",conso:8.0,rel:80,issues:[
    {t:"Entretien strict exigé (usage sportif fréquent)",sev:"warn",ask:"Usage circuit ?"}]},
  toy_boxer:{label:"2.0/2.4 boxer (GT86/GR86)",fuel:"Essence",conso:7.8,rel:74,issues:[
    {t:"Ressorts de soupapes : rappel des premiers GT86",sev:"warn",yMax:2013,ask:"Rappel soupapes effectué ?"}]},
  honda_atmo:{label:"i-VTEC atmo",fuel:"Essence",conso:6.6,rel:90,issues:[]},
  honda_hev:{label:"e:HEV hybride",fuel:"Hybride",conso:4.5,rel:86,issues:[]},
  honda_dtec:{label:"1.6 i-DTEC",fuel:"Diesel",conso:4.3,rel:78,issues:[]},
  honda_typer:{label:"2.0 VTEC Turbo (Type R)",fuel:"Essence",conso:8.3,rel:80,issues:[
    {t:"Consommables sport coûteux ; historique circuit à vérifier",sev:"warn",ask:"Usage circuit ?"}]},
  mazda_skyd:{label:"2.2 SkyActiv-D",fuel:"Diesel",conso:5.2,rel:58,issues:[
    {t:"Calaminage admission et injecteurs — 1 200 €",sev:"warn",cost:1200,km:120000},
    {t:"Dilution d'huile par le gazole (trajets courts)",sev:"warn",chk:"Niveau d'huile au-dessus du max = danger"}]},
  mazda_mzr:{label:"1.6–2.0 MZR atmo",fuel:"Essence",conso:6.9,rel:78,issues:[]},
  mazda_rotary:{label:"1.3 birotor (RX-8)",fuel:"Essence",conso:11.0,rel:30,issues:[
    {t:"Segments d'apex : compressions faibles = moteur HS — reconstruction 4 000 €",sev:"bad",cost:4000,km:80000,chk:"Test de compression rotatif OBLIGATOIRE avant achat",ask:"Test de compression récent ? Moteur d'origine ?"}]},
  subaru_ej:{label:"Boxer EJ (av. 2012)",fuel:"Essence",conso:8.4,rel:62,issues:[
    {t:"Joints de culasse : fuite classique du boxer — 1 800 €",sev:"bad",cost:1800,km:150000,chk:"Suintements bas moteur, niveau liquide"}]},
  subaru_fb:{label:"Boxer FB/FA",fuel:"Essence",conso:7.4,rel:76,issues:[
    {t:"Consommation d'huile sur premiers FB",sev:"warn",yMax:2015,km:80000}]},
  subaru_d:{label:"2.0 boxer diesel",fuel:"Diesel",conso:5.6,rel:46,issues:[
    {t:"Vilebrequin fragile : casses documentées — éviter les gros kilométrages sans historique",sev:"bad",cost:4000,km:130000}]},
  mitsu_did:{label:"1.8–2.2 DI-D",fuel:"Diesel",conso:5.6,rel:68,issues:[]},
  mitsu_phev:{label:"Outlander PHEV",fuel:"Hybride",conso:5.2,rel:80,issues:[]},
  mitsu_4g63:{label:"2.0 turbo (Lancer Evo)",fuel:"Essence",conso:10.0,rel:66,issues:[
    {t:"Préparations fréquentes : exigez l'historique d'origine",sev:"warn",ask:"Voiture d'origine ? Reprogrammation ?"}]},
  suzuki_atmo:{label:"1.0–1.6 atmo",fuel:"Essence",conso:5.8,rel:84,issues:[]},

  /* --- Hyundai / Kia / Genesis --- */
  hk_atmo:{label:"1.0–1.6 atmo",fuel:"Essence",conso:6.0,rel:76,issues:[]},
  hk_egmp:{label:"E-GMP 800V (Ioniq 5/6, EV6)",fuel:"Électrique",conso:"16,8 kWh",rel:72,issues:[
    {t:"ICCU (chargeur) défaillant : rappel majeur — vérifiez l'intervention",sev:"bad",yMax:2024,chk:"Preuve du rappel ICCU",ask:"Rappel ICCU effectué ?"}]},
  gen_33t:{label:"3.3T V6 (Genesis)",fuel:"Essence",conso:10.5,rel:72,issues:[]},

  /* --- Volvo / Polestar / Saab --- */
  volvo_5cyl:{label:"T5/D5 5 cylindres",fuel:"Diesel",conso:6.2,rel:80,issues:[
    {t:"Robuste ; distribution à respecter (120 000 km)",sev:"warn",cost:700,km:110000}]},
  volvo_t8:{label:"T8 hybride rechargeable",fuel:"Hybride",conso:7.8,rel:70,issues:[
    {t:"Complexité élevée : entretien réseau conseillé",sev:"warn"}]},
  volvo_ev:{label:"Recharge électrique",fuel:"Électrique",conso:"17,5 kWh",rel:72,issues:[]},
  pol_ev:{label:"Polestar électrique",fuel:"Électrique",conso:"16,8 kWh",rel:72,issues:[]},
  saab_t:{label:"2.0t/2.3T (Saab)",fuel:"Essence",conso:8.4,rel:68,issues:[
    {t:"Pièces via réseau spécialiste uniquement (marque disparue)",sev:"warn"},
    {t:"Chaîne d'équilibrage à écouter",sev:"warn",cost:800,km:150000}]},

  /* --- JLR --- */
  jlr_tdv6:{label:"2.7/3.0 TDV6",fuel:"Diesel",conso:7.4,rel:50,issues:[
    {t:"Vilebrequin et poulie damper : casses documentées — 4 000 €",sev:"bad",cost:4000,km:140000,chk:"Bruits bas moteur au ralenti",ask:"Damper remplacé ?"},
    {t:"Turbos jumeaux coûteux",sev:"warn",cost:1800,km:150000}]},
  jlr_v8s:{label:"5.0 V8 compressé",fuel:"Essence",conso:12.5,rel:64,issues:[
    {t:"Chaînes de distribution à écouter — 2 500 €",sev:"warn",cost:2500,km:120000}]},
  jlr_ipace:{label:"I-Pace électrique",fuel:"Électrique",conso:"22 kWh",rel:56,issues:[
    {t:"Rappels batterie successifs (risque incendie) : interventions à vérifier",sev:"bad",yMax:2020,ask:"Tous les rappels batterie sont-ils soldés ?"}]},

  /* --- Fiat / Alfa / Lancia --- */
  fiat_jtd:{label:"1.9 JTD / 2.0 MultiJet",fuel:"Diesel",conso:5.4,rel:74,issues:[
    {t:"Volant bi-masse en fin de vie à fort kilométrage",sev:"warn",cost:900,km:150000}]},
  fiat_tjet:{label:"1.4 T-Jet (Abarth)",fuel:"Essence",conso:7.4,rel:70,issues:[
    {t:"Embrayage sollicité sur versions poussées",sev:"warn",cost:900,km:80000}]},
  alfa_tbi:{label:"1750 TBi",fuel:"Essence",conso:7.8,rel:70,issues:[]},

  /* --- Porsche --- */
  por_m96:{label:"3.4–3.6 flat-6 (996/986)",fuel:"Essence",conso:11.0,rel:46,issues:[
    {t:"Roulement IMS : casse moteur possible — upgrade préventif 2 500 €",sev:"bad",cost:2500,km:80000,chk:"Facture IMS upgrade sinon provision",ask:"IMS remplacé ? RMS étanche ?"},
    {t:"Joint spi arrière (RMS) fuyard",sev:"warn",cost:900,km:100000}]},
  por_997:{label:"3.6–3.8 (997.1)",fuel:"Essence",conso:10.6,rel:60,issues:[
    {t:"Rayures cylindres (scoring) : endoscopie recommandée avant achat",sev:"warn",cost:8000,km:100000,chk:"Endoscopie cylindres par spécialiste"}]},
  por_v8c:{label:"4.5–4.8 V8 (Cayenne)",fuel:"Essence",conso:13.0,rel:64,issues:[
    {t:"Durites de refroidissement et cardans — 800 €",sev:"warn",cost:800,km:120000}]},

  /* --- Exotiques --- */
  fer_f1v8:{label:"V8 360/F430",fuel:"Essence",conso:14.0,rel:62,issues:[
    {t:"Embrayage boîte F1 : usure rapide — 4 500 €, relevé d'usure indispensable",sev:"bad",cost:4500,km:20000,chk:"Lecture usure embrayage à la valise",ask:"Pourcentage d'usure embrayage ?"},
    {t:"Collecteurs d'échappement fissurés (F430)",sev:"warn",cost:2000,km:40000}]},
  fer_v12:{label:"V12 Ferrari (550–812)",fuel:"Essence",conso:15.5,rel:72,issues:[
    {t:"Entretien annuel ≈ 3 000 € incontournable",sev:"warn",cost:3000,ask:"Carnet concession/spécialiste complet ?"}]},
  aston_v12o:{label:"V12 5.9 (DB9/DBS)",fuel:"Essence",conso:14.5,rel:62,issues:[
    {t:"Électronique vieillissante et embrayage ≈ 3 000 €",sev:"warn",cost:3000,km:60000}]},
  rr_v12:{label:"V12 6.6–6.75 (Rolls)",fuel:"Essence",conso:15.0,rel:72,issues:[
    {t:"Suspension pneumatique et électronique : budget ≥ 3 000 €/an",sev:"warn",cost:3000}]},
  bug_w16:{label:"8.0 W16 quadriturbo",fuel:"Essence",conso:23.0,rel:70,issues:[
    {t:"Révision annuelle ≈ 25 000 € ; train de pneus ≈ 30 000 €",sev:"warn",cost:25000,ask:"Historique Molsheim complet ?"}]},
  pag_v12:{label:"AMG V12 biturbo (Pagani)",fuel:"Essence",conso:16.0,rel:74,issues:[
    {t:"Entretien atelier usine uniquement (≈ 8 000 €/an)",sev:"warn",cost:8000}]},
  koe_v8:{label:"V8 biturbo (Koenigsegg)",fuel:"Essence",conso:18.0,rel:66,issues:[
    {t:"Réseau SAV ultra-restreint : anticipez logistique et délais",sev:"warn"}]},
  rimac_ev:{label:"Nevera électrique",fuel:"Électrique",conso:"25 kWh",rel:70,issues:[]},
  lotus_rover:{label:"1.8 Rover K (Elise S1)",fuel:"Essence",conso:7.5,rel:58,issues:[
    {t:"Joint de culasse K-series : défaut notoire — 1 200 €",sev:"bad",cost:1200,km:80000}]},
  lotus_toy:{label:"1.8 Toyota (Elise/Exige)",fuel:"Essence",conso:7.8,rel:86,issues:[]},
  lotus_v6:{label:"3.5 V6 compressé (Evora/Emira)",fuel:"Essence",conso:9.8,rel:78,issues:[]},
  lotus_ev:{label:"Eletre électrique",fuel:"Électrique",conso:"20 kWh",rel:62,issues:[
    {t:"Modèle récent, électronique dense : peu de recul",sev:"warn"}]},
  morgan_eng:{label:"Ford/BMW (Morgan)",fuel:"Essence",conso:8.5,rel:72,issues:[
    {t:"Châssis bois de frêne : inspection humidité/état impérative",sev:"warn",chk:"Inspection châssis par spécialiste"}]},
  cat_sigma:{label:"1.6–2.0 Ford (Seven)",fuel:"Essence",conso:7.0,rel:80,issues:[
    {t:"Usage piste fréquent : vérifiez l'historique",sev:"warn",ask:"Track days ? Révisions ?"}]},
  tvr_s6:{label:"Speed Six (TVR)",fuel:"Essence",conso:12.0,rel:38,issues:[
    {t:"Fiabilité moteur notoire : reconstruction fréquente — 5 000 €+",sev:"bad",cost:5000,km:60000,ask:"Moteur refait ? Par qui ?"}]},
  wies_bmw:{label:"BMW 6/8 cyl (Wiesmann)",fuel:"Essence",conso:10.5,rel:72,issues:[]},
  donk_audi:{label:"Audi 1.8T/2.5 (Donkervoort)",fuel:"Essence",conso:8.0,rel:74,issues:[]},
  ktm_20t:{label:"2.0 TFSI (X-Bow)",fuel:"Essence",conso:8.2,rel:76,issues:[]},
  dmc_prv:{label:"2.8 V6 PRV (DeLorean)",fuel:"Essence",conso:12.0,rel:55,issues:[
    {t:"Pièces spécifiques rares : réseau DeLorean US",sev:"warn"}]},

  /* --- US --- */
  gm_ls:{label:"V8 6.2 LS/LT",fuel:"Essence",conso:12.5,rel:84,issues:[
    {t:"Poussoirs AFM/DoD à surveiller — 2 500 €",sev:"warn",cost:2500,km:120000}]},
  gm_ecotec:{label:"1.4–1.8 Ecotec",fuel:"Essence",conso:6.8,rel:66,issues:[
    {t:"Chaîne de distribution à écouter",sev:"warn",cost:700,km:110000}]},
  chevy_ev:{label:"Bolt électrique",fuel:"Électrique",conso:"15,5 kWh",rel:58,issues:[
    {t:"Rappel batterie LG (risque incendie) : remplacement à vérifier",sev:"bad",yMax:2021,ask:"Batterie remplacée dans le cadre du rappel ?"}]},
  dodge_hemi:{label:"5.7–6.4 HEMI V8",fuel:"Essence",conso:13.0,rel:72,issues:[
    {t:"Poussoirs hydrauliques (tick HEMI) — 3 000 €",sev:"warn",cost:3000,km:140000}]},
  dodge_v6:{label:"3.6 Pentastar V6",fuel:"Essence",conso:10.0,rel:70,issues:[
    {t:"Culbuteurs bruyants sur premiers millésimes",sev:"warn",yMax:2013,cost:800,km:120000}]},
  hummer_ev:{label:"Hummer EV",fuel:"Électrique",conso:"30 kWh",rel:64,issues:[
    {t:"4,1 tonnes : pneus et freins démesurés",sev:"warn",cost:2000,km:30000}]},
  fisker_ev:{label:"Ocean électrique",fuel:"Électrique",conso:"17,5 kWh",rel:38,issues:[
    {t:"Constructeur en faillite : garantie, pièces et logiciel incertains",sev:"bad",ask:"Qui assure le SAV aujourd'hui ?"}]},
  lucid_ev:{label:"Air électrique 900V",fuel:"Électrique",conso:"14,5 kWh",rel:72,issues:[
    {t:"SAV embryonnaire en Europe",sev:"warn"}]},

  /* --- Chinoises & nouveaux entrants --- */
  byd_ev:{label:"Blade LFP électrique",fuel:"Électrique",conso:"15,8 kWh",rel:80,issues:[
    {t:"Réseau SAV jeune en France : délais pièces possibles",sev:"warn"}]},
  byd_dmi:{label:"DM-i hybride rechargeable",fuel:"Hybride",conso:4.8,rel:76,issues:[]},
  mg_ev:{label:"MG électrique (SAIC)",fuel:"Électrique",conso:"16,5 kWh",rel:70,issues:[
    {t:"Logiciel et SAV : délais recensés, mises à jour utiles",sev:"warn"}]},
  mg_t:{label:"1.5T essence (MG)",fuel:"Essence",conso:6.8,rel:62,issues:[
    {t:"Recul fiabilité limité au-delà de 100 000 km",sev:"warn",km:80000}]},
  chery_t:{label:"1.6 TGDI (Omoda/Jaecoo)",fuel:"Essence",conso:7.2,rel:62,issues:[
    {t:"Marque récente en France : recul limité",sev:"warn"}]},
  leap_ev:{label:"Leapmotor électrique",fuel:"Électrique",conso:"16,0 kWh",rel:66,issues:[
    {t:"Réseau naissant (import Stellantis)",sev:"warn"}]},
  xpeng_ev:{label:"Xpeng électrique",fuel:"Électrique",conso:"16,5 kWh",rel:70,issues:[]},
  nio_ev:{label:"Nio électrique (swap)",fuel:"Électrique",conso:"18,0 kWh",rel:72,issues:[
    {t:"Échange de batterie : dépendance au réseau Nio, quasi absent en France",sev:"warn"}]},
  zeekr_ev:{label:"Zeekr électrique",fuel:"Électrique",conso:"17,0 kWh",rel:74,issues:[]},
  lynk_phev:{label:"1.5T PHEV (Lynk & Co)",fuel:"Hybride",conso:5.2,rel:72,issues:[]},
  vinfast_ev:{label:"VinFast électrique",fuel:"Électrique",conso:"18,5 kWh",rel:48,issues:[
    {t:"Logiciel et finition critiqués sur les premiers lots",sev:"warn",yMax:2024},
    {t:"Valeur de revente très incertaine",sev:"warn"}]},
  aiways_ev:{label:"Aiways électrique",fuel:"Électrique",conso:"16,5 kWh",rel:52,issues:[
    {t:"Importateur retiré du marché : SAV quasi inexistant",sev:"bad",ask:"Qui entretient le véhicule aujourd'hui ?"}]},
  ora_ev:{label:"Ora électrique (GWM)",fuel:"Électrique",conso:"16,3 kWh",rel:64,issues:[]},
  seres_ev:{label:"Seres électrique",fuel:"Électrique",conso:"17,5 kWh",rel:56,issues:[
    {t:"Réseau confidentiel",sev:"warn"}]},
  dfsk_t:{label:"1.5T (DFSK)",fuel:"Essence",conso:7.8,rel:52,issues:[
    {t:"Réseau et pièces confidentiels",sev:"warn"}]},
  sky_ev:{label:"Skywell électrique",fuel:"Électrique",conso:"17,8 kWh",rel:56,issues:[
    {t:"Réseau confidentiel",sev:"warn"}]},
  hongqi_ev:{label:"Hongqi électrique",fuel:"Électrique",conso:"19,0 kWh",rel:62,issues:[]},
  forthing_t:{label:"1.5T (Forthing)",fuel:"Essence",conso:7.6,rel:50,issues:[
    {t:"Distribution récente, recul quasi nul",sev:"warn"}]},
  micro_ev:{label:"Microlino électrique",fuel:"Électrique",conso:"7,0 kWh",rel:68,issues:[]},
  xev_ev:{label:"XEV Yoyo électrique",fuel:"Électrique",conso:"8,0 kWh",rel:58,issues:[
    {t:"Micro-constructeur : SAV à vérifier localement",sev:"warn"}]},

  /* --- Divers --- */
  lada_16:{label:"1.6 8/16v (Lada)",fuel:"Essence",conso:7.6,rel:62,issues:[
    {t:"Rustique ; pièces très bon marché, finitions datées",sev:"warn"}]},
  ssang_xdi:{label:"2.0–2.2 e-XDi (base Mercedes)",fuel:"Diesel",conso:6.4,rel:64,issues:[
    {t:"Injection à surveiller ; réseau réduit depuis 2023",sev:"warn",km:120000}]},
  daewoo_a:{label:"0.8–1.6 atmo (Daewoo)",fuel:"Essence",conso:6.8,rel:60,issues:[]},
  dai_a:{label:"1.0–1.3 atmo (Daihatsu)",fuel:"Essence",conso:5.4,rel:80,issues:[]},
  isuzu_d:{label:"1.9–3.0 diesel (D-Max)",fuel:"Diesel",conso:7.8,rel:80,issues:[]},
  alp_18t:{label:"1.8 turbo (A110)",fuel:"Essence",conso:6.5,rel:80,issues:[]},
  smart_ev:{label:"EQ fortwo électrique",fuel:"Électrique",conso:"13,8 kWh",rel:72,issues:[]},
  rover_k:{label:"1.4–1.8 K-series (Rover/MG)",fuel:"Essence",conso:7.0,rel:48,issues:[
    {t:"Joint de culasse : LE défaut K-series — 1 200 €",sev:"bad",cost:1200,km:90000,chk:"Mayonnaise sous le bouchon d'huile"}]},
  vsp_d:{label:"Diesel VSP (Kubota/Lombardini)",fuel:"Diesel",conso:3.2,rel:64,issues:[
    {t:"Variateur et courroie : remplacement ≈ 400 € vers 30 000 km",sev:"warn",cost:400,km:25000,chk:"Essai : montée en vitesse sans à-coups"}]}
});

Object.assign(GEARBOXES, {
  cvt_jatco:{label:"CVT (Jatco)",issues:[
    {t:"CVT Jatco : à-coups/patinage, remplacement 2 500 € — vidanges CVT impératives tous les 60 000 km",sev:"bad",cost:2500,km:90000,chk:"Essai : patinage et à-coups à mi-régime",ask:"Vidanges CVT faites ?"}]},
  ecvt:{label:"e-CVT (hybride)",issues:[]},
  amt:{label:"Robotisée mono-embrayage",issues:[
    {t:"Boîte robotisée : à-coups et embrayage ≈ 900 €",sev:"warn",cost:900,km:70000}]},
  bva_old:{label:"BVA classique",issues:[
    {t:"Vidange de boîte tous les 60 000 km : exigez les factures",sev:"warn",cost:250,km:60000}]},
  f1_robot:{label:"Robotisée F1/e-gear/R-tronic",issues:[
    {t:"Embrayage robotisé mono-disque : usure rapide — relevé valise indispensable (4 000–9 000 €)",sev:"bad",cost:5000,km:20000,chk:"Relevé d'usure embrayage à la valise",ask:"Pourcentage d'usure ? Factures ?"}]}
});

/* ============================================================
   MARQUES & MODÈLES — format compact
   M(nom, alias, seg, de, à, prixNeuf, "moteurs", extra)
   moteur = ref:ch:boîte[:aboîte[:npx[:segx]]]  —  boîte m/a/ma
   ============================================================ */
const SEGX = {c:"citadine",k:"compacte",b:"berline",s:"suv",p:"sport",x:"supercar",e:"electrique"};
function M(name, alias, seg, y0, y1, np, eng, extra) {
  return Object.assign({
    name, alias: alias.split(','), seg: SEGX[seg], y: [y0, y1], np,
    eng: eng.split('|').map(t => {
      const a = t.split(':');
      const o = { ref: a[0], p: +a[1], box: a[2] || 'm' };
      if (a[3]) o.abox = a[3];
      if (a[4]) o.npx = +a[4];
      if (a[5]) o.segx = SEGX[a[5]];
      return o;
    })
  }, extra || {});
}
const BRANDS = [];
function Br(name, alias, tier, models) { BRANDS.push({ name, alias: alias.split(','), tier, models }); }

/* ================= FRANCE ================= */
Br("Peugeot","peugeot",1,[
M("106","106","c",1991,2003,9000,"psa_tu:60|psa_tu:100:m::1.2:p"),
M("107","107","c",2005,2014,10500,"psa_tu:68"),
M("108","108","c",2014,2021,12500,"psa_pt_atmo:72"),
M("205","205","c",1983,1998,8500,"psa_tu:60|psa_tu:105:m::1.3:p"),
M("206","206","c",1998,2009,12500,"psa_tu:75|psa_hdi16:90|psa_ew:136:m::1.25:p"),
M("206+","206+,206 plus","c",2009,2012,11500,"psa_tu:75|psa_hdi16:70"),
M("207","207","c",2006,2012,14500,"psa_tu:95|psa_vti:120|psa_hdi16:90|psa_thp:150:m::1.2"),
M("208 (2012–2019)","208","c",2012,2019,18000,"eb2_puretech:110:ma:dsg_wet|psa_vti:82|psa_hdi16:100|psa_thp:208:m::1.35:p"),
M("208 II (2019+)","208","c",2019,2026,22500,"eb2_puretech:100:ma:dsg_wet|psa_bluehdi15:100|ev_psa:136:a"),
M("301","301","b",2012,2020,15500,"psa_vti:115|psa_hdi16:92"),
M("306","306","k",1993,2001,13500,"psa_tu:90|psa_hdi20_old:90"),
M("307","307","k",2001,2008,17500,"psa_tu:110|psa_hdi16:110|psa_ew:143"),
M("308 (2007–2013)","308","k",2007,2013,20000,"psa_vti:120|psa_hdi16:112|psa_thp:156"),
M("308 II (2013–2021)","308","k",2013,2021,27000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:ma:dsg_wet|psa_bluehdi20:150:ma:dsg_wet|psa_thp:270:m::1.4:p"),
M("308 III (2021+)","308","k",2021,2026,33000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:a:dsg_wet|psa_hy48:180:a|ev_psa:156:a"),
M("405","405","b",1987,1997,14000,"psa_tu:90"),
M("406","406","b",1995,2004,19000,"psa_ew:135|psa_hdi20_old:110"),
M("407","407","b",2004,2011,24000,"psa_ew:140|psa_hdi16:110|psa_22hdi:170"),
M("508 I","508","b",2011,2018,30000,"psa_thp:156:ma:bva_old|psa_hdi20_old:140|psa_22hdi:204:a:bva_old|psa_bluehdi20:180:a:dsg_wet"),
M("508 II","508","b",2018,2026,38000,"psa_thp:180:a:dsg_wet|psa_bluehdi20:160:a:dsg_wet|psa_hy48:225:a"),
M("607","607","b",2000,2010,35000,"psa_ew:158|psa_22hdi:170"),
M("806/807","806,807","s",1994,2014,26000,"psa_ew:140|psa_22hdi:128"),
M("1007","1007","c",2005,2009,13500,"psa_tu:75:ma:amt"),
M("2008 (2013–2019)","2008","s",2013,2019,19500,"eb2_puretech:110:ma:bva_old|psa_vti:82|psa_hdi16:100"),
M("2008 II","2008","s",2019,2026,27000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:110|ev_psa:136:a"),
M("3008 I","3008","s",2009,2016,25500,"psa_thp:156|psa_hdi16:112|psa_hdi20_old:150|psa_hybrid4:200:a:amt"),
M("3008 II","3008","s",2016,2023,33000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:ma:dsg_wet|psa_bluehdi20:180:a:dsg_wet|psa_hy48:225:a"),
M("3008 III","3008","s",2023,2026,40000,"psa_hy48:136:a|ev_psa:210:a"),
M("4007/4008","4007,4008","s",2007,2017,29000,"psa_22hdi:156|mitsu_did:150"),
M("5008 I","5008","s",2009,2017,26000,"psa_thp:156|psa_hdi16:112|psa_hdi20_old:150"),
M("5008 II","5008","s",2017,2024,36000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:ma:dsg_wet|psa_bluehdi20:180:a:dsg_wet"),
M("RCZ","rcz","p",2010,2015,32000,"psa_thp:200|psa_hdi16:163"),
M("Partner/Rifter","partner,rifter","s",1996,2026,24000,"psa_hdi16:100|eb2_puretech:110|psa_bluehdi15:130:ma:dsg_wet|ev_psa:136:a"),
M("Expert/Traveller","expert,traveller","s",2016,2026,35000,"psa_bluehdi20:180:a:dsg_wet|psa_bluehdi15:120"),
M("Bipper","bipper","c",2008,2014,13000,"psa_hdi16:75|fiat_fire:80"),
M("iOn","ion","e",2010,2018,25000,"nis_leaf:67:a"),
M("e-208","e-208,e208","e",2019,2026,33000,"ev_psa:136:a"),
M("e-2008","e-2008,e2008","e",2020,2026,37000,"ev_psa:136:a")
]);
Br("Citroën","citroen,citroën",1,[
M("AX","ax","c",1986,1998,7500,"psa_tu:50"),
M("Saxo","saxo","c",1996,2003,10000,"psa_tu:60|psa_tu:118:m::1.25:p"),
M("C1","c1","c",2005,2022,11500,"psa_tu:68|psa_pt_atmo:72"),
M("C2","c2","c",2003,2009,12500,"psa_tu:75|psa_tu:125:m::1.2:p"),
M("C3 I","c3","c",2002,2009,13500,"psa_tu:75|psa_hdi16:70"),
M("C3 II","c3","c",2009,2016,15500,"psa_vti:95|psa_hdi16:90|psa_pt_atmo:82"),
M("C3 III","c3","c",2016,2026,19000,"eb2_puretech:110:ma:dsg_wet|psa_bluehdi15:100"),
M("C3 Aircross","c3 aircross,aircross","s",2017,2026,23000,"eb2_puretech:110:ma:dsg_wet|psa_bluehdi15:110"),
M("C3 Picasso","c3 picasso","c",2009,2017,17000,"psa_vti:95|psa_hdi16:92"),
M("C4 I","c4","k",2004,2010,19500,"psa_tu:110|psa_hdi16:110|psa_ew:143"),
M("C4 II","c4","k",2010,2018,22000,"psa_vti:120|psa_hdi16:115|eb2_puretech:130"),
M("C4 III","c4","k",2020,2026,28000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:a:dsg_wet|ev_psa:136:a"),
M("C4 Picasso/SpaceTourer","c4 picasso,spacetourer,grand picasso","s",2006,2022,27000,"psa_hdi16:115|eb2_puretech:130:ma:dsg_wet|psa_bluehdi20:150:a:dsg_wet"),
M("C4 Cactus","cactus","s",2014,2020,18500,"eb2_puretech:110|psa_bluehdi15:100"),
M("C5 I/II","c5","b",2001,2017,28000,"psa_ew:143|psa_hdi16:110|psa_hdi20_old:140|psa_22hdi:170"),
M("C5 X","c5 x,c5x","b",2021,2026,38000,"psa_thp:180:a:dsg_wet|psa_hy48:225:a"),
M("C5 Aircross","c5 aircross","s",2018,2026,32000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:a:dsg_wet|psa_hy48:225:a"),
M("C6","c6","b",2005,2012,45000,"psa_22hdi:173:a:bva_old|jlr_tdv6:240:a:bva_old"),
M("C8","c8","s",2002,2014,30000,"psa_ew:143|psa_22hdi:128"),
M("Xsara","xsara","k",1997,2006,15000,"psa_tu:90|psa_hdi20_old:90"),
M("Xsara Picasso","xsara picasso,picasso","k",1999,2010,17500,"psa_tu:95|psa_hdi16:92"),
M("Xantia","xantia","b",1993,2001,18000,"psa_tu:101|psa_hdi20_old:109"),
M("ZX","zx","k",1991,1998,12000,"psa_tu:75"),
M("Berlingo","berlingo","s",1996,2026,26000,"psa_hdi16:92|eb2_puretech:110|psa_bluehdi15:130:ma:dsg_wet|ev_psa:136:a"),
M("Jumpy/SpaceTourer","jumpy","s",2016,2026,34000,"psa_bluehdi20:180:a:dsg_wet|psa_bluehdi15:120"),
M("Nemo","nemo","c",2008,2014,12500,"psa_hdi16:75"),
M("C-Zero","c-zero,czero","e",2010,2018,25000,"nis_leaf:67:a"),
M("Ami","ami","e",2020,2026,8000,"micro_ev:8:a"),
M("ë-C4","e-c4,ec4","e",2021,2026,36000,"ev_psa:136:a")
]);
Br("DS Automobiles","ds automobiles,ds3,ds4,ds5,ds7,ds9",2,[
M("DS3 (2010–2019)","ds3,ds 3","c",2010,2019,22000,"psa_vti:120|psa_thp:155|psa_bluehdi15:100"),
M("DS3 Crossback","ds3 crossback","s",2019,2026,29000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:110|ev_psa:136:a"),
M("DS4","ds4,ds 4","k",2011,2026,35000,"psa_thp:180:a:dsg_wet|eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:a:dsg_wet"),
M("DS5","ds5,ds 5","b",2011,2018,35000,"psa_thp:165|psa_bluehdi20:180:a:bva_old|psa_hybrid4:200:a:amt"),
M("DS7 Crossback","ds7,ds 7","s",2018,2026,42000,"psa_thp:180:a:dsg_wet|psa_bluehdi20:180:a:dsg_wet|psa_hy48:300:a"),
M("DS9","ds9,ds 9","b",2021,2025,49000,"psa_hy48:250:a")
]);
Br("Renault","renault",1,[
M("Twingo I","twingo","c",1993,2007,8500,"psa_tu:58"),
M("Twingo II","twingo","c",2007,2014,11000,"ren_d4f:75|ren_k4m:133:m::1.2:p"),
M("Twingo III","twingo","c",2014,2024,14500,"ren_tce90:90:ma:edc"),
M("Clio I","clio","c",1990,1998,10000,"ren_k4m:75|ren_f4r:147:m::1.4:p"),
M("Clio II","clio","c",1998,2005,12500,"ren_d4f:75|ren_k4m:98|ren_f4r:172:m::1.5:p"),
M("Clio III","clio","c",2005,2012,15000,"ren_d4f:75|ren_k4m:110|ren_dci15:85|ren_f4r:203:m::1.5:p"),
M("Clio IV","clio","c",2012,2019,17500,"ren_tce90:90|ren_tce_12:120:ma:edc|ren_dci15:90|ren_f4r:220:ma:edc:1.5:p"),
M("Clio V","clio","c",2019,2026,20000,"ren_tce90:100|ren_tce13:130:a:edc|ren_etech:140:a:ecvt|ren_dci15:100"),
M("Captur I","captur","s",2013,2019,20500,"ren_tce90:90|ren_tce_12:120:ma:edc|ren_dci15:90"),
M("Captur II","captur","s",2019,2026,25000,"ren_tce90:90|ren_tce13:140:ma:edc|ren_etech:145:a:ecvt"),
M("Mégane I","megane,mégane","k",1995,2002,15000,"ren_k4m:95"),
M("Mégane II","megane,mégane","k",2002,2009,18500,"ren_k4m:113|ren_f9q:120|ren_f4r:225:m::1.45:p"),
M("Mégane III","megane,mégane","k",2008,2016,22000,"ren_k4m:110|ren_dci15:110|ren_m9r:160|ren_f4r:265:m::1.5:p"),
M("Mégane IV","megane,mégane","k",2016,2024,28000,"ren_tce13:140:ma:edc|ren_dci15:115:ma:edc|ren_f4r:280:ma:edc:1.45:p"),
M("Mégane E-Tech","megane e-tech,megane electrique","e",2022,2026,38000,"ren_ev5:220:a"),
M("Scénic I-III","scenic,scénic","k",1996,2016,22000,"ren_k4m:110|ren_f9q:105|ren_dci15:110"),
M("Scénic IV","scenic,scénic","k",2016,2023,30000,"ren_tce13:140:ma:edc|ren_dci15:110"),
M("Laguna II/III","laguna","b",2001,2015,26000,"ren_k4m:135|ren_f9q:120|ren_m9r:150"),
M("Talisman","talisman","b",2015,2022,33000,"ren_tce13:160:a:edc|ren_r9m:130:ma:edc"),
M("Vel Satis","vel satis,velsatis","b",2002,2009,35000,"psa_ew:170:a:bva_old|ren_m9r:150"),
M("Avantime","avantime","b",2001,2003,35000,"psa_ew:207:m"),
M("Espace III/IV","espace","s",1996,2015,32000,"ren_k4m:140|ren_m9r:150|psa_ew:170"),
M("Espace V","espace","s",2015,2023,38000,"ren_tce13:160:a:edc|ren_m9r:200:a:edc"),
M("Kangoo","kangoo","s",1997,2026,24000,"ren_k4m:90|ren_dci15:95|ren_tce13:130|ev_zoe:120:a"),
M("Modus","modus","c",2004,2012,13500,"ren_d4f:75|ren_dci15:85"),
M("Wind","wind","p",2010,2013,17500,"ren_d4f:100|ren_k4m:133"),
M("Fluence","fluence","b",2009,2016,20000,"ren_k4m:110|ren_dci15:110"),
M("Latitude","latitude","b",2010,2015,28000,"ren_m9r:150:a:bva_old"),
M("Koleos I/II","koleos","s",2008,2023,32000,"ren_m9r:175:a:cvt_jatco|ren_r9m:130"),
M("Kadjar","kadjar","s",2015,2022,29000,"ren_tce13:140:ma:edc|ren_dci15:115"),
M("Arkana","arkana","s",2021,2026,31000,"ren_tce13:140:a:edc|ren_etech:145:a:ecvt"),
M("Austral","austral","s",2022,2026,36000,"ren_tce13:160:a:cvt_jatco|ren_etech:200:a:ecvt"),
M("Rafale","rafale","s",2024,2026,45000,"ren_etech:200:a:ecvt"),
M("Zoé","zoe,zoé","e",2013,2024,33000,"ev_zoe:110:a"),
M("Twizy","twizy","e",2012,2023,8500,"micro_ev:17:a"),
M("R5 E-Tech","r5,5 e-tech","e",2024,2026,28000,"ren_ev5:150:a"),
M("Trafic","trafic","s",2001,2026,32000,"ren_m9r:145|ren_dci15:120"),
M("Master","master","s",2010,2026,38000,"ren_m9r:150")
]);
Br("Dacia","dacia",1,[
M("Logan","logan","b",2005,2026,11500,"ren_k4m:75|ren_dci15:90|ren_tce90:90"),
M("Sandero II/III","sandero","c",2013,2026,13500,"ren_tce90:90|ren_dci15:95|ren_d4f:75"),
M("Duster I","duster","s",2010,2018,15500,"ren_k4m:105|ren_dci15:110|ren_f9q:90"),
M("Duster II/III","duster","s",2018,2026,19500,"ren_tce13:130|ren_dci15:115|ren_tce90:100"),
M("Lodgy","lodgy","s",2012,2022,15500,"ren_tce_12:115|ren_dci15:110"),
M("Jogger","jogger","s",2022,2026,19000,"ren_tce90:110|ren_etech:140:a:ecvt"),
M("Spring","spring","e",2021,2026,19000,"ev_spring:45:a")
]);
Br("Alpine","alpine",2,[
M("A110 (2017+)","a110","p",2017,2026,63000,"alp_18t:252:a:dsg_wet",{floor:.55}),
M("A290","a290","e",2024,2026,38000,"ren_ev5:220:a"),
M("A310/GTA (classiques)","a310,gta","p",1971,1990,40000,"dmc_prv:150",{floor:.9})
]);

/* ================= ALLEMAGNE ================= */
Br("Volkswagen","volkswagen,vw",1,[
M("Lupo","lupo","c",1998,2005,10000,"vag_mpi:60"),
M("Fox","fox","c",2005,2011,10500,"vag_mpi:75"),
M("up!","up!,vw up","c",2012,2023,13500,"vag_mpi:75|vag_ea211:90:m::1.15:p"),
M("Polo III","polo","c",1994,2001,11500,"vag_mpi:60|vag_19tdi:90"),
M("Polo IV","polo","c",2001,2009,14000,"vag_mpi:75|vag_19tdi:100|vag_18t:150:m::1.3:p"),
M("Polo V (2009–2017)","polo","c",2009,2017,17500,"vag_ea111:105:ma:dq200|vag_ea288:90|vag_ea888:192:ma:dq200:1.3:p"),
M("Polo VI (2017+)","polo","c",2017,2026,21000,"vag_ea211:95:ma:dq200|vag_ea288:95|vag_ea888:207:a:dsg_wet:1.3:p"),
M("Golf 3","golf","k",1991,1997,14000,"vag_mpi:75|vag_19tdi:90"),
M("Golf 4","golf","k",1997,2003,17000,"vag_mpi:105|vag_19tdi:110|vag_18t:180:m::1.3:p"),
M("Golf 5","golf","k",2003,2008,19500,"vag_mpi:102|vag_20tdipd:140|vag_fsi:150|vag_ea888:200:ma:dsg_wet:1.3:p"),
M("Golf 6","golf","k",2008,2012,21500,"vag_ea111:122:ma:dq200|vag_ea288:110|vag_ea888:210:ma:dsg_wet:1.3:p"),
M("Golf 7","golf","k",2012,2020,28000,"vag_ea211:125:ma:dq200|vag_ea888:245:ma:dsg_wet:1.38:p|vag_ea288:150:ma:dsg_wet"),
M("Golf 8","golf","k",2020,2026,32000,"vag_ea211:130:ma:dq200|vag_ea888:245:a:dsg_wet:1.35:p|vag_ea288:150:a:dsg_wet"),
M("Jetta/Bora","jetta,bora","b",1998,2018,21000,"vag_mpi:105|vag_ea288:110"),
M("Beetle/New Beetle","beetle,coccinelle","k",1998,2019,21500,"vag_ea111:105|vag_ea288:110|vag_18t:150"),
M("Scirocco III","scirocco","p",2008,2017,26500,"vag_ea888:220:ma:dsg_wet|vag_ea111:122|vag_ea288:140"),
M("Eos","eos","k",2006,2015,26000,"vag_fsi:150|vag_ea888:210"),
M("Touran","touran","s",2003,2026,29000,"vag_ea211:150:ma:dsg_wet|vag_ea288:150:ma:dsg_wet|vag_20tdipd:140"),
M("Sharan","sharan","s",1995,2022,33000,"vag_ea288:150:ma:dsg_wet|vag_19tdi:115"),
M("Tiguan I","tiguan","s",2007,2016,28000,"vag_ea888:180:ma:bva_old|vag_ea288:140:ma:dsg_wet|vag_fsi:150"),
M("Tiguan II","tiguan","s",2016,2024,36000,"vag_ea211:150:ma:dsg_wet|vag_ea288:150:ma:dsg_wet"),
M("Tiguan III","tiguan","s",2024,2026,42000,"vag_ea211:150:a:dsg_wet|vag_ea288:150:a:dsg_wet"),
M("T-Cross","t-cross,tcross","s",2019,2026,24500,"vag_ea211:110:ma:dq200"),
M("Taigo","taigo","s",2021,2026,26000,"vag_ea211:110:ma:dq200"),
M("T-Roc","t-roc,troc","s",2017,2026,29000,"vag_ea211:110:ma:dq200|vag_ea288:115|vag_ea888:300:a:dsg_wet:1.3:p"),
M("Touareg I/II","touareg","s",2002,2018,55000,"vag_30tdi:245:a:bva_old|vag_25tdi:174:a:bva_old"),
M("Touareg III","touareg","s",2018,2026,70000,"vag_30tdi:286:a:zf8"),
M("Passat B5/B6/B7","passat","b",1996,2014,28000,"vag_19tdi:130|vag_20tdipd:140|vag_18t:150|vag_ea288:140:ma:dsg_wet"),
M("Passat B8","passat","b",2014,2023,36000,"vag_ea288:150:ma:dsg_wet|vag_ea888:190:a:dsg_wet"),
M("Arteon","arteon","b",2017,2026,42000,"vag_ea888:190:a:dsg_wet|vag_ea288:150:a:dsg_wet"),
M("Phaeton","phaeton","b",2002,2016,70000,"vag_30tdi:240:a:bva_old",{hold:.6}),
M("CC","cc,passat cc","b",2008,2017,32000,"vag_ea888:210:a:dsg_wet|vag_ea288:140:ma:dsg_wet"),
M("Caddy","caddy","s",2004,2026,26000,"vag_ea288:102|vag_19tdi:105|vag_ea211:114"),
M("Transporter T5/T6","transporter,t5,t6,multivan","s",2003,2026,42000,"vag_ea288:150:ma:dsg_wet|vag_20tdipd:130|vag_19tdi:105"),
M("Amarok","amarok","s",2010,2026,42000,"vag_30tdi:258:a:zf8|vag_ea288:140"),
M("ID.3","id.3,id3","e",2020,2026,38000,"vag_meb:204:a"),
M("ID.4/ID.5","id.4,id4,id.5,id5","e",2021,2026,45000,"vag_meb:204:a"),
M("ID.7","id.7,id7","e",2023,2026,55000,"vag_meb:286:a"),
M("ID. Buzz","id buzz,id.buzz,buzz","e",2022,2026,60000,"vag_meb:204:a")
]);
Br("Audi","audi",2,[
M("A1 (8X)","a1","c",2010,2018,22000,"vag_ea111:122:ma:dq200|vag_ea288:116|vag_ea211:95"),
M("A1 (GB)","a1","c",2018,2026,26000,"vag_ea211:110:ma:dq200|vag_ea888:207:a:dsg_wet:1.25:p"),
M("A2","a2","c",1999,2005,18000,"vag_mpi:75"),
M("A3 (8L)","a3","k",1996,2003,20000,"vag_mpi:102|vag_19tdi:110|vag_18t:180:m::1.25:p"),
M("A3 (8P)","a3","k",2003,2012,24000,"vag_fsi:150|vag_20tdipd:140|vag_ea888:200:ma:dsg_wet"),
M("A3 (8V)","a3","k",2012,2020,28000,"vag_ea211:110:ma:dq200|vag_ea288:150:ma:dsg_wet|vag_ea888:190:a:dsg_wet"),
M("A3 (8Y)","a3","k",2020,2026,33000,"vag_ea211:110:ma:dq200|vag_ea288:116:a:dsg_wet|vag_ea888:190:a:dsg_wet"),
M("S3/RS3","s3,rs3","p",2013,2026,58000,"vag_ea888:310:a:dsg_wet|vag_5cyl:400:a:dsg_wet"),
M("A4 (B6/B7)","a4","b",2000,2008,28000,"vag_18t:163|vag_20tdipd:140|vag_25tdi:163:a:bva_old"),
M("A4 (B8)","a4","b",2008,2015,33000,"vag_ea888:180:ma:dsg_wet|vag_ea288:150:ma:dsg_wet|vag_30tdi:245:a:dsg_wet"),
M("A4 (B9)","a4","b",2015,2025,42000,"vag_ea888:190:a:dsg_wet|vag_ea288:150:ma:dsg_wet|vag_30tdi:286:a:zf8"),
M("A5","a5","b",2007,2026,42000,"vag_ea888:190:a:dsg_wet|vag_ea288:150:a:dsg_wet|vag_30tdi:286:a:zf8"),
M("A6 (C6/C7)","a6","b",2004,2018,45000,"vag_30tdi:245:a:dsg_wet|vag_ea288:190:a:dsg_wet|vag_25tdi:180:a:bva_old"),
M("A6 (C8)","a6","b",2018,2026,55000,"vag_30tdi:286:a:zf8|vag_ea288:204:a:dsg_wet"),
M("A7","a7","b",2010,2026,58000,"vag_30tdi:286:a:zf8|vag_ea888:245:a:dsg_wet"),
M("A8","a8","b",1994,2026,90000,"vag_30tdi:286:a:zf8|vag_18t:310:a:bva_old",{hold:.65}),
M("Q2","q2","s",2016,2026,29000,"vag_ea211:110:ma:dq200|vag_ea288:116:a:dsg_wet"),
M("Q3 (8U)","q3","s",2011,2018,32000,"vag_ea888:170:ma:dsg_wet|vag_ea288:140:ma:dsg_wet"),
M("Q3 (F3)","q3","s",2018,2026,40000,"vag_ea211:150:a:dsg_wet|vag_ea288:150:a:dsg_wet"),
M("Q4 e-tron","q4","e",2021,2026,48000,"vag_etron:204:a"),
M("Q5","q5","s",2008,2026,52000,"vag_ea288:190:a:dsg_wet|vag_ea888:252:a:dsg_wet|vag_30tdi:286:a:zf8"),
M("Q7","q7","s",2006,2026,75000,"vag_30tdi:286:a:zf8|vag_25tdi:233:a:bva_old"),
M("Q8","q8","s",2018,2026,85000,"vag_30tdi:286:a:zf8"),
M("e-tron / Q8 e-tron","e-tron,q8 e-tron","e",2019,2026,75000,"vag_etron:408:a"),
M("e-tron GT","e-tron gt,etron gt","e",2021,2026,105000,"por_ev:476:a"),
M("TT (8N)","tt","p",1998,2006,32000,"vag_18t:225|vag_mpi:150"),
M("TT (8J)","tt","p",2006,2014,36000,"vag_ea888:211:ma:dsg_wet|vag_fsi:160"),
M("TT (8S)","tt","p",2014,2023,44000,"vag_ea888:230:ma:dsg_wet|vag_5cyl:400:a:dsg_wet:1.5"),
M("R8","r8","x",2007,2023,180000,"audi_v10:540:ma:dsg_wet|audi_v10:620:a:dsg_wet",{floor:.55}),
M("RS4/RS6","rs4,rs6","p",2000,2026,125000,"jlr_v8s:450:a:zf8|vag_18t:380:m::1.2",{floor:.45}),
M("A6 Allroad","allroad","s",2000,2011,38000,"vag_25tdi:180:a:bva_old|vag_30tdi:233:a:bva_old")
]);
Br("BMW","bmw",2,[
M("Série 1 (E87)","serie 1,série 1,116,118,120,123","k",2004,2011,25000,"bmw_n46:129|bmw_n47:143:ma:bva_old|bmw_m57:163:ma:bva_old"),
M("Série 1 (F20)","serie 1,série 1,114,116,118,120,125","k",2011,2019,29000,"bmw_n47:116:ma:zf8|bmw_b47:150:ma:zf8|bmw_b48:136:ma:zf8|bmw_6cyl:326:a:zf8:1.35:p"),
M("Série 1 (F40)","serie 1,série 1,118i,118d,128ti","k",2019,2026,32000,"bmw_b48:140:ma:dq200|bmw_b47:150:a:zf8"),
M("Série 2 Coupé","serie 2,série 2,220,230,m240","p",2014,2026,38000,"bmw_b48:184:ma:zf8|bmw_6cyl:340:a:zf8|bmw_b47:190:a:zf8"),
M("Série 2 Active/Gran Tourer","active tourer,gran tourer","s",2014,2026,30000,"bmw_b48:136:ma:dq200|bmw_b47:150:ma:zf8"),
M("Série 2 Gran Coupé","gran coupe,218i","b",2020,2026,34000,"bmw_b48:140:ma:dq200|bmw_b47:150:a:zf8"),
M("Série 3 (E36)","e36,318,320,325,328","b",1990,1998,26000,"bmw_n52:150|bmw_m57:115"),
M("Série 3 (E46)","e46,318,320,330","b",1998,2005,28000,"bmw_n46:143|bmw_m57:150:ma:bva_old|bmw_n52:231:m::1.2:p"),
M("Série 3 (E90)","e90,316,318,320,325,330,335","b",2005,2012,32000,"bmw_n46:143|bmw_n47:177:ma:bva_old|bmw_m57:231:a:bva_old|bmw_n52:218"),
M("Série 3 (F30)","serie 3,série 3,316,318,320,330,335","b",2012,2019,44000,"bmw_n47:184:ma:zf8|bmw_b47:190:ma:zf8|bmw_b48:184:a:zf8|bmw_6cyl:326:a:zf8"),
M("Série 3 (G20)","serie 3,série 3,318d,320d,330i,330e,m340","b",2019,2026,46000,"bmw_b47:190:a:zf8|bmw_b48:184:a:zf8|bmw_6cyl:374:a:zf8:1.3"),
M("Série 4","serie 4,série 4,420,430,440,m440","b",2013,2026,48000,"bmw_b47:190:a:zf8|bmw_b48:184:a:zf8|bmw_6cyl:374:a:zf8:1.25"),
M("Série 5 (E39)","e39,520,525,530","b",1995,2003,38000,"bmw_m57:184:ma:bva_old|bmw_n52:192"),
M("Série 5 (E60)","e60,520,525,530,535","b",2003,2010,42000,"bmw_m57:218:a:bva_old|bmw_n52:218:a:bva_old|bmw_n47:177"),
M("Série 5 (F10)","f10,518,520,525,530,535","b",2010,2017,48000,"bmw_n47:184:a:zf8|bmw_n57:258:a:zf8|bmw_n20:184:a:zf8"),
M("Série 5 (G30)","serie 5,série 5,520d,530d,530e,540","b",2017,2024,55000,"bmw_b47:190:a:zf8|bmw_n57:265:a:zf8|bmw_b48:252:a:zf8"),
M("Série 6","serie 6,série 6,630,640,650","b",2003,2018,65000,"bmw_n57:313:a:zf8|bmw_n52:258:a:bva_old",{hold:.75}),
M("Série 7","serie 7,série 7,730,740,750","b",1994,2026,95000,"bmw_n57:265:a:zf8|bmw_m57:245:a:bva_old|bmw_b48:286:a:zf8",{hold:.68}),
M("Série 8","serie 8,série 8,840,m850","b",2018,2026,105000,"bmw_6cyl:340:a:zf8|jlr_v8s:530:a:zf8",{hold:.72}),
M("X1 (E84)","x1","s",2009,2015,29000,"bmw_n47:143:ma:zf8|bmw_n20:184:a:zf8"),
M("X1 (F48/U11)","x1","s",2015,2026,38000,"bmw_b47:150:ma:zf8|bmw_b48:140:ma:dq200"),
M("X2","x2","s",2018,2026,39000,"bmw_b47:150:a:zf8|bmw_b48:140:a:dq200"),
M("X3 (E83)","x3","s",2003,2010,38000,"bmw_m57:218:a:bva_old|bmw_n47:177"),
M("X3 (F25)","x3","s",2010,2017,45000,"bmw_n47:184:a:zf8|bmw_n57:258:a:zf8"),
M("X3 (G01)","x3","s",2017,2026,52000,"bmw_b47:190:a:zf8|bmw_b48:184:a:zf8|bmw_6cyl:360:a:zf8:1.3"),
M("X4","x4","s",2014,2026,55000,"bmw_b47:190:a:zf8|bmw_6cyl:360:a:zf8"),
M("X5 (E53/E70)","x5","s",2000,2013,60000,"bmw_m57:235:a:bva_old|bmw_n57:245:a:zf8|mb_m113:360:a:bva_old"),
M("X5 (F15/G05)","x5","s",2013,2026,75000,"bmw_n57:258:a:zf8|bmw_b47:231:a:zf8|bmw_6cyl:340:a:zf8"),
M("X6","x6","s",2008,2026,80000,"bmw_n57:258:a:zf8|bmw_6cyl:340:a:zf8"),
M("X7","x7","s",2019,2026,100000,"bmw_6cyl:340:a:zf8|bmw_n57:400:a:zf8"),
M("Z3","z3","p",1996,2002,30000,"bmw_n52:193|bmw_n46:118"),
M("Z4 (E85/E89)","z4","p",2003,2016,40000,"bmw_n52:218|bmw_n20:184:ma:zf8"),
M("Z4 (G29)","z4","p",2018,2026,50000,"bmw_b48:197:a:zf8|bmw_6cyl:340:a:zf8"),
M("M2","m2","p",2016,2026,72000,"bmw_s55:410:ma:dsg_wet",{floor:.5}),
M("M3 (E46)","m3 e46","p",2000,2006,60000,"bmw_n52:343:m::1:p",{floor:.55}),
M("M3 (E92)","m3 e92,m3","p",2007,2013,72000,"bmw_s65:420:ma:dsg_wet",{floor:.5}),
M("M3/M4 (F80/F82)","m3,m4","p",2014,2020,85000,"bmw_s55:431:ma:dsg_wet",{floor:.48}),
M("M3/M4 (G80/G82)","m3,m4","p",2021,2026,105000,"bmw_6cyl:510:a:zf8:1.1",{floor:.55}),
M("M5","m5","b",1998,2026,125000,"jlr_v8s:600:a:dsg_wet|mb_m113:507:a:bva_old",{floor:.4}),
M("i3","i3","e",2013,2022,38000,"bmw_iev:170:a"),
M("i4","i4","e",2021,2026,60000,"bmw_iev:340:a"),
M("iX1/iX3","ix1,ix3","e",2021,2026,55000,"bmw_iev:286:a"),
M("iX","ix","e",2021,2026,85000,"bmw_iev:326:a"),
M("i8","i8","p",2014,2020,145000,"bmw_b48:362:a:dsg_wet",{floor:.45})
]);
Br("Mercedes-Benz","mercedes,mercedes-benz,benz",2,[
M("Classe A (W168/W169)","classe a,a140,a160,a180","c",1997,2012,22000,"mb_om611:95:ma:cvt_jatco|vag_mpi:102"),
M("Classe A (W176)","classe a,a180,a200,a220,a45","k",2012,2018,31000,"mb_m270:156:ma:dct7_mb|mb_om651:136:ma:dct7_mb|mb_m270:381:a:dct7_mb:1.55:p"),
M("Classe A (W177)","classe a,a180,a200,a250,a35","k",2018,2026,34000,"mb_m270:163:a:dct7_mb|ren_dci15:116:a:dct7_mb|mb_m270:306:a:dct7_mb:1.4:p"),
M("Classe B","classe b","s",2005,2026,31000,"mb_m270:163:a:dct7_mb|mb_om651:136:ma:dct7_mb"),
M("CLA","cla","b",2013,2026,37000,"mb_m270:163:a:dct7_mb|mb_om651:136:a:dct7_mb"),
M("Classe C (W202/W203)","classe c,c180,c200,c220","b",1993,2007,32000,"mb_m271:163:ma:bva_old|mb_om611:143:ma:bva_old|mb_m113:367:a:bva_old:1.5:p"),
M("Classe C (W204)","classe c,c180,c200,c220,c250,c63","b",2007,2014,38000,"mb_m271:184:ma:bva_old|mb_om651:170:a:bva_old|mb_m156:457:a:bva_old:1.6:p"),
M("Classe C (W205)","classe c,c180,c200,c220,c300,c43","b",2014,2021,42000,"mb_om651:170:a:dct7_mb|mb_om654:194:a:bva_old|mb_m270:184:a:bva_old|jlr_v8s:390:a:bva_old"),
M("Classe C (W206)","classe c,c200,c220d,c300","b",2021,2026,49000,"mb_om654:200:a:bva_old|mb_m270:204:a:bva_old"),
M("CLK/CLS","clk,cls","b",1997,2026,52000,"mb_m113:306:a:bva_old|mb_om642:265:a:bva_old|mb_om654:300:a:bva_old",{hold:.8}),
M("Classe E (W210/W211)","classe e,e200,e220,e270,e320","b",1995,2009,42000,"mb_om611:170:a:bva_old|mb_m113:306:a:bva_old|mb_om642:224:a:bva_old"),
M("Classe E (W212)","classe e,e200,e220,e250,e350","b",2009,2016,48000,"mb_om651:170:a:bva_old|mb_om642:265:a:bva_old|mb_m271:184:a:bva_old"),
M("Classe E (W213)","classe e,e200,e220d,e300,e400","b",2016,2023,55000,"mb_om654:194:a:bva_old|mb_om642:340:a:bva_old|mb_m270:245:a:bva_old"),
M("Classe S (W220/W221)","classe s,s320,s350,s500","b",1998,2013,85000,"mb_m113:306:a:bva_old|mb_om642:235:a:bva_old",{hold:.6}),
M("Classe S (W222/W223)","classe s,s350d,s400,s500,s580","b",2013,2026,110000,"mb_om642:286:a:bva_old|mb_om654:330:a:bva_old",{hold:.65}),
M("SLK/SLC","slk,slc","p",1996,2020,42000,"mb_m271:184:ma:bva_old|mb_m113:360:a:bva_old:1.4"),
M("SL","sl","p",1989,2026,110000,"mb_m113:306:a:bva_old|jlr_v8s:435:a:bva_old",{hold:.7}),
M("GLA (X156/H247)","gla","s",2014,2026,38000,"mb_m270:156:a:dct7_mb|mb_om651:136:a:dct7_mb|mb_om654:150:a:bva_old"),
M("GLB","glb","s",2019,2026,42000,"mb_m270:163:a:dct7_mb|mb_om654:150:a:bva_old"),
M("GLK/GLC","glk,glc","s",2008,2026,52000,"mb_om651:170:a:bva_old|mb_om654:194:a:bva_old|mb_om642:224:a:bva_old"),
M("ML/GLE","ml,gle","s",1997,2026,68000,"mb_om642:258:a:bva_old|mb_om654:245:a:bva_old|mb_m113:306:a:bva_old"),
M("GLS/GL","gls,gl","s",2006,2026,90000,"mb_om642:330:a:bva_old"),
M("Classe G","classe g,g350,g400,g500,g63","s",1990,2026,130000,"mb_om642:286:a:bva_old|jlr_v8s:585:a:zf8:1.4",{floor:.62}),
M("Vito/Classe V","vito,classe v,viano","s",1996,2026,45000,"mb_om651:163:ma:bva_old|mb_om611:122"),
M("Citan","citan","c",2012,2026,22000,"ren_dci15:95|ren_tce90:102"),
M("Sprinter","sprinter","s",1995,2026,45000,"mb_om651:163|mb_om611:129"),
M("EQA/EQB","eqa,eqb","e",2021,2026,50000,"mb_eq:190:a"),
M("EQC","eqc","e",2019,2024,70000,"mb_eq:408:a"),
M("EQE/EQS","eqe,eqs","e",2021,2026,95000,"mb_eq:292:a",{hold:.6}),
M("AMG GT","amg gt","x",2015,2026,160000,"aston_v8:476:a:dsg_wet",{floor:.55}),
M("190 (W201)","190,190e","b",1982,1993,20000,"mb_om611:90:m",{floor:.5})
]);
Br("Smart","smart",1,[
M("Fortwo (450/451)","fortwo,for two","c",1998,2014,11500,"ren_d4f:71:a:amt"),
M("Fortwo (453)","fortwo","c",2014,2024,13500,"ren_tce90:90:ma:dct7_mb"),
M("Forfour","forfour","c",2004,2021,14500,"ren_tce90:90:ma:dct7_mb|ren_d4f:75"),
M("EQ Fortwo","eq fortwo","e",2017,2024,25000,"smart_ev:82:a"),
M("#1 / #3","smart #1,smart#1,#1,#3","e",2022,2026,42000,"zeekr_ev:272:a")
]);
Br("Mini","mini,cooper",2,[
M("Cooper (R50/R53)","cooper,mini one","c",2001,2006,19000,"psa_vti:116|psa_thp:170:m::1.25:p"),
M("Cooper (R56)","cooper,mini cooper","c",2007,2013,22000,"psa_vti:122|psa_thp:184:m::1.25:p|psa_hdi16:112"),
M("Cooper (F56)","cooper,mini cooper","c",2014,2026,26000,"bmw_b48:136:ma:dq200|bmw_b48:192:ma:dsg_wet:1.2:p|bmw_b47:116"),
M("Clubman","clubman","k",2007,2024,28000,"bmw_b48:136:ma:dq200|psa_thp:184"),
M("Countryman","countryman","s",2010,2026,32000,"bmw_b48:136:ma:dq200|bmw_b47:150:a:zf8|psa_thp:184"),
M("Mini électrique (SE)","mini se,mini electrique","e",2020,2026,34000,"bmw_iev:184:a")
]);
Br("Opel","opel",1,[
M("Corsa C/D","corsa","c",2000,2014,13500,"gm_ecotec:90|psa_hdi16:75|opel_sge:192:m::1.35:p"),
M("Corsa E","corsa","c",2014,2019,16500,"opel_sge:100|opel_cdti:95"),
M("Corsa F","corsa","c",2019,2026,20000,"eb2_puretech:100:ma:dsg_wet|ev_psa:136:a"),
M("Astra H/J","astra","k",2004,2015,21000,"gm_ecotec:115|opel_cdti:110|fiat_jtd:150"),
M("Astra K","astra","k",2015,2021,25000,"opel_sge:105|opel_cdti:110|eb2_puretech:130"),
M("Astra L","astra","k",2021,2026,30000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:a:dsg_wet"),
M("Insignia","insignia","b",2008,2022,32000,"opel_cdti:170:a:bva_old|gm_ecotec:140|psa_bluehdi20:174:a:dsg_wet"),
M("Zafira","zafira","s",1999,2019,26000,"gm_ecotec:115|opel_cdti:134|fiat_jtd:150"),
M("Meriva","meriva","c",2003,2017,17500,"gm_ecotec:100|opel_cdti:95"),
M("Mokka A","mokka","s",2012,2019,22000,"opel_sge:140|opel_cdti:136"),
M("Mokka B","mokka","s",2021,2026,26000,"eb2_puretech:130:ma:dsg_wet|ev_psa:136:a"),
M("Crossland","crossland","s",2017,2025,24000,"eb2_puretech:110:ma:dsg_wet|psa_bluehdi15:110"),
M("Grandland","grandland","s",2017,2026,32000,"eb2_puretech:130:ma:dsg_wet|psa_bluehdi15:130:a:dsg_wet|psa_hy48:225:a"),
M("Adam","adam","c",2013,2019,15500,"opel_sge:100"),
M("Karl","karl","c",2015,2019,11500,"gm_ecotec:75"),
M("Tigra","tigra","p",1994,2009,16000,"gm_ecotec:90"),
M("GT/Speedster","opel gt,speedster","p",2000,2010,30000,"gm_ecotec:264:m::1.2",{floor:.5}),
M("Combo","combo","s",2001,2026,22000,"psa_bluehdi15:100|opel_cdti:95")
]);
Br("Alpina","alpina",3,[
M("B3/D3","b3,d3","b",1999,2026,95000,"bmw_6cyl:462:a:zf8|bmw_n57:350:a:zf8",{floor:.5}),
M("B5/D5","b5,d5","b",2005,2026,130000,"jlr_v8s:608:a:zf8",{floor:.5}),
M("XD3/XB7","xd3,xb7","s",2018,2026,120000,"bmw_n57:388:a:zf8|jlr_v8s:621:a:zf8",{floor:.5})
]);

/* ================= ITALIE / ESPAGNE / TCHÉQUIE / SCANDINAVIE / UK ================= */
Br("Fiat","fiat",1,[
M("Panda II/III","panda","c",2003,2026,14000,"fiat_fire:69|fiat_twinair:85|fiat_mjet:75"),
M("500 (2007–2024)","500","c",2007,2024,16500,"fiat_fire:69|fiat_twinair:85|fiat_mjet:95"),
M("500e","500e,500 electrique","e",2020,2026,30000,"ev_psa:118:a"),
M("500X","500x","s",2014,2024,22000,"fiat_multiair:140:ma:dsg_wet|fiat_mjet:120|fiat_fire:120"),
M("500L","500l","c",2012,2022,18000,"fiat_twinair:105|fiat_mjet:120"),
M("Punto/Grande Punto","punto","c",1999,2018,13500,"fiat_fire:77|fiat_mjet:90|fiat_tjet:180:m::1.3:p"),
M("Tipo","tipo","k",2016,2025,17500,"fiat_fire:95|fiat_mjet:120"),
M("Bravo","bravo","k",2007,2014,18500,"fiat_tjet:150|fiat_mjet:120"),
M("Doblo","doblo","s",2001,2026,21000,"fiat_mjet:105|psa_bluehdi15:100"),
M("Ducato","ducato","s",1994,2026,35000,"fiat_mjet:140|psa_22hdi:130"),
M("Barchetta","barchetta","p",1995,2005,18000,"fiat_fire:130"),
M("Coupé Fiat","coupe fiat","p",1993,2000,25000,"fiat_tjet:220",{floor:.5}),
M("124 Spider","124 spider","p",2016,2020,28000,"fiat_multiair:140",{floor:.55}),
M("Freemont","freemont","s",2011,2016,28000,"dodge_v6:280:a:bva_old|fiat_jtd:170")
]);
Br("Abarth","abarth",2,[
M("595/695","595,695,abarth 500","c",2008,2024,26000,"fiat_tjet:180:m::1:p"),
M("124 Spider Abarth","124 abarth","p",2016,2020,38000,"fiat_multiair:170",{floor:.55}),
M("500e Abarth","500e abarth","e",2023,2026,38000,"ev_psa:155:a"),
M("Punto Evo Abarth","punto abarth","c",2010,2014,20000,"fiat_tjet:165:m::1:p")
]);
Br("Lancia","lancia",1,[
M("Ypsilon","ypsilon","c",2003,2026,15500,"fiat_fire:69|fiat_twinair:85|fiat_mjet:95"),
M("Delta III","delta","k",2008,2014,24000,"fiat_tjet:200|fiat_jtd:165"),
M("Musa","musa","c",2004,2012,14500,"fiat_fire:77|fiat_mjet:90"),
M("Thema","thema","b",2011,2014,42000,"dodge_v6:286:a:bva_old|mb_om642:239:a:bva_old"),
M("Delta HF Intégrale (classique)","delta integrale,integrale","p",1987,1994,45000,"mitsu_4g63:210",{floor:1.2}),
M("Voyager","voyager","s",2011,2015,32000,"dodge_v6:283:a:bva_old|fiat_jtd:163")
]);
Br("Alfa Romeo","alfa romeo,alfa,alfa-romeo",2,[
M("147","147","k",2000,2010,20000,"fiat_fire:105|fiat_jtd:150|nis_vq:250:m::1.6:p"),
M("156/159","156,159","b",1997,2011,26000,"fiat_jtd:150|fiat_fire:120|alfa_tbi:200"),
M("Giulietta","giulietta","k",2010,2020,27000,"fiat_multiair:170:ma:dsg_wet|fiat_mjet:120|alfa_tbi:240:ma:dsg_wet:1.3:p"),
M("MiTo","mito","c",2008,2018,18500,"fiat_multiair:135|fiat_twinair:105|fiat_mjet:95"),
M("Giulia","giulia","b",2016,2026,45000,"alfa_22d:190:a:zf8|alfa_veloce:280:a:zf8"),
M("Giulia Quadrifoglio","quadrifoglio,giulia qv","p",2016,2026,90000,"fer_v12:510:a:zf8:0.85",{floor:.5}),
M("Stelvio","stelvio","s",2017,2026,50000,"alfa_22d:190:a:zf8|alfa_veloce:280:a:zf8"),
M("Tonale","tonale","s",2022,2026,38000,"fiat_multiair:160:a:dct7_mb|psa_hy48:280:a"),
M("GT/Brera","alfa gt,brera","p",2003,2010,28000,"fiat_jtd:150|nis_vq:260:m::1.4"),
M("Spider","alfa spider","p",1995,2010,30000,"fiat_fire:150|nis_vq:260:m::1.3"),
M("4C","4c","p",2013,2020,60000,"alfa_tbi:240",{floor:.75}),
M("8C Competizione","8c","x",2007,2010,160000,"fer_v8:450:a:f1_robot",{floor:1.5})
]);
Br("Ferrari","ferrari",3,[
M("360 Modena","360","x",1999,2005,150000,"fer_f1v8:400:ma:f1_robot",{floor:.55}),
M("F430","f430,430","x",2004,2009,175000,"fer_f1v8:490:ma:f1_robot",{floor:.65}),
M("458 Italia","458","x",2010,2015,240000,"fer_v8:570:a:dsg_wet",{floor:.8}),
M("488 GTB","488","x",2015,2019,225000,"fer_v8:670:a:dsg_wet",{floor:.8}),
M("F8 Tributo","f8","x",2019,2023,260000,"fer_v8:720:a:dsg_wet",{floor:.8}),
M("California / California T","california","x",2008,2017,180000,"fer_v8:560:a:dsg_wet",{floor:.5}),
M("Portofino","portofino","x",2017,2023,200000,"fer_v8:600:a:dsg_wet",{floor:.65}),
M("Roma","roma","x",2020,2026,220000,"fer_v8:620:a:dsg_wet",{floor:.7}),
M("550/575/599","550,575,599","x",1996,2012,180000,"fer_v12:485:ma:f1_robot",{floor:.9}),
M("812 Superfast","812","x",2017,2023,320000,"fer_v12:800:a:dsg_wet",{floor:.85}),
M("FF / GTC4Lusso","ff,gtc4","x",2011,2020,260000,"fer_v12:660:a:dsg_wet",{floor:.5}),
M("Testarossa (classique)","testarossa","x",1984,1996,120000,"fer_v12:390",{floor:1.1})
]);
Br("Lamborghini","lamborghini,lambo",3,[
M("Gallardo","gallardo","x",2003,2013,195000,"lam_gallardo:560:ma:f1_robot",{floor:.55}),
M("Huracán","huracan,huracán,lp580,lp610,evo","x",2014,2024,260000,"lam_huracan:610:a:dsg_wet",{floor:.68}),
M("Aventador","aventador","x",2011,2022,340000,"lam_v12:700:a:f1_robot",{floor:.75}),
M("Murciélago","murcielago,murciélago","x",2001,2010,280000,"lam_v12:580:ma:f1_robot",{floor:1}),
M("Urus","urus","x",2018,2026,230000,"lam_urus:650:a:zf8",{floor:.7}),
M("Revuelto","revuelto","x",2023,2026,500000,"lam_v12:1015:a:dsg_wet",{floor:.9})
]);
Br("Maserati","maserati",3,[
M("Ghibli III","ghibli","b",2013,2023,78000,"mas_v6:350:a:zf8",{hold:.8}),
M("Levante","levante","s",2016,2023,88000,"mas_v6:350:a:zf8",{hold:.8}),
M("Quattroporte V/VI","quattroporte","b",2004,2023,110000,"mas_v6:410:a:zf8|fer_v8:390:a:f1_robot",{hold:.7}),
M("GranTurismo","granturismo","x",2007,2026,130000,"fer_v8:460:a:bva_old",{floor:.5}),
M("MC20","mc20","x",2020,2026,230000,"mas_v6:630:a:dsg_wet",{floor:.7}),
M("3200/4200 GT","3200,4200,coupe gt","x",1998,2007,80000,"fer_v8:390:ma:f1_robot",{floor:.45}),
M("Grecale","grecale","s",2022,2026,78000,"mas_v6:300:a:zf8",{hold:.85})
]);
Br("Seat","seat",1,[
M("Ibiza III/IV","ibiza","c",2002,2017,16500,"vag_mpi:85|vag_ea111:105:ma:dq200|vag_19tdi:105|vag_20tdipd:160:m::1.3:p"),
M("Ibiza V","ibiza","c",2017,2026,20000,"vag_ea211:95:ma:dq200|vag_ea288:95"),
M("Leon II","leon,león","k",2005,2012,21000,"vag_fsi:150|vag_20tdipd:140|vag_ea888:240:m::1.3:p"),
M("Leon III/IV","leon,león","k",2013,2026,27000,"vag_ea211:130:ma:dq200|vag_ea888:300:a:dsg_wet:1.35:p|vag_ea288:150:ma:dsg_wet"),
M("Arona","arona","s",2017,2026,23500,"vag_ea211:110:ma:dq200"),
M("Ateca","ateca","s",2016,2026,31000,"vag_ea211:150:ma:dsg_wet|vag_ea288:150:ma:dsg_wet"),
M("Tarraco","tarraco","s",2018,2026,38000,"vag_ea211:150:a:dsg_wet|vag_ea288:200:a:dsg_wet"),
M("Alhambra","alhambra","s",1996,2020,34000,"vag_ea288:150:ma:dsg_wet|vag_19tdi:115"),
M("Mii","mii","c",2012,2021,12500,"vag_mpi:75"),
M("Altea/Toledo","altea,toledo","k",2004,2015,19000,"vag_mpi:102|vag_20tdipd:140")
]);
Br("Cupra","cupra",1,[
M("Formentor","formentor","s",2020,2026,42000,"vag_ea888:310:a:dsg_wet|vag_ea211:150:a:dsg_wet|psa_hy48:245:a"),
M("Leon Cupra","leon cupra,cupra leon","k",2020,2026,45000,"vag_ea888:300:a:dsg_wet:1:p"),
M("Born","born","e",2021,2026,40000,"vag_meb:204:a"),
M("Ateca Cupra","cupra ateca","s",2018,2026,48000,"vag_ea888:300:a:dsg_wet"),
M("Tavascan","tavascan","e",2024,2026,48000,"vag_meb:286:a")
]);
Br("Škoda","skoda,škoda",1,[
M("Fabia I/II","fabia","c",1999,2014,14500,"vag_mpi:75|vag_19tdi:105|vag_ea111:105"),
M("Fabia III/IV","fabia","c",2014,2026,19000,"vag_ea211:95:ma:dq200|vag_ea288:90"),
M("Octavia I/II","octavia","b",1996,2013,20000,"vag_19tdi:105|vag_20tdipd:140|vag_fsi:150|vag_ea888:200:ma:dsg_wet:1.25:p"),
M("Octavia III/IV","octavia","b",2013,2026,29000,"vag_ea211:150:ma:dsg_wet|vag_ea288:150:ma:dsg_wet|vag_ea888:245:a:dsg_wet:1.3:p"),
M("Superb","superb","b",2002,2026,36000,"vag_ea288:190:a:dsg_wet|vag_ea888:220:a:dsg_wet|vag_19tdi:130"),
M("Kamiq","kamiq","s",2019,2026,25500,"vag_ea211:110:ma:dq200"),
M("Karoq","karoq","s",2017,2026,31000,"vag_ea211:150:ma:dsg_wet|vag_ea288:150:ma:dsg_wet"),
M("Kodiaq","kodiaq","s",2017,2026,38000,"vag_ea211:150:ma:dsg_wet|vag_ea288:190:a:dsg_wet"),
M("Yeti","yeti","s",2009,2017,23000,"vag_ea111:105|vag_ea288:140:ma:dsg_wet"),
M("Roomster","roomster","c",2006,2015,15500,"vag_mpi:86|vag_19tdi:105"),
M("Citigo","citigo","c",2012,2020,12000,"vag_mpi:75"),
M("Enyaq","enyaq","e",2021,2026,46000,"vag_meb:204:a"),
M("Rapid/Scala","rapid,scala","k",2012,2026,19500,"vag_ea211:110:ma:dq200|vag_ea288:95")
]);
Br("Volvo","volvo",2,[
M("V40 (2012–2019)","v40","k",2012,2019,30000,"volvo_de:120:ma:zf8|volvo_5cyl:150:a:bva_old"),
M("S40/V50","s40,v50","b",2004,2012,26000,"volvo_5cyl:136:ma:bva_old|psa_hdi16:109|ford_duratec:125"),
M("S60/V60","s60,v60","b",2010,2026,42000,"volvo_de:190:a:zf8|volvo_5cyl:163:a:bva_old|volvo_t8:390:a:zf8"),
M("S80/V70","s80,v70","b",1998,2016,38000,"volvo_5cyl:185:a:bva_old|volvo_de:181:a:zf8"),
M("S90/V90","s90,v90","b",2016,2026,52000,"volvo_de:190:a:zf8|volvo_t8:390:a:zf8"),
M("XC40","xc40,xc 40","s",2018,2026,44000,"volvo_de:163:a:zf8|volvo_ev:231:a"),
M("XC60 I","xc60","s",2008,2017,45000,"volvo_5cyl:185:a:bva_old|volvo_de:190:a:zf8"),
M("XC60 II","xc60,xc 60","s",2017,2026,56000,"volvo_de:190:a:zf8|volvo_t8:390:a:zf8"),
M("XC70","xc70","s",2000,2016,42000,"volvo_5cyl:185:a:bva_old"),
M("XC90 I","xc90","s",2002,2014,55000,"volvo_5cyl:185:a:bva_old|jlr_tdv6:200:a:bva_old"),
M("XC90 II","xc90","s",2015,2026,75000,"volvo_de:235:a:zf8|volvo_t8:390:a:zf8"),
M("C30","c30","k",2006,2013,24000,"volvo_5cyl:170:ma:bva_old|psa_hdi16:109"),
M("C70","c70","p",1997,2013,38000,"volvo_5cyl:230:a:bva_old"),
M("EX30/EX90","ex30,ex90","e",2023,2026,43000,"volvo_ev:272:a"),
M("C40 Recharge","c40","e",2021,2026,48000,"volvo_ev:231:a")
]);
Br("Polestar","polestar",2,[
M("Polestar 1","polestar 1","p",2019,2021,155000,"volvo_t8:609:a:zf8",{floor:.5}),
M("Polestar 2","polestar 2","e",2020,2026,50000,"pol_ev:231:a"),
M("Polestar 3/4","polestar 3,polestar 4","e",2023,2026,80000,"pol_ev:489:a")
]);
Br("Saab","saab",2,[
M("9-3","9-3,93","b",1998,2011,30000,"saab_t:150:ma:bva_old|fiat_jtd:150|saab_t:175:a:bva_old"),
M("9-5","9-5,95","b",1997,2011,36000,"saab_t:185:a:bva_old|fiat_jtd:150"),
M("900 (classique)","saab 900","k",1978,1998,20000,"saab_t:175",{floor:.6})
]);
Br("Jaguar","jaguar",2,[
M("X-Type","x-type,xtype","b",2001,2009,32000,"ford_tdci18:130|ford_duratec:194"),
M("S-Type","s-type,stype","b",1999,2007,42000,"jlr_tdv6:207:a:bva_old|jlr_v8s:298:a:bva_old"),
M("XE","xe","b",2015,2024,42000,"jlr_ing_d:180:a:zf8|jlr_ing_p:250:a:zf8"),
M("XF","xf","b",2008,2024,52000,"jlr_tdv6:240:a:zf8|jlr_ing_d:180:a:zf8|jlr_v8s:510:a:zf8:1.3"),
M("XJ","xj","b",1997,2019,80000,"jlr_tdv6:275:a:zf8|jlr_v8s:470:a:zf8",{hold:.65}),
M("F-Pace","f-pace,fpace","s",2016,2026,58000,"jlr_ing_d:180:a:zf8|jlr_ing_p:250:a:zf8|jlr_v8s:550:a:zf8:1.35"),
M("E-Pace","e-pace,epace","s",2018,2026,42000,"jlr_ing_d:150:a:zf8|jlr_ing_p:200:a:zf8"),
M("F-Type","f-type,ftype","p",2013,2024,75000,"jlr_v8s:450:a:zf8|jlr_ing_p:300:a:zf8",{floor:.45}),
M("XK/XKR","xk,xkr","p",1996,2014,60000,"jlr_v8s:416:a:bva_old",{floor:.4}),
M("I-Pace","i-pace,ipace","e",2018,2024,80000,"jlr_ipace:400:a")
]);
Br("Land Rover","land rover,landrover,range rover",2,[
M("Defender (classique)","defender","s",1990,2016,45000,"psa_hdi20_old:122|ford_tdci18:122",{floor:.85}),
M("Defender (2020+)","defender","s",2020,2026,75000,"jlr_ing_d:200:a:zf8|jlr_ing_p:300:a:zf8",{floor:.55}),
M("Discovery 3/4","discovery","s",2004,2016,52000,"jlr_tdv6:245:a:bva_old"),
M("Discovery 5","discovery","s",2017,2026,65000,"jlr_ing_d:249:a:zf8|jlr_tdv6:306:a:zf8"),
M("Discovery Sport","discovery sport","s",2015,2026,48000,"jlr_ing_d:150:a:zf8|jlr_ing_p:200:a:zf8"),
M("Freelander","freelander","s",1997,2014,32000,"ford_tdci18:150|jlr_tdv6:190:a:bva_old"),
M("Range Rover Evoque","evoque","s",2011,2026,48000,"jlr_ing_d:150:a:zf8|jlr_ing_p:200:a:zf8|jlr_tdv6:190:a:zf8"),
M("Range Rover Sport","range sport,rr sport","s",2005,2026,85000,"jlr_tdv6:256:a:zf8|jlr_v8s:510:a:zf8|jlr_ing_d:249:a:zf8"),
M("Range Rover Velar","velar","s",2017,2026,65000,"jlr_ing_d:204:a:zf8|jlr_ing_p:250:a:zf8"),
M("Range Rover","range rover","s",1994,2026,120000,"jlr_tdv6:272:a:zf8|jlr_v8s:525:a:zf8|vag_30tdi:313:a:zf8",{hold:.75})
]);
Br("Bentley","bentley",3,[
M("Continental GT I/II","continental","x",2003,2018,180000,"bentley_w12:560:a:zf8",{floor:.35}),
M("Continental GT III","continental","x",2018,2026,235000,"bentley_w12:635:a:dsg_wet",{floor:.6}),
M("Flying Spur","flying spur","b",2005,2026,220000,"bentley_w12:635:a:dsg_wet",{hold:.5}),
M("Bentayga","bentayga","s",2016,2026,210000,"bentley_w12:608:a:zf8|vag_30tdi:435:a:zf8",{hold:.75}),
M("Arnage (classique)","arnage","b",1998,2009,180000,"rr_v12:405:a:bva_old",{floor:.35})
]);
Br("Rolls-Royce","rolls-royce,rolls royce,rolls",3,[
M("Ghost","ghost","b",2010,2026,300000,"rr_v12:571:a:zf8",{floor:.45}),
M("Wraith/Dawn","wraith,dawn","x",2013,2023,320000,"rr_v12:632:a:zf8",{floor:.5}),
M("Phantom","phantom","b",2003,2026,450000,"rr_v12:571:a:zf8",{floor:.5}),
M("Cullinan","cullinan","s",2018,2026,400000,"rr_v12:571:a:zf8",{floor:.65}),
M("Silver Seraph (classique)","silver seraph,silver spur","b",1980,2002,80000,"rr_v12:326:a:bva_old",{floor:.5})
]);
Br("Aston Martin","aston martin,aston",3,[
M("V8 Vantage (2005–2017)","vantage","x",2005,2017,120000,"jlr_v8s:426:ma:f1_robot",{floor:.55}),
M("Vantage (2018+)","vantage","x",2018,2026,165000,"aston_v8:510:a:zf8",{floor:.6}),
M("DB9","db9","x",2004,2016,160000,"aston_v12o:477:a:bva_old",{floor:.45}),
M("DB11","db11","x",2016,2023,210000,"aston_v8:535:a:zf8|aston_v12o:639:a:zf8",{floor:.55}),
M("DBS","dbs","x",2007,2026,280000,"aston_v12o:725:a:zf8",{floor:.6}),
M("DBX","dbx","s",2020,2026,200000,"aston_v8:550:a:zf8",{hold:.75}),
M("DB7 (classique)","db7","x",1994,2004,70000,"aston_v12o:420:ma:bva_old",{floor:.55})
]);
Br("McLaren","mclaren,mc laren",3,[
M("570S / 540C","570s,570,540c","x",2015,2021,195000,"mcl_v8:570:a:dsg_wet",{hold:.72}),
M("650S / 675LT","650s,675lt","x",2014,2017,230000,"mcl_v8:650:a:dsg_wet",{hold:.72}),
M("720S / 765LT","720s,720,765lt","x",2017,2023,250000,"mcl_v8:720:a:dsg_wet",{hold:.8}),
M("GT","mclaren gt","x",2019,2026,220000,"mcl_v8:620:a:dsg_wet",{hold:.75}),
M("Artura","artura","x",2022,2026,250000,"mcl_v8:680:a:dsg_wet",{hold:.85}),
M("MP4-12C","mp4,12c","x",2011,2014,180000,"mcl_v8:625:a:dsg_wet",{hold:.65})
]);
Br("Lotus","lotus",2,[
M("Elise S1","elise","p",1996,2001,40000,"lotus_rover:120",{floor:.85}),
M("Elise S2/S3","elise","p",2001,2021,50000,"lotus_toy:136",{floor:.85}),
M("Exige","exige","p",2000,2021,70000,"lotus_toy:243|lotus_v6:350",{floor:.9}),
M("Evora","evora","p",2009,2021,75000,"lotus_v6:280:ma:bva_old",{floor:.7}),
M("Emira","emira","p",2022,2026,100000,"lotus_v6:400|mb_m270:365:a:dct7_mb",{floor:.75}),
M("Eletre","eletre","e",2023,2026,100000,"lotus_ev:603:a"),
M("Esprit (classique)","esprit","x",1976,2004,60000,"jlr_v8s:349",{floor:.9})
]);
Br("Morgan","morgan",3,[
M("4/4 & Plus Four","4/4,plus four,plus 4","p",1955,2026,75000,"morgan_eng:255:ma:zf8",{floor:.8}),
M("Plus Six","plus six,plus 6","p",2019,2026,105000,"morgan_eng:340:a:zf8",{floor:.75}),
M("3 Wheeler","3 wheeler,threewheeler","p",2012,2026,50000,"morgan_eng:82",{floor:.8})
]);
Br("Caterham","caterham",3,[
M("Seven 170/275","seven,super seven","p",1990,2026,40000,"cat_sigma:135",{floor:.85}),
M("Seven 420/620","seven 420,seven 620","p",2013,2026,65000,"cat_sigma:310",{floor:.85})
]);
Br("TVR","tvr",3,[
M("Tuscan/Sagaris","tuscan,sagaris","x",1999,2006,60000,"tvr_s6:400",{floor:.85}),
M("Chimaera/Griffith","chimaera,griffith","x",1992,2002,45000,"jlr_v8s:340",{floor:.9})
]);
Br("Wiesmann","wiesmann",3,[
M("MF3/MF4/MF5","mf3,mf4,mf5","x",1993,2014,180000,"wies_bmw:367",{floor:.8})
]);
Br("Donkervoort","donkervoort",3,[
M("D8 GTO","d8,gto","x",2013,2026,180000,"donk_audi:415",{floor:.8})
]);
Br("KTM","ktm",3,[
M("X-Bow","x-bow,xbow","x",2008,2026,100000,"ktm_20t:300",{floor:.7})
]);
Br("Bugatti","bugatti",3,[
M("Veyron","veyron","x",2005,2015,1500000,"bug_w16:1001:a:dsg_wet",{floor:1.15,mx:8}),
M("Chiron","chiron","x",2016,2024,2500000,"bug_w16:1500:a:dsg_wet",{floor:1.05,mx:8})
]);
Br("Pagani","pagani",3,[
M("Zonda","zonda","x",1999,2017,500000,"pag_v12:602:ma:f1_robot",{floor:2.5,mx:5}),
M("Huayra","huayra","x",2012,2022,1100000,"pag_v12:730:a:f1_robot",{floor:1.3,mx:5})
]);
Br("Koenigsegg","koenigsegg",3,[
M("Agera","agera","x",2010,2018,1200000,"koe_v8:960:a:dsg_wet",{floor:1.5,mx:5}),
M("Jesko","jesko","x",2021,2026,2500000,"koe_v8:1280:a:dsg_wet",{floor:1.1,mx:5})
]);
Br("Rimac","rimac",3,[
M("Nevera","nevera","x",2021,2026,2000000,"rimac_ev:1914:a",{floor:.8,mx:3})
]);
Br("MG","mg motor",1,[
M("MG3","mg3,mg 3","c",2013,2026,17000,"hk_atmo:102|honda_hev:194:a:ecvt"),
M("ZS / ZS EV","zs,zs ev","s",2018,2026,23000,"mg_t:106|mg_ev:156:a"),
M("MG4","mg4,mg 4","e",2022,2026,30000,"mg_ev:204:a"),
M("MG5","mg5,mg 5","e",2022,2026,32000,"mg_ev:156:a"),
M("EHS/HS","ehs,mg hs","s",2020,2026,30000,"mg_t:162:a:dsg_wet|lynk_phev:258:a"),
M("Marvel R","marvel r,marvel","e",2021,2025,40000,"mg_ev:288:a"),
M("MG TF (classique)","mg tf,mgf","p",1995,2005,18000,"rover_k:135",{floor:.5}),
M("MGB (classique)","mgb","p",1962,1980,25000,"rover_k:95",{floor:1})
]);
Br("Rover","rover",1,[
M("25/45","rover 25,rover 45","k",1999,2005,14000,"rover_k:103|psa_hdi20_old:101"),
M("75","rover 75","b",1999,2005,25000,"rover_k:150|bmw_m57:116:ma:bva_old"),
M("Mini (classique)","austin mini,mini classique","c",1959,2000,12000,"psa_tu:63",{floor:1.2})
]);
Br("Lada","lada",1,[
M("Niva","niva","s",1977,2026,15000,"lada_16:83",{floor:.5}),
M("Vesta","vesta","b",2015,2022,14000,"lada_16:106"),
M("Kalina/Granta","kalina,granta","c",2005,2018,9500,"lada_16:87")
]);

/* ================= JAPON / CORÉE ================= */
Br("Toyota","toyota",1,[
M("Aygo / Aygo X","aygo","c",2005,2026,13500,"toy_atmo:72|psa_tu:68"),
M("iQ","iq","c",2009,2014,13500,"toy_atmo:68"),
M("Yaris I/II","yaris","c",1999,2011,14500,"toy_atmo:69|toy_d4d:90"),
M("Yaris III","yaris","c",2011,2020,20000,"toy_hsd:100:a:ecvt|toy_atmo:69|toy_d4d:90"),
M("Yaris IV","yaris","c",2020,2026,23000,"toy_hsd:116:a:ecvt|toy_atmo:72"),
M("GR Yaris","gr yaris","p",2020,2026,40000,"toy_gr:261",{floor:.7}),
M("Yaris Cross","yaris cross","s",2021,2026,27000,"toy_hsd:116:a:ecvt"),
M("Corolla IX/Auris","auris,corolla","k",2002,2019,22000,"toy_hsd:136:a:ecvt|toy_d4d:126|toy_atmo:97"),
M("Corolla XII","corolla","k",2019,2026,30000,"toy_hsd:122:a:ecvt|toy_hsd:196:a:ecvt"),
M("C-HR","c-hr,chr","s",2016,2026,31000,"toy_hsd:122:a:ecvt|toy_hsd:198:a:ecvt"),
M("RAV4 II/III/IV","rav4,rav 4","s",2000,2019,32000,"toy_d4d:124|toy_atmo:152|toy_hsd:197:a:ecvt"),
M("RAV4 V","rav4,rav 4","s",2019,2026,40000,"toy_hsd:218:a:ecvt|toy_hsd:306:a:ecvt"),
M("Prius I-IV","prius","k",1997,2022,30000,"toy_hsd:122:a:ecvt"),
M("Prius+ / Verso","prius+,verso","s",2009,2018,28000,"toy_hsd:136:a:ecvt|toy_d4d:126"),
M("Camry","camry","b",2019,2024,38000,"toy_hsd:218:a:ecvt"),
M("Avensis","avensis","b",1997,2018,26000,"toy_d4d:124|toy_atmo:147"),
M("Land Cruiser","land cruiser,landcruiser","s",1990,2026,55000,"toy_d4d:204:a:bva_old",{floor:.6}),
M("Hilux","hilux","s",1998,2026,38000,"toy_d4d:204:a:bva_old",{floor:.5}),
M("Proace","proace","s",2016,2026,34000,"psa_bluehdi20:180:a:dsg_wet|psa_bluehdi15:120"),
M("Supra (A80 classique)","supra","p",1993,2002,60000,"bmw_6cyl:330",{floor:1.3}),
M("GR Supra (A90)","supra,gr supra","p",2019,2026,55000,"bmw_6cyl:340:a:zf8",{floor:.6}),
M("GT86/GR86","gt86,gr86,86","p",2012,2026,32000,"toy_boxer:200|toy_boxer:234",{floor:.65}),
M("MR2 (classique)","mr2,mr-2","p",1990,2007,20000,"toy_atmo:140",{floor:.8}),
M("Celica","celica","p",1994,2006,22000,"toy_atmo:143",{floor:.6}),
M("bZ4X","bz4x","e",2022,2026,45000,"volvo_ev:204:a"),
M("Mirai","mirai","b",2015,2026,65000,"mb_eq:182:a"),
M("Urban Cruiser/Yaris Verso","urban cruiser","c",2000,2014,15500,"toy_d4d:90|toy_atmo:69")
]);
Br("Lexus","lexus",2,[
M("CT 200h","ct200h,ct 200h","k",2011,2020,31000,"toy_hsd:136:a:ecvt"),
M("IS","is 200,is 250,is 300h","b",1999,2024,40000,"toy_hsd:223:a:ecvt|nis_vq:208:a:bva_old"),
M("ES 300h","es 300h,es300h","b",2018,2026,50000,"toy_hsd:218:a:ecvt"),
M("GS","gs 300,gs 450h","b",2005,2018,52000,"toy_hsd:345:a:ecvt"),
M("NX","nx","s",2014,2026,50000,"toy_hsd:197:a:ecvt|toy_hsd:308:a:ecvt"),
M("UX","ux","s",2019,2026,38000,"toy_hsd:184:a:ecvt"),
M("RX","rx","s",2003,2026,65000,"toy_hsd:313:a:ecvt"),
M("LS","ls 430,ls 460,ls 500h","b",2000,2026,90000,"toy_hsd:359:a:ecvt|mb_m113:394:a:bva_old",{hold:.7}),
M("LC 500","lc500,lc 500","x",2017,2026,105000,"gm_ls:477:a:zf8",{floor:.6}),
M("LFA","lfa","x",2010,2012,375000,"fer_v12:560:a:f1_robot",{floor:2}),
M("RC","rc 300h,rc f","p",2015,2024,55000,"toy_hsd:223:a:ecvt|gm_ls:477:a:zf8:1.4")
]);
Br("Honda","honda",1,[
M("Jazz I-III","jazz","c",2002,2020,16500,"honda_atmo:90:ma:cvt_jatco"),
M("Jazz IV (e:HEV)","jazz","c",2020,2026,25000,"honda_hev:109:a:ecvt"),
M("Civic VIII/IX","civic","k",2006,2017,22000,"honda_atmo:100|honda_dtec:120|honda_atmo:201:m::1.3:p"),
M("Civic X","civic","k",2017,2022,27000,"honda_turbo:126|honda_turbo:182|honda_dtec:120"),
M("Civic XI (e:HEV)","civic","k",2022,2026,35000,"honda_hev:184:a:ecvt"),
M("Civic Type R (FK2/FK8/FL5)","type r,type-r","p",2015,2026,48000,"honda_typer:320",{floor:.65}),
M("Accord","accord","b",1998,2015,28000,"honda_atmo:156|honda_dtec:140"),
M("CR-V","cr-v,crv","s",1997,2026,35000,"honda_atmo:155:ma:cvt_jatco|honda_dtec:160|honda_hev:184:a:ecvt"),
M("HR-V","hr-v,hrv","s",1999,2026,28000,"honda_atmo:130:ma:cvt_jatco|honda_hev:131:a:ecvt"),
M("e (électrique)","honda e","e",2020,2024,35000,"mg_ev:154:a"),
M("NSX (classique)","nsx","x",1990,2005,90000,"nis_vq:274",{floor:1.5}),
M("S2000","s2000","p",1999,2009,35000,"honda_atmo:240",{floor:1}),
M("Integra Type R (classique)","integra","p",1995,2001,25000,"honda_atmo:190",{floor:1.2}),
M("Insight","insight","k",2009,2014,20000,"honda_hev:98:a:ecvt")
]);
Br("Mazda","mazda",1,[
M("Mazda2","mazda2,mazda 2","c",2003,2026,18000,"mazda_mzr:75|mazda_sky:90|toy_hsd:116:a:ecvt"),
M("Mazda3 (BK/BL)","mazda3,mazda 3","k",2003,2013,20000,"mazda_mzr:105|psa_hdi16:109"),
M("Mazda3 (BM/BP)","mazda3,mazda 3","k",2013,2026,26000,"mazda_sky:122:ma:zf8|mazda_skyd:150"),
M("Mazda6","mazda6,mazda 6","b",2002,2024,32000,"mazda_sky:165:ma:zf8|mazda_skyd:175|mazda_mzr:147"),
M("CX-3","cx-3,cx3","s",2015,2021,22000,"mazda_sky:121:ma:zf8"),
M("CX-30","cx-30,cx30","s",2019,2026,29000,"mazda_sky:122:ma:zf8"),
M("CX-5","cx-5,cx5","s",2012,2026,33000,"mazda_sky:165:ma:zf8|mazda_skyd:175:ma:zf8"),
M("CX-60","cx-60,cx60","s",2022,2026,48000,"mazda_skyd:254:a:zf8|volvo_t8:327:a:zf8"),
M("MX-5 (NA/NB)","mx-5,mx5,miata","p",1990,2005,18000,"mazda_mzr:110",{floor:1}),
M("MX-5 (NC)","mx-5,mx5","p",2005,2015,24000,"mazda_mzr:126",{floor:.75}),
M("MX-5 (ND)","mx-5,mx5","p",2015,2026,32000,"mazda_sky:132|mazda_sky:184",{floor:.7}),
M("RX-8","rx-8,rx8","p",2003,2010,30000,"mazda_rotary:231"),
M("MX-30","mx-30,mx30","e",2020,2026,35000,"mazda_sky:145:a")
]);
Br("Suzuki","suzuki",1,[
M("Swift","swift","c",2005,2026,17500,"suzuki_atmo:83|suzuki_jet:129:m::1.2:p"),
M("Ignis","ignis","c",2016,2026,16500,"suzuki_atmo:83"),
M("Baleno","baleno","c",2016,2020,16000,"suzuki_jet:111"),
M("Vitara","vitara","s",1988,2026,24000,"suzuki_jet:129|suzuki_atmo:120|fiat_mjet:120"),
M("S-Cross","s-cross,sx4","s",2013,2026,26000,"suzuki_jet:129|fiat_mjet:120"),
M("Jimny","jimny","s",1998,2021,20000,"suzuki_atmo:102",{floor:.85}),
M("Celerio","celerio","c",2014,2021,10500,"suzuki_atmo:68"),
M("Alto","alto","c",2009,2016,9500,"suzuki_atmo:68")
]);
Br("Subaru","subaru",1,[
M("Impreza","impreza","k",1992,2026,26000,"subaru_ej:150|subaru_fb:156:ma:cvt_jatco"),
M("Impreza WRX/STI","wrx,sti","p",2000,2021,42000,"subaru_ej:300:m::1.15",{floor:.7}),
M("Forester","forester","s",1997,2026,35000,"subaru_ej:150|subaru_fb:150:a:cvt_jatco|subaru_d:147"),
M("Outback/Legacy","outback,legacy","s",1998,2026,40000,"subaru_fb:169:a:cvt_jatco|subaru_d:150|subaru_ej:165"),
M("XV/Crosstrek","xv,crosstrek","s",2012,2026,30000,"subaru_fb:136:a:cvt_jatco|subaru_d:147"),
M("BRZ","brz","p",2012,2026,33000,"toy_boxer:200|toy_boxer:234",{floor:.65}),
M("Levorg","levorg","b",2015,2021,32000,"subaru_fb:170:a:cvt_jatco"),
M("Solterra","solterra","e",2022,2026,48000,"volvo_ev:218:a")
]);
Br("Mitsubishi","mitsubishi",1,[
M("Space Star","space star,spacestar","c",2013,2026,12500,"hk_atmo:71"),
M("Colt","colt","c",2004,2026,16500,"ren_tce90:91|hk_atmo:75"),
M("Lancer","lancer","k",2003,2017,19500,"mitsu_did:140|hk_atmo:117"),
M("Lancer Evolution","lancer evo,evo","p",2001,2016,45000,"mitsu_4g63:295",{floor:.85}),
M("ASX","asx","s",2010,2026,24000,"mitsu_did:150|ren_tce13:140:ma:edc|hk_atmo:117"),
M("Outlander","outlander","s",2003,2026,35000,"mitsu_phev:224:a:ecvt|mitsu_did:150|psa_22hdi:156"),
M("Eclipse Cross","eclipse cross,eclipse","s",2018,2026,32000,"mitsu_phev:188:a:ecvt|nis_dig16:163:a:cvt_jatco"),
M("Pajero","pajero","s",1991,2019,45000,"mitsu_did:190:a:bva_old",{floor:.55}),
M("L200","l200","s",1996,2026,35000,"mitsu_did:150"),
M("3000 GT (classique)","3000gt,3000 gt","p",1990,2000,30000,"nis_vq:286",{floor:.9})
]);
Br("Nissan","nissan",1,[
M("Micra K11/K12","micra","c",1992,2010,12000,"nis_hr16:80|ren_dci15:86"),
M("Micra K14","micra","c",2017,2023,17000,"ren_tce90:92|ren_dci15:90"),
M("Note","note","c",2006,2017,16500,"nis_hr16:110|ren_dci15:90"),
M("Juke I","juke","s",2010,2019,20000,"nis_dig16:190:ma:cvt_jatco|ren_dci15:110|nis_hr16:117"),
M("Juke II","juke","s",2019,2026,25000,"ren_tce90:114:ma:edc|ren_etech:143:a:ecvt"),
M("Qashqai I","qashqai","s",2007,2013,24000,"ren_dci15:106|nis_hr16:117|ren_m9r:150"),
M("Qashqai II","qashqai","s",2014,2021,28000,"ren_dci15:110|nis_dig16:163:a:cvt_jatco|ren_r9m:130"),
M("Qashqai III","qashqai","s",2021,2026,33000,"ren_tce13:158:a:cvt_jatco|ren_etech:190:a:ecvt"),
M("X-Trail","x-trail,xtrail","s",2001,2026,36000,"ren_m9r:177|ren_etech:213:a:ecvt|ren_dci15:110"),
M("Ariya","ariya","e",2022,2026,48000,"nis_leaf:242:a"),
M("Leaf","leaf","e",2011,2026,32000,"nis_leaf:150:a"),
M("Primera","primera","b",1996,2007,19500,"nis_hr16:116|ren_f9q:120"),
M("Pulsar","pulsar","k",2014,2018,21000,"nis_dig16:115|ren_dci15:110"),
M("Navara","navara","s",1998,2023,36000,"ren_m9r:190:a:bva_old|mitsu_did:163"),
M("Patrol","patrol","s",1990,2010,42000,"mitsu_did:160",{floor:.7}),
M("350Z/370Z","350z,370z","p",2003,2020,42000,"nis_vq:328",{floor:.65}),
M("GT-R (R35)","gtr,gt-r","x",2009,2024,105000,"nis_vr38:570:a:dsg_wet",{floor:.75}),
M("200SX/Silvia (classique)","200sx,silvia","p",1994,2002,25000,"mitsu_4g63:200",{floor:1.1})
]);
Br("Infiniti","infiniti",2,[
M("Q30/QX30","q30,qx30","k",2016,2019,32000,"mb_m270:156:a:dct7_mb|ren_dci15:109"),
M("Q50","q50","b",2014,2020,42000,"mb_om651:170:a:bva_old|nis_vq:364:a:bva_old"),
M("FX/QX70","fx,qx70","s",2003,2017,60000,"nis_vq:320:a:bva_old|mb_om642:238:a:bva_old")
]);
Br("Daihatsu","daihatsu",1,[
M("Sirion","sirion","c",1998,2011,11500,"dai_a:87"),
M("Terios","terios","s",1997,2012,16500,"dai_a:105"),
M("Copen","copen","p",2003,2012,15500,"dai_a:87",{floor:.6})
]);
Br("Isuzu","isuzu",1,[
M("D-Max","d-max,dmax","s",2002,2026,38000,"isuzu_d:164"),
M("Trooper (classique)","trooper","s",1991,2002,25000,"isuzu_d:159",{floor:.5})
]);
Br("Hyundai","hyundai",1,[
M("i10","i10","c",2008,2026,15000,"hk_atmo:67"),
M("i20","i20","c",2009,2026,18500,"hk_tgdi:100:ma:dsg_wet|hk_atmo:84|hk_crdi:75"),
M("i20 N","i20 n","p",2021,2024,33000,"hk_tgdi:204",{floor:.65}),
M("i30","i30","k",2007,2026,25000,"hk_tgdi:120:ma:dsg_wet|hk_crdi:136:ma:dsg_wet|hk_atmo:100"),
M("i30 N","i30 n","p",2017,2026,43000,"hk_tgdi:280:ma:dsg_wet",{floor:.6}),
M("i40","i40","b",2011,2019,28000,"hk_crdi:141"),
M("ix35/Tucson III","ix35,tucson","s",2010,2020,28000,"hk_crdi:136|hk_tgdi:132"),
M("Tucson IV","tucson","s",2021,2026,36000,"hk_hev:230:a:bva_old|hk_tgdi:150:ma:dsg_wet"),
M("Santa Fe","santa fe,santafe","s",2001,2026,45000,"hk_crdi:200:a:bva_old|hk_hev:230:a:bva_old"),
M("Kona","kona","s",2017,2026,28000,"hk_tgdi:120:ma:dsg_wet|hk_ev:204:a|hk_hev:141:a:dsg_wet"),
M("Bayon","bayon","s",2021,2026,23000,"hk_tgdi:100:ma:dsg_wet"),
M("Ioniq (hybride/élec)","ioniq","k",2016,2022,30000,"hk_hev:141:a:dsg_wet|hk_ev:136:a"),
M("Ioniq 5","ioniq 5,ioniq5","e",2021,2026,47000,"hk_egmp:229:a"),
M("Ioniq 6","ioniq 6,ioniq6","e",2022,2026,52000,"hk_egmp:229:a"),
M("Nexo","nexo","e",2018,2024,72000,"mb_eq:163:a"),
M("Getz/Accent","getz,accent","c",2002,2011,11500,"hk_atmo:66|hk_crdi:88"),
M("Veloster","veloster","p",2011,2017,25000,"hk_tgdi:186:ma:dsg_wet"),
M("Coupé (classique)","hyundai coupe,tiburon","p",1996,2009,22000,"hk_atmo:143")
]);
Br("Kia","kia",1,[
M("Picanto","picanto","c",2004,2026,14500,"hk_atmo:67"),
M("Rio","rio","c",2000,2023,17000,"hk_tgdi:100:ma:dsg_wet|hk_atmo:84|hk_crdi:77"),
M("Ceed","ceed,cee'd","k",2007,2026,25000,"hk_tgdi:120:ma:dsg_wet|hk_crdi:136:ma:dsg_wet|hk_atmo:100"),
M("ProCeed/Ceed GT","proceed,ceed gt","k",2013,2026,32000,"hk_tgdi:204:a:dsg_wet"),
M("Stonic","stonic","s",2017,2026,22000,"hk_tgdi:100:ma:dsg_wet"),
M("Niro","niro,e-niro","s",2016,2026,35000,"hk_hev:141:a:dsg_wet|hk_ev:204:a"),
M("Sportage IV","sportage","s",2016,2021,30000,"hk_crdi:136:ma:dsg_wet|hk_tgdi:177"),
M("Sportage V","sportage","s",2022,2026,37000,"hk_hev:230:a:bva_old|hk_tgdi:150:ma:dsg_wet"),
M("Sorento","sorento","s",2002,2026,48000,"hk_crdi:200:a:bva_old|hk_hev:230:a:bva_old"),
M("EV6","ev6,ev 6","e",2021,2026,50000,"hk_egmp:229:a"),
M("EV9","ev9,ev 9","e",2023,2026,72000,"hk_egmp:384:a"),
M("Stinger","stinger","b",2017,2023,50000,"gen_33t:366:a:bva_old",{floor:.5}),
M("Soul","soul","c",2009,2026,25000,"hk_ev:204:a|hk_crdi:136"),
M("Venga","venga","c",2010,2019,16500,"hk_atmo:90|hk_crdi:90"),
M("Carens","carens","s",2002,2019,22000,"hk_crdi:136")
]);
Br("Genesis","genesis",2,[
M("G70","g70","b",2021,2026,45000,"hk_tgdi:245:a:bva_old|gen_33t:370:a:bva_old"),
M("GV70/GV80","gv70,gv80","s",2021,2026,60000,"gen_33t:304:a:bva_old|hk_crdi:210:a:bva_old"),
M("GV60","gv60","e",2022,2026,60000,"hk_egmp:234:a")
]);
Br("SsangYong","ssangyong,ssang yong",1,[
M("Tivoli","tivoli","s",2015,2026,20000,"ssang_xdi:136:ma:bva_old|hk_atmo:128"),
M("Korando","korando","s",1997,2026,26000,"ssang_xdi:163:ma:bva_old"),
M("Rexton","rexton","s",2002,2026,40000,"ssang_xdi:202:a:bva_old|mb_om642:186:a:bva_old"),
M("Musso","musso","s",1995,2026,32000,"ssang_xdi:181:a:bva_old")
]);
Br("Daewoo","daewoo,chevrolet europe",1,[
M("Matiz/Spark","matiz,spark","c",1998,2015,8500,"daewoo_a:68"),
M("Lanos/Kalos/Aveo","lanos,kalos,aveo","c",1997,2015,10500,"daewoo_a:86|gm_ecotec:95"),
M("Lacetti/Cruze","lacetti,cruze","k",2003,2016,15500,"gm_ecotec:124|opel_cdti:130"),
M("Captiva","captiva","s",2006,2015,26000,"opel_cdti:163:a:bva_old|gm_ecotec:136")
]);

/* ================= AMÉRIQUE ================= */
Br("Tesla","tesla",2,[
M("Model 3","model 3,model3","e",2019,2026,47000,"tesla_3y:325:a"),
M("Model Y","model y,modely","e",2021,2026,50000,"tesla_3y:351:a"),
M("Model S","model s,models","e",2013,2026,95000,"tesla_s:428:a"),
M("Model X","model x,modelx","e",2016,2026,105000,"tesla_s:428:a"),
M("Roadster (classique)","tesla roadster","e",2008,2012,100000,"tesla_s:288:a",{floor:.8})
]);
Br("Jeep","jeep",1,[
M("Renegade","renegade","s",2014,2026,27000,"fiat_multiair:120|fiat_mjet:120|fiat_fire:101:ma:dsg_wet"),
M("Compass","compass","s",2007,2026,33000,"fiat_multiair:130:ma:dsg_wet|fiat_mjet:120|psa_hy48:240:a"),
M("Cherokee","cherokee","s",1990,2023,38000,"dodge_v6:272:a:bva_old|fiat_mjet:140:a:bva_old|mb_om642:177:a:bva_old"),
M("Grand Cherokee","grand cherokee","s",1993,2026,55000,"dodge_hemi:352:a:zf8|mb_om642:250:a:bva_old|dodge_v6:286:a:zf8"),
M("Wrangler","wrangler","s",1997,2026,55000,"dodge_v6:284:a:zf8|fiat_mjet:200:a:zf8",{floor:.6}),
M("Avenger","avenger","e",2023,2026,37000,"ev_psa:156:a"),
M("Gladiator","gladiator","s",2020,2026,70000,"dodge_v6:264:a:zf8",{floor:.55})
]);
Br("Chevrolet","chevrolet,chevy",1,[
M("Camaro","camaro","p",2010,2024,50000,"gm_ls:453:a:zf8|gm_ecotec:275",{floor:.55}),
M("Corvette C5/C6/C7","corvette,c5,c6,c7","x",1997,2019,70000,"gm_ls:466:ma:bva_old",{floor:.65}),
M("Corvette C8","corvette,c8","x",2020,2026,110000,"gm_ls:482:a:dsg_wet",{floor:.75}),
M("Bolt","bolt","e",2017,2023,38000,"chevy_ev:204:a"),
M("Orlando","orlando","s",2011,2015,22000,"opel_cdti:163"),
M("Trax","trax","s",2013,2016,20000,"opel_sge:140|opel_cdti:130"),
M("Silverado/Tahoe","silverado,tahoe","s",2000,2026,70000,"gm_ls:420:a:bva_old",{floor:.5})
]);
Br("Cadillac","cadillac",2,[
M("Escalade","escalade","s",2002,2026,110000,"gm_ls:426:a:bva_old",{hold:.7}),
M("CTS/CT5","cts,ct5","b",2003,2026,55000,"gm_ecotec:276:a:bva_old|gm_ls:649:a:zf8:1.5"),
M("XT4/XT5","xt4,xt5","s",2018,2026,50000,"gm_ecotec:230:a:bva_old"),
M("Lyriq","lyriq","e",2023,2026,80000,"hummer_ev:528:a")
]);
Br("Dodge","dodge",2,[
M("Challenger","challenger","p",2008,2024,60000,"dodge_hemi:492:a:zf8|dodge_v6:309:a:zf8",{floor:.6}),
M("Charger","charger","b",2006,2024,60000,"dodge_hemi:492:a:zf8|dodge_v6:309:a:zf8",{floor:.55}),
M("RAM 1500","ram,ram 1500","s",2010,2026,75000,"dodge_hemi:401:a:zf8",{floor:.55}),
M("Viper","viper","x",1992,2017,120000,"dodge_hemi:645",{floor:.9}),
M("Nitro","nitro","s",2007,2012,28000,"mb_om642:177:a:bva_old|dodge_v6:260:a:bva_old")
]);
Br("Chrysler","chrysler",1,[
M("300C","300c,300 c","b",2004,2014,42000,"mb_om642:218:a:bva_old|dodge_hemi:340:a:bva_old"),
M("PT Cruiser","pt cruiser","c",2000,2010,18000,"gm_ecotec:143|mb_om611:121"),
M("Grand Voyager","grand voyager,voyager","s",1996,2015,35000,"dodge_v6:283:a:bva_old|mb_om642:163:a:bva_old")
]);
Br("GMC","gmc",2,[
M("Yukon","yukon","s",2000,2026,85000,"gm_ls:426:a:bva_old",{hold:.7}),
M("Sierra","sierra","s",2000,2026,75000,"gm_ls:426:a:bva_old",{hold:.7})
]);
Br("Hummer","hummer",2,[
M("H2","h2","s",2002,2009,60000,"gm_ls:325:a:bva_old",{floor:.55}),
M("H3","h3","s",2005,2010,45000,"gm_ecotec:244:a:bva_old",{floor:.5}),
M("Hummer EV","hummer ev","e",2022,2026,120000,"hummer_ev:1000:a",{floor:.6})
]);
Br("Lincoln","lincoln",2,[
M("Navigator","navigator","s",2003,2026,100000,"ford_st:457:a:zf8",{hold:.6}),
M("Town Car (classique)","town car","b",1990,2011,35000,"ford_v8:239:a:bva_old",{floor:.5})
]);
Br("DeLorean","delorean,dmc",3,[
M("DMC-12","dmc-12,dmc12","x",1981,1983,65000,"dmc_prv:132",{floor:1.4})
]);
Br("Fisker","fisker",2,[
M("Ocean","ocean","e",2023,2024,45000,"fisker_ev:275:a"),
M("Karma (classique)","karma","b",2011,2012,50000,"fisker_ev:408:a",{floor:.4})
]);
Br("Lucid","lucid",2,[
M("Air","lucid air","e",2022,2026,110000,"lucid_ev:620:a")
]);

/* ================= CHINE & NOUVEAUX ENTRANTS ================= */
Br("BYD","byd",1,[
M("Atto 3","atto 3,atto3","e",2022,2026,40000,"byd_ev:204:a"),
M("Dolphin","dolphin","e",2023,2026,30000,"byd_ev:204:a"),
M("Seal","seal","e",2023,2026,46000,"byd_ev:313:a"),
M("Seal U","seal u","s",2024,2026,40000,"byd_dmi:218:a:ecvt|byd_ev:218:a"),
M("Han","han","e",2022,2026,70000,"byd_ev:517:a"),
M("Tang","tang","e",2022,2026,72000,"byd_ev:517:a")
]);
Br("Leapmotor","leapmotor",1,[
M("T03","t03","e",2023,2026,20000,"leap_ev:95:a"),
M("C10","c10","e",2024,2026,37000,"leap_ev:218:a"),
M("B10","b10","e",2025,2026,32000,"leap_ev:218:a")
]);
Br("Xpeng","xpeng",2,[
M("G6","xpeng g6,g6","e",2024,2026,45000,"xpeng_ev:296:a"),
M("G9","xpeng g9,g9","e",2023,2026,60000,"xpeng_ev:313:a"),
M("P7","xpeng p7,p7","e",2023,2026,50000,"xpeng_ev:276:a")
]);
Br("Nio","nio",2,[
M("ET5","et5","e",2023,2026,50000,"nio_ev:490:a"),
M("EL6/EL7","el6,el7","e",2022,2026,65000,"nio_ev:490:a"),
M("ET7","et7","e",2022,2026,70000,"nio_ev:653:a")
]);
Br("Zeekr","zeekr",2,[
M("001","zeekr 001","e",2023,2026,60000,"zeekr_ev:544:a"),
M("X","zeekr x","e",2023,2026,45000,"zeekr_ev:428:a"),
M("7X","zeekr 7x","e",2025,2026,53000,"zeekr_ev:475:a")
]);
Br("Lynk & Co","lynk,lynk & co,lynk&co",1,[
M("01","lynk 01","s",2021,2026,42000,"lynk_phev:261:a:dsg_wet"),
M("02","lynk 02","e",2024,2026,36000,"zeekr_ev:272:a")
]);
Br("Omoda","omoda,chery",1,[
M("Omoda 5","omoda 5,omoda5","s",2024,2026,30000,"chery_t:186:a:dsg_wet|byd_ev:204:a"),
M("Omoda 9","omoda 9","s",2025,2026,45000,"chery_t:395:a:dsg_wet")
]);
Br("Jaecoo","jaecoo",1,[
M("Jaecoo 7","jaecoo 7,j7","s",2024,2026,35000,"chery_t:147:a:dsg_wet|lynk_phev:347:a"),
M("Jaecoo 5","jaecoo 5,j5","s",2025,2026,30000,"chery_t:147:a:dsg_wet")
]);
Br("Aiways","aiways",1,[
M("U5","aiways u5,u5","e",2020,2023,39000,"aiways_ev:204:a"),
M("U6","aiways u6,u6","e",2022,2023,45000,"aiways_ev:218:a")
]);
Br("VinFast","vinfast",1,[
M("VF8","vf8,vf 8","e",2023,2026,45000,"vinfast_ev:353:a"),
M("VF6","vf6,vf 6","e",2024,2026,35000,"vinfast_ev:204:a"),
M("VF9","vf9,vf 9","e",2023,2026,60000,"vinfast_ev:408:a")
]);
Br("Ora","ora,gwm ora,gwm",1,[
M("Funky Cat / 03","funky cat,ora 03","e",2022,2026,35000,"ora_ev:171:a"),
M("07","ora 07","e",2023,2026,40000,"ora_ev:204:a")
]);
Br("Seres","seres",1,[
M("Seres 3","seres 3","e",2021,2026,33000,"seres_ev:163:a"),
M("Seres 5","seres 5","e",2023,2026,50000,"seres_ev:585:a")
]);
Br("DFSK","dfsk",1,[
M("Fengon 500","fengon 500,fengon","s",2021,2026,25000,"dfsk_t:136"),
M("Seres/Fengon E5","fengon e5","s",2022,2026,35000,"seres_ev:163:a")
]);
Br("Skywell","skywell",1,[
M("ET5","skywell et5","e",2022,2026,42000,"sky_ev:204:a"),
M("BE11","be11","e",2023,2026,45000,"sky_ev:204:a")
]);
Br("Hongqi","hongqi",2,[
M("E-HS9","e-hs9,ehs9","e",2021,2026,80000,"hongqi_ev:551:a"),
M("EH7","eh7","e",2024,2026,55000,"hongqi_ev:462:a")
]);
Br("Forthing","forthing",1,[
M("Friday","friday","s",2023,2026,30000,"forthing_t:177:a:dsg_wet"),
M("U-Tour","u-tour,utour","s",2023,2026,28000,"forthing_t:177:a:dsg_wet")
]);
Br("Micro","micro,microlino",1,[
M("Microlino","microlino","e",2022,2026,18000,"micro_ev:17:a"),
M("Spiaggina","spiaggina","e",2024,2026,20000,"micro_ev:17:a")
]);
Br("XEV","xev",1,[
M("Yoyo","yoyo","e",2021,2026,16000,"xev_ev:15:a")
]);

/* ================= VSP (sans permis) ================= */
Br("Aixam","aixam",1,[
M("City","aixam city","c",2008,2026,13500,"vsp_d:8:a:cvt_jatco"),
M("Crossline/Crossover","crossline,crossover","c",2010,2026,15500,"vsp_d:8:a:cvt_jatco"),
M("e-Aixam","e-aixam,e aixam","e",2019,2026,16500,"xev_ev:8:a")
]);
Br("Ligier","ligier",1,[
M("JS50","js50,js 50","c",2014,2026,14500,"vsp_d:8:a:cvt_jatco"),
M("JS60","js60,js 60","c",2021,2026,16500,"vsp_d:8:a:cvt_jatco"),
M("Myli","myli","e",2023,2026,15500,"xev_ev:12:a")
]);
Br("Microcar","microcar",1,[
M("M.Go","m.go,mgo","c",2009,2026,13500,"vsp_d:8:a:cvt_jatco"),
M("Dué","due,dué","c",2012,2026,11500,"vsp_d:8:a:cvt_jatco")
]);
Br("Chatenet","chatenet",1,[
M("CH26","ch26","c",2012,2022,15000,"vsp_d:8:a:cvt_jatco"),
M("CH46","ch46","c",2018,2026,17000,"vsp_d:8:a:cvt_jatco")
]);

/* Facteur d'entretien par gamme (tier 1 = généraliste, 2 = premium, 3 = exotique) */
const TIER_MAINT = {1:1.0,2:1.45,3:3.2};
const TIER_INSUR = {1:1.0,2:1.2,3:2.6};

/* ============================================================
   COMPLÉMENT v3 — familles manquantes, classiques, utilitaires
   ============================================================ */
Object.assign(ENGINES, {
  psa_hybrid4:{label:"HYbrid4 diesel",fuel:"Hybride",conso:4.4,rel:54,issues:[
    {t:"Chaîne hybride vieillissante : électronique et batterie arrière à contrôler",sev:"warn",cost:1500,km:130000},
    {t:"Boîte pilotée BMP6 : à-coups connus",sev:"warn",km:90000}]},
  vag_25tdi:{label:"2.5 TDI V6 (av. 2006)",fuel:"Diesel",conso:7.0,rel:42,issues:[
    {t:"Arbres à cames usés prématurément : défaut notoire — 3 500 €",sev:"bad",cost:3500,km:120000,chk:"Bruits de distribution, historique des remplacements",ask:"Les arbres à cames ont-ils été remplacés ?"}]},
  classic_fr:{label:"Mécanique classique française",fuel:"Essence",conso:7.5,rel:68,issues:[
    {t:"Corrosion châssis/planchers : LE point qui fait le prix",sev:"warn",chk:"Inspection dessous de caisse par un connaisseur",ask:"Restauration ? Photos des travaux ?"},
    {t:"Pièces via clubs et refabrications : délais possibles",sev:"warn"}]},
  classic_uk:{label:"Mécanique classique anglaise",fuel:"Essence",conso:9.5,rel:60,issues:[
    {t:"Électricité Lucas et joints : entretien permanent",sev:"warn",cost:500},
    {t:"Corrosion structurelle à inspecter minutieusement",sev:"warn",chk:"Longerons, arches, planchers"}]},
  por_aircooled:{label:"Flat-6 refroidi par air (964/993)",fuel:"Essence",conso:11.5,rel:78,issues:[
    {t:"Fuites d'huile moteur : quasi inévitables, chiffrez la remise en état",sev:"warn",cost:2500,km:100000},
    {t:"Cote collection : historique matching numbers déterminant",sev:"warn",ask:"Matching numbers ? Historique complet ?"}]},
  iveco_d:{label:"2.3–3.0 diesel (Daily)",fuel:"Diesel",conso:8.5,rel:74,issues:[
    {t:"Injecteurs et FAP en usage urbain intensif",sev:"warn",cost:900,km:150000}]}
});

Br("Ford","ford",1,[
M("Fiesta IV/V (1995–2008)","fiesta","c",1995,2008,12500,"ford_duratec:80|ford_tdci18:68"),
M("Fiesta VI (2008–2017)","fiesta","c",2008,2017,15500,"ford_duratec:82|ford_eco10:100|ford_tdci:95|ford_st:182:m::1.35:p"),
M("Fiesta VII","fiesta","c",2017,2023,19000,"ford_eco10:100:ma:dsg_wet|ford_duratec:75|ford_st:200:m::1.35:p"),
M("Focus I/II","focus","k",1998,2011,18500,"ford_duratec:100|ford_tdci18:115|psa_hdi16:109"),
M("Focus III","focus","k",2011,2018,23000,"ford_eco10:125|ford_tdci:115|ford_eco15:150"),
M("Focus IV","focus","k",2018,2025,27000,"ford_eco10:125:ma:dsg_wet|ford_eco15:150|ford_tdci:120"),
M("Puma","puma","s",2020,2026,27000,"ford_eco10:125:ma:dsg_wet"),
M("Kuga I/II","kuga","s",2008,2019,29000,"ford_tdci:150:ma:dsg_wet|ford_eco15:150"),
M("Kuga III","kuga","s",2020,2026,35000,"ford_eco15:150:ma|ford_tdci:120:ma|toy_hsd:225:a:ecvt"),
M("Fusion","fusion","c",2002,2012,14000,"ford_duratec:80|ford_tdci18:68")
]);

Br("Porsche","porsche",2,[
M("911 (991)","911,991","p",2012,2019,115000,"por_flat6:400:ma:pdk",{floor:.6}),
M("911 (992)","911,992","p",2019,2026,135000,"por_flat6:450:ma:pdk",{floor:.68}),
M("718 Cayman/Boxster","718,cayman,boxster","p",2016,2026,65000,"por_flat4:300:ma:pdk|por_flat6:400:ma:pdk",{floor:.6}),
M("Macan","macan","s",2014,2026,70000,"vag_ea888:245:a:pdk|por_v6:354:a:pdk"),
M("Cayenne (955/957)","cayenne","s",2002,2010,70000,"por_v8c:340:a:bva_old|vag_30tdi:240:a:bva_old"),
M("Cayenne (E2/E3)","cayenne","s",2010,2026,90000,"por_v6:340:a:zf8|vag_30tdi:262:a:zf8"),
M("Panamera","panamera","b",2009,2026,105000,"por_v6:330:a:pdk|vag_30tdi:300:a:zf8",{hold:.8}),
M("Taycan","taycan","e",2020,2026,110000,"por_ev:476:a")
]);

/* --- Compléments par marque existante --- */
(function(){
  const find = (n) => BRANDS.find(b => b.name === n);
  find("Peugeot").models.push(
    M("104","104","c",1972,1988,7000,"psa_tu:50",{floor:.6}),
    M("404 (classique)","404","b",1960,1975,12000,"classic_fr:76",{floor:1}),
    M("504 (classique)","504","b",1968,1983,15000,"classic_fr:96",{floor:1}),
    M("604","604","b",1975,1985,15000,"dmc_prv:136",{floor:.7}),
    M("408 (2023+)","408","k",2023,2026,38000,"psa_hy48:225:a|eb2_puretech:130:a:dsg_wet"),
    M("Boxer","boxer","s",1994,2026,36000,"psa_bluehdi20:140|psa_22hdi:120"),
    M("205 GTI (collection)","205 gti","p",1984,1994,18000,"psa_tu:130",{floor:1.6}),
    M("e-5008","e-5008","e",2024,2026,45000,"ev_psa:230:a")
  );
  find("Citroën").models.push(
    M("2CV (classique)","2cv,deuche","c",1949,1990,9000,"classic_fr:29",{floor:1.8}),
    M("DS (classique)","ds 21,ds 19,ds21,ds19","b",1955,1975,25000,"classic_fr:109",{floor:1.6}),
    M("SM (classique)","citroen sm","x",1970,1975,45000,"classic_fr:170",{floor:1.3}),
    M("CX (classique)","cx","b",1974,1991,12000,"classic_fr:115",{floor:.9}),
    M("Méhari (classique)","mehari,méhari","c",1968,1988,12000,"classic_fr:29",{floor:1.5}),
    M("Visa","visa","c",1978,1988,6500,"psa_tu:64",{floor:.7}),
    M("Evasion","evasion","s",1994,2002,22000,"psa_ew:123|psa_hdi20_old:109"),
    M("C-Crosser","c-crosser,ccrosser","s",2007,2012,29000,"psa_22hdi:156|mitsu_did:156"),
    M("C4 Aircross","c4 aircross","s",2012,2017,25000,"psa_hdi16:114|mitsu_did:150"),
    M("C-Elysée","c-elysee,elysee","b",2012,2020,15500,"psa_vti:115|psa_bluehdi15:100"),
    M("Jumper","jumper","s",1994,2026,35000,"psa_bluehdi20:140|psa_22hdi:120"),
    M("ë-C3 (2024+)","e-c3,ec3","e",2024,2026,23000,"ev_psa:113:a")
  );
  find("Renault").models.push(
    M("4L (classique)","4l,r4,renault 4","c",1961,1992,8000,"classic_fr:34",{floor:1.5}),
    M("R5 (classique)","r5,renault 5","c",1972,1996,9000,"classic_fr:45",{floor:1.2}),
    M("Super 5","super 5,super5","c",1984,1996,8500,"classic_fr:60",{floor:.8}),
    M("R21","r21,21 nevada","b",1986,1994,14000,"classic_fr:110",{floor:.6}),
    M("R25","r25","b",1984,1992,20000,"dmc_prv:153",{floor:.6}),
    M("Espace I/II (classique)","espace","s",1984,1996,22000,"classic_fr:120",{floor:.7}),
    M("Laguna I","laguna","b",1994,2001,20000,"ren_k4m:110|ren_f9q:98"),
    M("Express (2021+)","express","s",2021,2026,20000,"ren_dci15:95|ren_tce90:100"),
    M("Symbioz","symbioz","s",2024,2026,32000,"ren_etech:145:a:ecvt"),
    M("Scénic E-Tech (2024+)","scenic e-tech","e",2024,2026,42000,"ren_ev5:220:a"),
    M("Clio Williams (collection)","clio williams","p",1993,1996,20000,"ren_f4r:150",{floor:2}),
    M("Alaskan","alaskan","s",2017,2020,35000,"ren_m9r:190:a:bva_old")
  );
  find("Dacia").models.push(M("Bigster","bigster","s",2025,2026,25000,"ren_etech:155:a:ecvt|ren_tce13:140"));
  find("Volkswagen").models.push(
    M("Golf 1 (classique)","golf 1,golf gti 1","k",1974,1983,12000,"vag_mpi:110",{floor:1.4}),
    M("Golf 2 (classique)","golf 2","k",1983,1992,10000,"vag_mpi:107",{floor:.9}),
    M("Polo II (classique)","polo 2","c",1981,1994,7500,"vag_mpi:75",{floor:.7}),
    M("Corrado","corrado","p",1988,1995,20000,"vag_18t:190",{floor:.9}),
    M("Combi T2/T3 (classique)","combi,t2,t3","s",1967,1992,25000,"classic_fr:70",{floor:1.6}),
    M("Crafter/LT","crafter,lt35","s",1996,2026,40000,"vag_ea288:140|vag_25tdi:109"),
    M("Karmann-Ghia (classique)","karmann","p",1955,1974,25000,"classic_fr:50",{floor:1.4})
  );
  find("Audi").models.push(
    M("80/90 (classique)","audi 80,audi 90","b",1986,1995,12000,"vag_mpi:90",{floor:.8}),
    M("100/200 (classique)","audi 100,audi 200","b",1982,1994,14000,"vag_18t:165",{floor:.7}),
    M("RS Q3","rs q3,rsq3","s",2013,2026,65000,"vag_5cyl:400:a:dsg_wet",{floor:.5}),
    M("SQ5","sq5","s",2013,2026,70000,"vag_30tdi:347:a:zf8|vag_ea888:354:a:dsg_wet"),
    M("Quattro (collection)","urquattro,audi quattro","p",1980,1991,60000,"vag_5cyl:200",{floor:2}),
    M("RS5","rs5","p",2010,2026,95000,"jlr_v8s:450:a:dsg_wet|vag_ea888:450:a:dsg_wet",{floor:.45})
  );
  find("BMW").models.push(
    M("E30 (classique)","e30,325i","b",1982,1994,20000,"bmw_n52:170",{floor:1.3}),
    M("2002 (collection)","bmw 2002","b",1968,1976,25000,"classic_fr:100",{floor:1.5}),
    M("i5","i5","e",2023,2026,72000,"bmw_iev:340:a"),
    M("i7","i7","e",2022,2026,120000,"bmw_iev:544:a",{hold:.65}),
    M("X5 M / X6 M","x5m,x6m","s",2010,2026,130000,"jlr_v8s:625:a:zf8",{floor:.4}),
    M("M8","m8","p",2019,2026,160000,"jlr_v8s:625:a:zf8",{floor:.45}),
    M("Isetta (collection)","isetta","c",1955,1962,25000,"classic_fr:13",{floor:1.5})
  );
  find("Mercedes-Benz").models.push(
    M("W123 (classique)","w123,240d","b",1976,1986,15000,"mb_om611:72",{floor:1.2}),
    M("W124 (classique)","w124,300e","b",1984,1997,15000,"mb_om611:136",{floor:1}),
    M("SLS AMG","sls","x",2010,2014,220000,"mb_m156:571:a:dsg_wet",{floor:1.1}),
    M("SLR McLaren","slr","x",2003,2009,350000,"mb_m113:626:a:bva_old",{floor:1}),
    M("Classe R","classe r","s",2006,2013,45000,"mb_om642:224:a:bva_old"),
    M("CLC","clc","k",2008,2011,28000,"mb_m271:184:a:bva_old"),
    M("Pagode/SL (collection)","pagode,280sl","p",1963,1971,80000,"classic_fr:170",{floor:1.6})
  );
  find("Porsche").models.push(
    M("911 (996)","996","p",1997,2005,80000,"por_m96:300:ma:bva_old",{floor:.5}),
    M("911 (997)","997","p",2005,2012,95000,"por_997:325:ma:pdk|por_flat6:385:ma:pdk",{floor:.6}),
    M("911 (964/993) (collection)","964,993","p",1989,1998,110000,"por_aircooled:272",{floor:1.3}),
    M("Boxster (986)","986,boxster","p",1996,2004,50000,"por_m96:228",{floor:.45}),
    M("Boxster/Cayman (987/981)","987,981,boxster,cayman","p",2005,2016,58000,"por_997:265:ma:pdk|por_flat6:325:ma:pdk",{floor:.55}),
    M("944/968 (classique)","944,968","p",1982,1995,25000,"vag_18t:163",{floor:1}),
    M("928 (classique)","928","p",1977,1995,40000,"mb_m113:320:a:bva_old",{floor:1.1}),
    M("Carrera GT (collection)","carrera gt","x",2003,2006,450000,"fer_v12:612",{floor:3}),
    M("918 Spyder (collection)","918","x",2013,2015,850000,"fer_v12:887:a:dsg_wet",{floor:2.2})
  );
  find("Ford").models.push(
    M("Ka/Ka+","ka","c",1996,2020,12000,"ford_duratec:70"),
    M("Mondeo","mondeo","b",1993,2022,30000,"ford_tdci:150:ma:dsg_wet|ford_eco15:160|ford_tdci18:125"),
    M("S-Max/Galaxy","s-max,smax,galaxy","s",2006,2023,35000,"ford_tdci:150:ma:dsg_wet|ford_eco15:160"),
    M("C-Max/B-Max","c-max,cmax,b-max","s",2003,2019,20000,"ford_duratec:105|ford_tdci:115|ford_eco10:125"),
    M("EcoSport","ecosport","s",2014,2022,20000,"ford_eco10:125|ford_tdci:100"),
    M("Edge","edge","s",2016,2020,42000,"ford_tdci:210:a:bva_old"),
    M("Ranger","ranger","s",1999,2026,42000,"ford_tdci:213:a:zf8|ford_st:292:a:zf8"),
    M("Transit","transit","s",1994,2026,38000,"ford_tdci:130|ford_tdci18:115"),
    M("Transit/Tourneo Custom","transit custom,tourneo","s",2012,2026,40000,"ford_tdci:170:ma:bva_old"),
    M("Tourneo/Transit Connect","connect","s",2002,2026,26000,"ford_tdci:100|psa_bluehdi15:100"),
    M("Mustang (classique)","mustang","p",1964,1973,45000,"gm_ls:271",{floor:1.5}),
    M("Mustang VI/VII","mustang,mustang gt","p",2015,2026,55000,"ford_v8:450:ma:zf8|ford_st:290:ma:zf8",{floor:.6}),
    M("Mustang Mach-E","mach-e,mach e","e",2021,2026,50000,"chevy_ev:294:a"),
    M("Explorer EV","explorer","e",2024,2026,45000,"vag_meb:286:a"),
    M("Capri EV","capri","e",2024,2026,45000,"vag_meb:286:a"),
    M("Focus RS/ST","focus rs,focus st","p",2002,2022,42000,"ford_st:350:m::1:p",{floor:.6}),
    M("Escort/Sierra (classique)","escort,sierra,cosworth","k",1980,1998,15000,"classic_uk:150",{floor:1.2}),
    M("GT (collection)","ford gt","x",2005,2022,450000,"ford_v8:550",{floor:2.5}),
    M("Puma ST","puma st","s",2021,2026,34000,"ford_eco15:200")
  );
  find("Opel").models.push(
    M("Corsa B","corsa","c",1993,2000,9500,"gm_ecotec:60",{floor:.6}),
    M("Astra F/G","astra","k",1991,2004,14000,"gm_ecotec:90|psa_hdi20_old:82"),
    M("Vectra/Signum","vectra,signum","b",1995,2008,24000,"gm_ecotec:122|opel_cdti:150|fiat_jtd:150"),
    M("Antara","antara","s",2006,2015,28000,"opel_cdti:163:a:bva_old"),
    M("Ampera","ampera","e",2012,2016,38000,"chevy_ev:150:a"),
    M("Ampera-e","ampera-e","e",2017,2019,40000,"chevy_ev:204:a"),
    M("Cascada","cascada","k",2013,2018,28000,"opel_sge:170|opel_cdti:165"),
    M("Vivaro","vivaro","s",2001,2026,32000,"ren_m9r:145|psa_bluehdi20:180:a:dsg_wet"),
    M("Movano","movano","s",1999,2026,36000,"ren_m9r:150|psa_bluehdi20:140"),
    M("Rocks-e","rocks-e,rocks","e",2021,2026,8500,"micro_ev:8:a"),
    M("Frontera (2024+)","frontera","s",2024,2026,29000,"psa_hy48:136:a|ev_psa:113:a"),
    M("Manta (collection)","manta","p",1970,1988,20000,"classic_uk:105",{floor:1.2}),
    M("Kadett GSI (collection)","kadett","k",1984,1991,10000,"gm_ecotec:115",{floor:1})
  );
  find("Fiat").models.push(
    M("Uno (classique)","uno","c",1983,1995,6500,"fiat_fire:60",{floor:.7}),
    M("Cinquecento/Seicento","cinquecento,seicento","c",1991,2010,7500,"fiat_fire:54"),
    M("Stilo","stilo","k",2001,2008,16500,"fiat_fire:103|fiat_jtd:115"),
    M("Bravo/Brava (90s)","bravo,brava","k",1995,2002,14500,"fiat_fire:103|fiat_jtd:105"),
    M("Croma","croma","b",2005,2011,24000,"fiat_jtd:150:a:bva_old"),
    M("Idea","idea","c",2003,2012,13500,"fiat_fire:77|fiat_mjet:90"),
    M("Multipla","multipla","s",1998,2010,18500,"fiat_jtd:110|fiat_fire:103"),
    M("Sedici","sedici","s",2006,2014,17500,"fiat_mjet:120|suzuki_atmo:107"),
    M("Fiorino/Qubo","fiorino,qubo","c",2008,2021,14500,"fiat_mjet:80|psa_hdi16:75"),
    M("Scudo/Talento","scudo,talento","s",1996,2026,30000,"psa_bluehdi20:145|ren_r9m:120|fiat_mjet:120"),
    M("600 (2023+)","fiat 600","s",2023,2026,30000,"psa_hy48:136:a|ev_psa:156:a"),
    M("Grande Panda","grande panda","c",2025,2026,19000,"psa_hy48:110:a|ev_psa:113:a"),
    M("Topolino","topolino","e",2023,2026,10000,"micro_ev:8:a"),
    M("500 (collection)","fiat 500 ancienne,cinquino","c",1957,1975,15000,"classic_fr:18",{floor:1.6}),
    M("Panda (classique)","panda 4x4","c",1980,2003,7500,"fiat_fire:54",{floor:.9})
  );
  find("Alfa Romeo").models.push(
    M("75 (classique)","alfa 75","b",1985,1992,14000,"classic_fr:155",{floor:1.1}),
    M("164/166","164,166","b",1987,2007,18000,"dmc_prv:192|fiat_jtd:150"),
    M("145/146","145,146","k",1994,2001,12000,"fiat_fire:103"),
    M("GTV (916)","gtv","p",1995,2005,20000,"fiat_fire:150|dmc_prv:192",{floor:.8})
  );
  find("Lancia").models.push(
    M("Fulvia (collection)","fulvia","p",1963,1976,25000,"classic_fr:90",{floor:1.4}),
    M("Thesis","thesis","b",2002,2009,35000,"fiat_jtd:175:a:bva_old"),
    M("Lybra","lybra","b",1999,2005,20000,"fiat_jtd:115"),
    M("Phedra","phedra","s",2002,2010,28000,"psa_22hdi:128")
  );
  find("Ferrari").models.push(
    M("348/F355","348,f355,355","x",1989,1999,110000,"fer_f1v8:380:ma:f1_robot",{floor:1}),
    M("Mondial (classique)","mondial","x",1980,1993,60000,"fer_f1v8:300",{floor:.9}),
    M("612 Scaglietti","612","x",2004,2011,120000,"fer_v12:540:a:f1_robot",{floor:.55}),
    M("F40 (collection)","f40","x",1987,1992,900000,"fer_f1v8:478",{floor:3.5,mx:3}),
    M("F50 (collection)","f50","x",1995,1997,1500000,"fer_v12:520",{floor:3,mx:3}),
    M("Enzo (collection)","enzo","x",2002,2004,700000,"fer_v12:660:a:f1_robot",{floor:4,mx:3}),
    M("LaFerrari (collection)","laferrari","x",2013,2016,1400000,"fer_v12:963:a:dsg_wet",{floor:2.5,mx:3}),
    M("SF90 Stradale","sf90","x",2020,2026,430000,"fer_v8:1000:a:dsg_wet",{floor:.65}),
    M("296 GTB","296","x",2022,2026,300000,"fer_v8:830:a:dsg_wet",{floor:.7}),
    M("Purosangue","purosangue","s",2023,2026,400000,"fer_v12:725:a:dsg_wet",{floor:.85})
  );
  find("Lamborghini").models.push(
    M("Countach (collection)","countach","x",1974,1990,450000,"lam_v12:455",{floor:2.2,mx:3}),
    M("Diablo (collection)","diablo","x",1990,2001,280000,"lam_v12:492",{floor:1.8,mx:2})
  );
  find("Maserati").models.push(
    M("MC12 (collection)","mc12","x",2004,2005,800000,"fer_v12:630:a:f1_robot",{floor:3.5}),
    M("GranCabrio","grancabrio","x",2010,2026,140000,"fer_v8:460:a:bva_old",{floor:.5})
  );
  find("Aston Martin").models.push(
    M("Rapide","rapide","b",2010,2019,120000,"aston_v12o:477:a:bva_old",{floor:.4}),
    M("DB5 (collection)","db5","x",1963,1965,750000,"classic_uk:286",{floor:4})
  );
  find("McLaren").models.push(
    M("P1 (collection)","p1","x",2013,2015,1100000,"mcl_v8:916:a:dsg_wet",{floor:1.5,mx:3}),
    M("Senna (collection)","senna","x",2018,2019,850000,"mcl_v8:800:a:dsg_wet",{floor:1.2,mx:3}),
    M("600LT","600lt","x",2018,2021,230000,"mcl_v8:600:a:dsg_wet",{hold:.8})
  );
  find("Bentley").models.push(M("Mulsanne","mulsanne","b",2010,2020,280000,"rr_v12:512:a:zf8",{floor:.4}));
  find("Lotus").models.push(M("Emeya","emeya","e",2024,2026,110000,"lotus_ev:612:a"));
  find("Jaguar").models.push(
    M("E-Type (collection)","e-type,type e","x",1961,1975,120000,"classic_uk:269",{floor:2}),
    M("XJS (classique)","xjs","x",1975,1996,30000,"classic_uk:295",{floor:1}),
    M("XJ220 (collection)","xj220","x",1992,1994,400000,"mcl_v8:542",{floor:1.8})
  );
  find("Land Rover").models.push(M("Series I-III (collection)","series,land rover series","s",1948,1985,30000,"classic_uk:70",{floor:1.5}));
  find("Jeep").models.push(M("Willys/CJ (collection)","willys,cj7","s",1945,1986,30000,"classic_uk:75",{floor:1.4}));
  find("Mini").models.push(M("Paceman","paceman","s",2013,2016,26000,"psa_thp:184|bmw_b47:112"));
  find("Smart").models.push(M("Roadster","smart roadster","p",2003,2006,18000,"ren_d4f:82:a:amt",{floor:.7}));
  find("Škoda").models.push(
    M("Felicia (classique)","felicia","c",1994,2001,8000,"vag_mpi:68",{floor:.5}),
    M("Elroq","elroq","e",2025,2026,35000,"vag_meb:204:a")
  );
  find("Seat").models.push(
    M("Arosa","arosa","c",1997,2004,9500,"vag_mpi:60"),
    M("Cordoba","cordoba","b",1993,2009,13500,"vag_mpi:85|vag_19tdi:100"),
    M("Exeo","exeo","b",2009,2013,24000,"vag_20tdipd:143|vag_18t:150")
  );
  find("Cupra").models.push(M("Terramar","terramar","s",2024,2026,45000,"vag_ea888:265:a:dsg_wet|psa_hy48:272:a"));
  find("Toyota").models.push(
    M("Starlet (classique)","starlet","c",1990,1999,8000,"toy_atmo:75",{floor:.7}),
    M("Carina/Corona","carina","b",1992,1998,14000,"toy_atmo:107"),
    M("Previa","previa","s",1990,2006,26000,"toy_d4d:116"),
    M("Corolla Verso","corolla verso","s",2002,2009,21000,"toy_d4d:136|toy_atmo:129"),
    M("GR Corolla","gr corolla","p",2023,2026,55000,"toy_gr:300",{floor:.75}),
    M("Crown","crown","s",2023,2026,50000,"toy_hsd:244:a:ecvt")
  );
  find("Nissan").models.push(
    M("Almera","almera","k",1995,2006,13500,"nis_hr16:90|ren_f9q:110"),
    M("Sunny (classique)","sunny","k",1986,1995,8000,"nis_hr16:75",{floor:.6}),
    M("Terrano","terrano","s",1993,2006,25000,"mitsu_did:125",{floor:.6}),
    M("Pathfinder","pathfinder","s",1997,2014,35000,"ren_m9r:190:a:bva_old"),
    M("Murano","murano","s",2003,2014,40000,"nis_vq:234:a:cvt_jatco"),
    M("Cube","cube","c",2009,2011,16000,"nis_hr16:110:a:cvt_jatco"),
    M("Pixo","pixo","c",2009,2013,9000,"suzuki_atmo:68"),
    M("NV200/e-NV200","nv200,e-nv200","s",2010,2021,25000,"ren_dci15:90|nis_leaf:109:a"),
    M("Skyline GT-R (import collection)","skyline,r34,r33","x",1993,2002,120000,"mitsu_4g63:280",{floor:2})
  );
  find("Honda").models.push(
    M("Civic (années 90)","civic vti,ek4","k",1991,2000,13500,"honda_atmo:125",{floor:.9}),
    M("FR-V","fr-v,frv","s",2005,2009,22000,"honda_atmo:140|honda_dtec:140"),
    M("Stream","stream","s",2001,2006,20000,"honda_atmo:156"),
    M("Legend","legend","b",1996,2010,45000,"nis_vq:295:a:bva_old"),
    M("Prelude (classique)","prelude","p",1992,2001,18000,"honda_atmo:185",{floor:1}),
    M("CR-Z","cr-z,crz","p",2010,2014,22000,"honda_hev:124",{floor:.6}),
    M("e:Ny1","eny1,e:ny1","e",2023,2026,40000,"mg_ev:204:a")
  );
  find("Mazda").models.push(
    M("323/626 (classique)","323,626","k",1989,2003,10000,"mazda_mzr:88"),
    M("Premacy/Mazda5","premacy,mazda5,mazda 5","s",1999,2018,19500,"mazda_mzr:145|psa_hdi16:110"),
    M("MPV","mpv","s",1996,2006,22000,"mazda_mzr:141"),
    M("CX-7","cx-7,cx7","s",2007,2012,30000,"mazda_skyd:173"),
    M("BT-50","bt-50,bt50","s",2006,2020,28000,"isuzu_d:163"),
    M("RX-7 (collection)","rx-7,rx7","x",1992,2002,60000,"mazda_rotary:239",{floor:2})
  );
  find("Mitsubishi").models.push(
    M("Carisma","carisma","k",1995,2004,12500,"ren_f9q:102|hk_atmo:103"),
    M("Galant","galant","b",1996,2003,17000,"hk_atmo:136"),
    M("Grandis","grandis","s",2004,2011,24000,"psa_hdi16:136"),
    M("i-MiEV","i-miev,imiev","e",2010,2016,24000,"nis_leaf:67:a"),
    M("Pajero Pinin","pinin","s",1999,2006,17500,"hk_atmo:129")
  );
  find("Suzuki").models.push(
    M("Wagon R+/Splash","wagon r,splash","c",1997,2014,10000,"suzuki_atmo:86"),
    M("Grand Vitara","grand vitara","s",1998,2015,24000,"ren_f9q:129|suzuki_atmo:140"),
    M("Samurai (classique)","samurai,sj 413","s",1985,2003,10000,"suzuki_atmo:64",{floor:1.1}),
    M("Across","across","s",2020,2026,55000,"toy_hsd:306:a:ecvt"),
    M("Swace","swace","k",2020,2026,32000,"toy_hsd:122:a:ecvt")
  );
  find("Subaru").models.push(
    M("Justy","justy","c",1989,2010,9000,"suzuki_atmo:69"),
    M("Tribeca","tribeca","s",2006,2013,38000,"subaru_ej:258:a:bva_old"),
    M("SVX (collection)","svx","p",1992,1997,20000,"subaru_ej:231:a:bva_old",{floor:1})
  );
  find("Volvo").models.push(
    M("850 (classique)","850,850 t5","b",1991,1997,15000,"volvo_5cyl:170",{floor:.8}),
    M("940/960 (classique)","940,960","b",1990,1998,14000,"classic_uk:135",{floor:.7}),
    M("P1800 (collection)","p1800","p",1961,1973,45000,"classic_uk:100",{floor:1.8})
  );
  find("Hyundai").models.push(
    M("Atos","atos","c",1998,2008,8000,"hk_atmo:59"),
    M("Matrix","matrix","c",2001,2010,13500,"hk_crdi:102"),
    M("Terracan","terracan","s",2001,2007,26000,"mitsu_did:163"),
    M("Sonata","sonata","b",1998,2012,24000,"hk_atmo:165"),
    M("Staria","staria","s",2021,2026,45000,"hk_crdi:177:a:bva_old"),
    M("Genesis Coupé","genesis coupe","p",2011,2015,32000,"gen_33t:303:ma:bva_old",{floor:.5}),
    M("Inster","inster","e",2025,2026,25000,"hk_ev:115:a")
  );
  find("Kia").models.push(
    M("XCeed","xceed","s",2019,2026,28000,"hk_tgdi:140:ma:dsg_wet|lynk_phev:141:a"),
    M("Optima","optima","b",2012,2020,32000,"hk_crdi:141:a:dsg_wet"),
    M("Carnival","carnival","s",2006,2014,28000,"hk_crdi:192:a:bva_old"),
    M("EV3","ev3,ev 3","e",2024,2026,38000,"hk_egmp:204:a"),
    M("Sportage (2004–2015)","sportage","s",2004,2015,24000,"hk_crdi:136|hk_atmo:141"),
    M("Sorento I (2002–2009)","sorento","s",2002,2009,30000,"hk_crdi:170:a:bva_old")
  );
  find("Daewoo").models.push(M("Nubira","nubira","k",1997,2004,12000,"daewoo_a:106"));
  find("BYD").models.push(
    M("Sealion 7","sealion","s",2025,2026,47000,"byd_ev:313:a"),
    M("Atto 2","atto 2,atto2","e",2025,2026,30000,"byd_ev:177:a")
  );
  find("MG").models.push(M("Cyberster","cyberster","p",2024,2026,65000,"mg_ev:340:a",{floor:.55}));
  find("Tesla").models.push(M("Cybertruck (import)","cybertruck","e",2024,2026,100000,"tesla_s:600:a",{floor:.7}));
})();

/* --- Nouvelles marques --- */
Br("Triumph","triumph",2,[
M("Spitfire (collection)","spitfire","p",1962,1980,15000,"classic_uk:75",{floor:1.3}),
M("TR4/TR6 (collection)","tr4,tr6","p",1961,1976,30000,"classic_uk:104",{floor:1.5}),
M("Stag (collection)","stag","p",1970,1977,20000,"classic_uk:145",{floor:1.2})
]);
Br("De Tomaso","de tomaso,detomaso",3,[
M("Pantera (collection)","pantera","x",1971,1993,110000,"gm_ls:330",{floor:1.8})
]);
Br("Venturi","venturi",3,[
M("Atlantique/400 GT (collection)","atlantique,400 gt","x",1991,2000,80000,"dmc_prv:281",{floor:1.5})
]);
Br("PGO","pgo",3,[
M("Spéedster II / Cévennes","speedster,cevennes,cévennes","p",2000,2015,35000,"psa_vti:135",{floor:.7})
]);
Br("Secma","secma",1,[
M("F16","f16,secma f16","p",2008,2026,25000,"ren_k4m:105",{floor:.7}),
M("Fun Buggy","fun buggy","p",2000,2020,15000,"ren_d4f:64",{floor:.6})
]);
Br("Casalini","casalini",1,[
M("M20","m20","c",2018,2026,17000,"vsp_d:8:a:cvt_jatco"),
M("550","casalini 550","c",2010,2018,13000,"vsp_d:8:a:cvt_jatco")
]);
Br("Bellier","bellier",1,[
M("B8","b8","c",2018,2026,15000,"vsp_d:8:a:cvt_jatco"),
M("Docker","docker","c",2015,2026,14000,"vsp_d:8:a:cvt_jatco")
]);
Br("JDM","jdm,jdm simpa",1,[
M("Xheos","xheos","c",2018,2026,15500,"vsp_d:8:a:cvt_jatco"),
M("Aloes","aloes","c",2010,2020,12000,"vsp_d:8:a:cvt_jatco")
]);
Br("Iveco","iveco",1,[
M("Daily","daily","s",1999,2026,42000,"iveco_d:156"),
M("Massif","massif","s",2008,2011,32000,"iveco_d:176",{floor:.6})
]);
Br("Piaggio","piaggio",1,[
M("Porter","porter","c",1993,2021,15000,"dai_a:65")
]);

/* ============================================================
   COMPLÉMENT v4 — nouveautés 2024–2026 et derniers oublis
   ============================================================ */
Object.assign(ENGINES, {
  ev_early_vag:{label:"e-Golf / e-up! électrique",fuel:"Électrique",conso:"13,8 kWh",rel:78,issues:[
    {t:"Autonomie d'origine modeste (190–260 km) : vérifiez le SOH batterie",sev:"warn",chk:"Relever l'autonomie affichée à 100 %"}]},
  xiaomi_ev:{label:"SU7 électrique (import)",fuel:"Électrique",conso:"15,8 kWh",rel:70,issues:[
    {t:"Import hors réseau officiel : garantie, pièces et mises à jour incertaines en Europe",sev:"warn",ask:"Qui assure le SAV et les mises à jour ?"}]},
  mas_nettuno:{label:"3.0 V6 Nettuno",fuel:"Essence",conso:10.5,rel:72,issues:[
    {t:"Moteur récent : exigez un historique réseau complet",sev:"warn",ask:"Toutes les campagnes de rappel sont-elles soldées ?"}]}
});
(function(){
  const find = (n) => BRANDS.find(b => b.name === n);
  find("Renault").models.push(
    M("Twingo E-Tech","twingo e-tech,twingo electrique","e",2021,2026,24000,"ev_zoe:82:a"),
    M("Espace VI","espace","s",2023,2026,44000,"ren_etech:200:a:ecvt")
  );
  find("Volkswagen").models.push(
    M("e-Golf","e-golf,egolf","e",2014,2020,36000,"ev_early_vag:136:a"),
    M("e-up!","e-up,eup","e",2014,2023,24000,"ev_early_vag:83:a"),
    M("Golf Sportsvan","sportsvan","k",2014,2020,25000,"vag_ea211:125:ma:dq200|vag_ea288:115"),
    M("Multivan T7","multivan t7","s",2021,2026,55000,"vag_ea211:150:a:dsg_wet|vag_ea888:204:a:dsg_wet")
  );
  find("Peugeot").models.push(M("5008 III","5008","s",2024,2026,43000,"psa_hy48:136:a|ev_psa:210:a"));
  find("Citroën").models.push(M("C4 X","c4 x,c4x","b",2022,2026,30000,"eb2_puretech:130:a:dsg_wet|ev_psa:136:a"));
  find("Opel").models.push(
    M("Agila","agila","c",2000,2014,11500,"suzuki_atmo:94"),
    M("Zafira Life","zafira life","s",2019,2026,42000,"psa_bluehdi20:177:a:dsg_wet")
  );
  find("Dacia").models.push(M("Dokker","dokker","s",2012,2021,14500,"ren_dci15:90|ren_tce_12:115"));
  find("Toyota").models.push(
    M("Corolla Cross","corolla cross","s",2022,2026,36000,"toy_hsd:197:a:ecvt"),
    M("Proace City","proace city","s",2020,2026,28000,"psa_bluehdi15:100|eb2_puretech:110")
  );
  find("Honda").models.push(M("ZR-V","zr-v,zrv","s",2023,2026,42000,"honda_hev:184:a:ecvt"));
  find("Mazda").models.push(M("CX-80","cx-80,cx80","s",2024,2026,55000,"mazda_skyd:254:a:zf8"));
  find("Nissan").models.push(M("Townstar","townstar","s",2022,2026,28000,"ren_tce13:130|ev_zoe:122:a"));
  find("Hyundai").models.push(M("Ioniq 9","ioniq 9,ioniq9","e",2025,2026,72000,"hk_egmp:428:a"));
  find("Mercedes-Benz").models.push(
    M("EQV","eqv","e",2020,2026,75000,"mb_eq:204:a"),
    M("CLE","cle","b",2024,2026,60000,"mb_m270:204:a:bva_old"),
    M("Classe T","classe t","s",2022,2026,30000,"ren_dci15:116|ren_tce13:131")
  );
  find("Audi").models.push(M("Q6 e-tron","q6,q6 e-tron","e",2024,2026,65000,"vag_etron:387:a"));
  find("Smart").models.push(M("#5","smart #5,#5","e",2025,2026,48000,"zeekr_ev:340:a"));
  find("Ford").models.push(M("Bronco","bronco","s",2023,2026,60000,"ford_st:335:a:zf8",{floor:.6}));
  find("Ferrari").models.push(M("12Cilindri","12cilindri,12 cilindri","x",2024,2026,400000,"fer_v12:830:a:dsg_wet",{floor:.85}));
  find("Maserati").models.push(M("GranTurismo II","granturismo","x",2023,2026,190000,"mas_nettuno:490:a:zf8",{floor:.6}));
  find("McLaren").models.push(M("750S","750s","x",2023,2026,280000,"mcl_v8:750:a:dsg_wet",{hold:.85}));
  find("Aston Martin").models.push(M("DB12","db12","x",2023,2026,250000,"aston_v8:680:a:zf8",{floor:.65}));
  find("Porsche").models.push(M("Macan électrique","macan electrique,macan ev","e",2024,2026,85000,"por_ev:408:a"));
  find("Alpine").models.push(M("A390","a390","e",2025,2026,65000,"ren_ev5:400:a"));
  find("Kia").models.push(M("Ceed SW","ceed sw","k",2018,2026,26000,"hk_tgdi:120:ma:dsg_wet"));
})();
Br("Xiaomi","xiaomi",2,[
M("SU7 (import)","su7,xiaomi su7","e",2024,2026,80000,"xiaomi_ev:673:a",{floor:.55})
]);
Br("Ineos","ineos",2,[
M("Grenadier","grenadier","s",2022,2026,75000,"bmw_6cyl:286:a:zf8|bmw_n57:249:a:zf8",{floor:.65})
]);

/* ============================================================
   v5 — DÉCLINAISONS DE PUISSANCE RÉELLES PAR FAMILLE (ch DIN)
   Chaque palier a réellement été commercialisé pour la famille.
   ============================================================ */
const STEPS = {
eb2_puretech:[68,75,82,100,110,130,136],
psa_pt_atmo:[68,72,75,82],
psa_bluehdi15:[100,102,110,120,130],
psa_bluehdi20:[150,163,177,180],
psa_thp:[150,155,156,163,165,180,200,208,225,250,270],
psa_vti:[95,120],
psa_tu:[50,60,68,75,90,95,100,110,118,125],
psa_ew:[117,135,138,140,143,158,170,204],
psa_hdi16:[68,75,90,92,99,109,110,112,115,120],
psa_hdi20_old:[90,107,109,110,136,140,150,163,180],
psa_22hdi:[128,133,156,163,170,173,204],
psa_hybrid4:[163,200],
psa_hy48:[110,136,145,180,195,225,280,300,360],
ev_psa:[113,115,118,136,156,210,230,280],
ren_tce90:[90,91,100,110,115,117],
ren_tce_12:[100,115,118,120,125,130],
ren_tce13:[115,130,140,150,155,158,160],
ren_dci15:[65,68,75,85,86,90,95,100,105,110,115],
ren_k4m:[75,95,98,105,110,112,113,115,128,133,135],
ren_d4f:[58,60,64,75,76],
ren_f9q:[80,90,95,100,105,110,115,120,130],
ren_m9r:[130,150,160,170,173,175,177,190,200],
ren_r9m:[110,115,120,130,160],
ren_f4r:[135,138,143,147,150,163,172,182,197,203,220,225,250,265,271,275,280,300],
ren_etech:[140,143,145,160,200,205,225,280,300],
ev_zoe:[65,82,88,90,92,108,110,120,135],
ev_spring:[45,48,65],
ren_ev5:[120,150,180,218,220,400],
nis_hr16:[75,80,88,90,98,110,114,116,117,140],
nis_dig16:[115,163,190,214,218],
nis_vq:[208,231,234,238,258,280,286,298,301,313,320,328,333,344,350,364],
nis_vr38:[485,530,550,570,600],
nis_leaf:[80,109,110,122,150,160,217,239,242],
vag_ea211:[75,80,85,90,95,110,115,116,122,125,130,140,150,160],
vag_ea111:[85,86,90,105,122,125,140,160,170,180,185],
vag_ea888:[170,180,190,200,211,220,230,245,252,265,272,280,290,300,310,320,333,367,400,421],
vag_ea288:[90,102,105,110,115,116,120,136,150,163,184,190,200,204,240],
vag_mpi:[50,54,55,60,65,68,75,80,86,90,101,102,105,110,115],
vag_19tdi:[90,100,101,105,110,115,116,130,150,160],
vag_20tdipd:[136,140,163,170],
vag_fsi:[86,90,105,115,125,140,150,160,170,200],
vag_18t:[150,156,163,180,190,210,225,240],
vag_25tdi:[150,155,163,174,180],
vag_30tdi:[204,211,218,224,233,240,245,250,258,262,272,286,313,347,435],
vag_meb:[109,125,145,148,150,170,204,231,265,286,299,326,340],
vag_etron:[170,204,265,286,299,313,340,387,408,503],
vag_5cyl:[310,340,367,400,401],
audi_v10:[525,540,550,560,570,610,620],
bmw_n47:[95,105,116,143,163,177,184,204,218],
bmw_b47:[116,136,150,163,190,224,231],
bmw_b48:[102,109,116,136,140,156,163,170,178,184,192,197,204,218,231,245,252,258,306],
bmw_6cyl:[254,258,265,286,306,320,326,335,340,360,369,374,382,387,400,420,435,450,462,480,510],
bmw_s55:[431,450,460,500],
bmw_m57:[115,122,136,143,150,163,184,193,204,218,231,235,245,272,286],
bmw_n46:[115,116,118,129,136,143,150,170],
bmw_n52:[150,156,170,177,192,193,218,231,258,265,272],
bmw_n20:[136,156,163,170,184,218,245],
bmw_n57:[204,211,218,245,258,265,286,299,313,340,381,388,400],
bmw_s65:[420,450],
bmw_iev:[125,136,170,184,204,231,286,313,326,340,397,401,440,455,544,619],
mb_om651:[109,116,136,143,163,170,177,190,204,218],
mb_om654:[150,160,163,190,194,200,220,245,265,286,330],
mb_m270:[102,109,122,136,156,163,184,190,204,211,218,224,272,306,381,387,421],
mb_om611:[82,90,95,102,109,116,122,129,136,143,150,156,170,177,204],
mb_m113:[279,292,306,326,360,367,394,476,507],
mb_m156:[457,467,481,507,514,517,525,571,585],
mb_om642:[163,177,190,204,211,218,224,231,235,239,250,258,265,286,340],
mb_eq:[140,163,190,204,215,228,245,272,292,333,350,408,476,484,523,560,571,658],
ford_eco10:[95,100,101,120,125,140,155],
ford_eco15:[150,160,182,200],
ford_tdci:[95,100,105,115,120,150,170,185,190,210,213,238],
ford_tdci18:[75,90,100,115,125],
ford_duratec:[60,65,68,70,75,80,82,85,100,105,110,125,145],
ford_st:[250,280,290,300,335,350,365,392,450,457],
ford_v8:[418,421,446,450,460,486],
toy_hsd:[98,100,109,116,122,125,131,136,140,178,184,196,197,198,215,218,222,223,225,244,245,248,306,309,343,345,359],
toy_atmo:[68,69,71,72,75,87,90,97,99,107,110,116,125,129,132,140,143,147,152],
toy_d4d:[90,110,116,124,126,136,143,150,163,177,190,204],
toy_gr:[261,280,300],
toy_boxer:[200,207,228,234],
honda_atmo:[75,83,90,98,100,109,125,130,140,155,156,160,185,190,200,220,240],
honda_turbo:[126,129,182],
honda_hev:[98,107,109,116,122,124,131,143,145,158,163,184,204],
honda_dtec:[100,120,150,160,180],
honda_typer:[306,310,320,329],
mazda_sky:[75,90,115,120,121,122,132,150,155,165,180,184,186,194],
mazda_skyd:[105,116,150,173,175,184,190,254],
mazda_mzr:[75,84,88,105,110,115,126,141,145,147,150,170,184,260],
mazda_rotary:[192,231,239],
subaru_ej:[95,115,150,156,165,173,193,211,218,230,231,258,265,277,280,300,320],
subaru_fb:[114,136,150,156,169,170,175],
subaru_d:[147,150],
mitsu_did:[115,116,125,136,140,150,163,177,178,190,200],
mitsu_phev:[188,200,203,224,248],
mitsu_4g63:[141,205,231,260,280,295,301,305,366],
suzuki_atmo:[50,53,60,64,65,68,69,73,75,83,86,90,94,102,107,112,120,140],
suzuki_jet:[90,102,111,112,129,140],
hk_atmo:[59,63,66,67,69,75,78,84,87,90,100,105,120,126,128,132,135,141,143,165],
hk_tgdi:[100,105,120,140,150,177,186,198,204,250,280],
hk_crdi:[75,77,88,90,102,110,115,116,128,136,141,150,170,177,185,200,202,210],
hk_hev:[105,129,139,141,183,215,230,265],
hk_ev:[115,120,136,150,156,170,204,218,229],
hk_egmp:[170,204,218,229,239,325,384,428,430,585,650],
gen_33t:[249,304,366,370,375],
volvo_5cyl:[126,136,140,163,170,180,185,200,205,215,220,225,230,250,265],
volvo_de:[120,122,150,152,163,190,197,225,235,250],
volvo_t8:[303,318,327,340,390,407,455],
volvo_ev:[204,218,231,238,252,272,300,408,428,442,517],
pol_ev:[170,200,231,272,299,310,408,421,455,476,489,517],
saab_t:[150,154,175,185,205,210,220,230,250,260,280],
jlr_ing_d:[150,163,165,180,204,240,249,300,306],
jlr_ing_p:[200,249,250,280,300,320,340],
jlr_tdv6:[190,200,207,211,240,245,256,272,275,290,306],
jlr_v8s:[375,385,390,405,416,426,435,450,470,495,503,510,525,530,542,550,565,567,575,585,600,605,608,621,625],
jlr_ipace:[400],
fiat_fire:[54,60,65,69,70,73,77,78,80,85,95,100,101,103,120,150],
fiat_twinair:[65,80,85,86,90,105],
fiat_multiair:[105,120,135,140,150,160,163,165,170,180],
fiat_mjet:[75,80,85,90,95,105,120,130,140,150,170,200],
fiat_jtd:[100,105,110,115,120,126,136,150,165,170,175],
fiat_tjet:[120,150,155,165,180],
alfa_22d:[136,150,160,180,190,210],
alfa_veloce:[200,240,280],
alfa_tbi:[200,235,240],
opel_sge:[90,100,105,115,140,150,170,192,200],
opel_cdti:[95,110,120,130,136,160,163,165,170,195],
gm_ecotec:[60,75,78,90,95,100,105,115,122,124,125,136,140,143,164,230,264,276],
gm_ls:[271,325,330,355,360,404,420,426,436,450,453,455,466,477,482,495,650,659],
chevy_ev:[150,204,294],
dodge_hemi:[340,352,364,375,401,410,462,468,477,485,492,527,645,710,717,797],
dodge_v6:[260,264,272,280,283,284,286,290,305,309],
hummer_ev:[510,528,625,830,1000],
fisker_ev:[275,468,564],
lucid_ev:[480,620,819,1111],
tesla_3y:[239,283,306,325,351,377,413,460,466,510,534],
tesla_s:[333,388,422,428,476,525,539,613,700,772,1020],
byd_ev:[95,150,177,204,218,231,252,313,390,517],
byd_dmi:[197,218,238],
mg_ev:[115,143,154,156,163,170,177,204,231,245,288,313,340,435],
mg_t:[106,119,131,162,170],
chery_t:[147,150,186,204,254,279,347,395],
leap_ev:[95,109,136,156,170,218,231,272],
xpeng_ev:[196,258,276,296,313,343,350,473,570],
nio_ev:[218,313,360,400,480,490,544,653],
zeekr_ev:[200,272,340,428,475,544,580],
lynk_phev:[141,197,218,254,261,280,346,347],
vinfast_ev:[150,174,204,300,353,408],
aiways_ev:[190,204,218],
ora_ev:[143,171,204,300],
seres_ev:[163,218,585],
dfsk_t:[136,177],
sky_ev:[204,272],
hongqi_ev:[435,462,551,600],
forthing_t:[150,177,204],
micro_ev:[8,12,15,17,20],
xev_ev:[8,10,15],
lada_16:[75,82,83,87,90,98,106,122],
ssang_xdi:[136,141,155,163,178,181,202],
daewoo_a:[50,60,68,75,80,86,94,106,109],
dai_a:[56,58,65,68,70,80,87,90,102,105],
isuzu_d:[120,150,158,163,164,176,190],
alp_18t:[252,292,300],
smart_ev:[60,71,82,90],
rover_k:[75,84,90,95,103,109,111,117,120,135,143,145,160,177,190],
vsp_d:[6,8,9],
classic_fr:[13,18,29,34,45,50,55,60,65,70,75,90,96,100,102,109,110,115,120,130,138,153,170],
classic_uk:[65,70,75,95,100,104,105,135,145,150,265,269,286,295],
por_flat6:[300,325,350,365,385,400,420,443,450,473,480,500,510,525,650],
por_flat4:[300,350],
por_m96:[204,228,252,265,272,300,320,345,381],
por_997:[265,295,305,325,345,355,385,408,415,450,480,500,530],
por_aircooled:[231,250,272,285,300,360,408,450],
por_v6:[258,300,333,340,354,362,380,400,420,440],
por_v8c:[340,385,405,420,450,500,520,521,550,570],
por_ev:[326,408,435,476,530,571,598,625,761,952,1034],
fer_v8:[390,400,426,441,460,483,490,508,560,570,600,605,620,625,670,710,720,730,780,830,1000],
fer_f1v8:[300,325,380,390,400,412,483,490],
fer_v12:[365,380,390,442,485,508,515,520,540,560,575,599,612,620,651,660,670,725,730,789,800,810,819,830,840,963],
lam_gallardo:[500,512,520,530,540,550,552,560,570],
lam_huracan:[540,580,602,610,631,640],
lam_v12:[455,492,530,550,570,580,631,640,650,670,690,700,740,750,770,780,1015],
lam_urus:[650,657,666,800],
mas_v6:[275,300,330,345,350,410,424,430],
mas_nettuno:[330,490,530,550,621,630],
aston_v8:[503,510,528,535,550,585,635,656,665,675,680,707],
aston_v12o:[420,455,470,477,510,517,565,573,600,639,715,725,760,770,835],
rr_v12:[326,338,405,412,449,453,460,563,571,585,591,600,624,632,663,675],
bug_w16:[1001,1200,1500,1578,1600],
pag_v12:[555,602,678,730,740,760,791,802,829,864],
koe_v8:[806,947,960,1160,1280,1360,1600],
rimac_ev:[1224,1408,1888,1914],
bentley_w12:[507,528,560,590,608,626,635,650,659],
mcl_v8:[540,542,570,600,620,625,650,666,675,680,710,720,750,765,800,916],
lotus_rover:[118,120,135,143,156,160,177,190,192],
lotus_toy:[111,120,134,136,156,163,179,189,192,217,220,243,246,257],
lotus_v6:[280,306,345,350,364,400,406,410,416,430],
lotus_ev:[603,612,675,905,918],
morgan_eng:[82,110,150,180,255,258,340,367],
cat_sigma:[84,125,135,140,152,170,180,210,213,237,272,310],
tvr_s6:[350,380,400,406,440],
wies_bmw:[343,360,367,507,555],
donk_audi:[245,270,340,380,400,415,435],
ktm_20t:[240,286,300,340,500,600],
dmc_prv:[130,132,136,150,153,160,170,192,200,281],
iveco_d:[106,116,126,136,146,150,156,170,176,180,205,207],
xiaomi_ev:[299,673,1548],
ev_early_vag:[82,83,115,136],
honda_typer_x:[306,310,320,329]
};
for (const k in STEPS) { if (ENGINES[k]) ENGINES[k].steps = STEPS[k]; }

/* Fenêtre de plausibilité des paliers pour un modèle donné */
function powerStepsFor(model, eng) {
  const fam = ENGINES[eng.ref];
  const same = model.eng.filter(x => x.ref === eng.ref).map(x => x.p);
  const lo = Math.min(...same) * 0.62, hi = Math.max(...same) * 1.45;
  const steps = (fam.steps || []).filter(p => p >= lo && p <= hi);
  if (!steps.includes(eng.p)) steps.push(eng.p);
  return steps.sort((a, b) => a - b);
}
function countMotorisations() {
  let n = 0;
  for (const b of BRANDS) for (const m of b.models) {
    const seen = new Set();
    for (const e of m.eng) for (const p of powerStepsFor(m, e)) seen.add(e.ref + ':' + p);
    n += seen.size;
  }
  return n;
}

/* ============================================================
   v5 — MARQUES SUPPLÉMENTAIRES, CLASSIQUES, CARROSSERIES RÉELLES
   ============================================================ */
Object.assign(ENGINES, {
  gwm_phev:{label:"2.0T PHEV (GWM/Wey)",fuel:"Hybride",conso:5.6,rel:62,issues:[
    {t:"Marque récente en Europe : réseau et revente incertains",sev:"warn"}],steps:[367,476]}
});
Br("Simca","simca",1,[
M("1000 (collection)","simca 1000","c",1961,1978,7000,"classic_fr:40",{floor:1.2}),
M("1100 (collection)","simca 1100","k",1967,1982,6500,"classic_fr:50",{floor:1}),
M("Aronde (collection)","aronde","b",1951,1964,9000,"classic_fr:45",{floor:1.2})
]);
Br("Talbot","talbot",1,[
M("Samba","samba","c",1981,1986,6000,"psa_tu:50",{floor:.9}),
M("Horizon","horizon","k",1978,1986,6500,"classic_fr:59",{floor:.8}),
M("Tagora","tagora","b",1980,1983,12000,"dmc_prv:166",{floor:.8})
]);
Br("Matra","matra",2,[
M("Bagheera (collection)","bagheera","p",1973,1980,15000,"classic_fr:84",{floor:1.2}),
M("Murena (collection)","murena","p",1980,1983,18000,"classic_fr:118",{floor:1.3}),
M("Rancho (collection)","rancho","s",1977,1984,10000,"classic_fr:80",{floor:1.2})
]);
Br("Austin","austin",1,[
M("Metro","metro","c",1980,1990,5500,"rover_k:63",{floor:.7}),
M("Montego/Maestro","montego,maestro","k",1983,1994,7000,"rover_k:103",{floor:.6}),
M("Healey (collection)","austin healey,healey","p",1953,1967,45000,"classic_uk:150",{floor:1.8})
]);
Br("Autobianchi","autobianchi",1,[
M("A112 (collection)","a112","c",1969,1986,7500,"fiat_fire:70",{floor:1.3})
]);
Br("Datsun","datsun",1,[
M("240Z/260Z (collection)","240z,260z,fairlady","p",1969,1978,40000,"classic_uk:150",{floor:1.8}),
M("Cherry/Sunny (collection)","cherry","c",1970,1986,5000,"nis_hr16:75",{floor:.9})
]);
Br("Mobilize","mobilize",1,[
M("Duo","duo,mobilize duo","e",2024,2026,10000,"micro_ev:17:a"),
M("Bento","bento","e",2024,2026,11000,"micro_ev:17:a")
]);
Br("Maxus","maxus,ldv",1,[
M("eDeliver 3/9","edeliver","e",2021,2026,45000,"mg_ev:204:a"),
M("T90 EV","t90","e",2022,2026,40000,"mg_ev:177:a")
]);
Br("Wey","wey,gwm wey",1,[
M("Coffee 01","coffee 01,coffee01","s",2022,2025,50000,"gwm_phev:476:a:dsg_wet")
]);
Br("Chery","chery tiggo",1,[
M("Tiggo 7/8","tiggo","s",2025,2026,32000,"chery_t:204:a:dsg_wet|lynk_phev:279:a")
]);
Br("Buick","buick",2,[
M("Riviera (collection)","riviera","x",1963,1973,30000,"gm_ls:325:a:bva_old",{floor:1.2})
]);
Br("Pontiac","pontiac",2,[
M("Firebird/Trans Am (collection)","firebird,trans am","p",1967,2002,35000,"gm_ls:330:ma:bva_old",{floor:1.2}),
M("GTO (collection)","pontiac gto","p",1964,1974,45000,"gm_ls:355",{floor:1.5})
]);

/* --- Classiques et oubliés (marché FR) --- */
(function(){
  const find = (n) => BRANDS.find(b => b.name === n);
  find("Peugeot").models.push(
    M("305/309","305,309","k",1977,1993,8000,"psa_tu:65",{floor:.6}),
    M("505 (classique)","505","b",1979,1992,13000,"classic_fr:96",{floor:.9}),
    M("J5/J7 (classique)","j5,j7","s",1965,1994,12000,"classic_fr:75",{floor:.8}),
    M("e-308","e-308","e",2023,2026,43000,"ev_psa:156:a")
  );
  find("Citroën").models.push(
    M("BX","bx","k",1982,1994,7500,"psa_tu:90",{floor:.7}),
    M("GS/GSA (collection)","gsa,citroen gs","k",1970,1986,8000,"classic_fr:65",{floor:1}),
    M("Traction (collection)","traction","b",1934,1957,22000,"classic_fr:60",{floor:1.5}),
    M("C25 (classique)","c25","s",1981,1994,10000,"classic_fr:75",{floor:.8}),
    M("C3 Pluriel","pluriel","c",2003,2010,13000,"psa_tu:75|psa_hdi16:70")
  );
  find("Renault").models.push(
    M("R9/R11","r9,r11","k",1981,1989,6500,"classic_fr:60",{floor:.6}),
    M("R19","r19","k",1988,1997,8000,"ren_k4m:80",{floor:.5}),
    M("Fuego (collection)","fuego","p",1980,1986,10000,"classic_fr:110",{floor:1}),
    M("Alpine A310/GTA — voir Alpine","gta renault","p",1971,1991,38000,"dmc_prv:160",{floor:1.1})
  );
  find("Ford").models.push(
    M("Puma (1997)","puma 1.7","p",1997,2002,12000,"ford_duratec:125",{floor:.8}),
    M("Cougar/Probe","cougar,probe","p",1994,2002,15000,"ford_duratec:145",{floor:.6}),
    M("Capri (classique)","ford capri","p",1969,1986,18000,"classic_uk:105",{floor:1.2})
  );
  find("Opel").models.push(
    M("Omega/Senator","omega,senator","b",1986,2003,16000,"gm_ecotec:136:a:bva_old",{floor:.5}),
    M("Calibra","calibra","p",1990,1997,15000,"gm_ecotec:150",{floor:.8})
  );
  find("BMW").models.push(
    M("Série 6 (E24) (collection)","e24,633csi","x",1976,1989,35000,"bmw_n52:218",{floor:1.2}),
    M("Série 8 (E31) (collection)","e31,850ci","x",1989,1999,45000,"rr_v12:300:a:bva_old",{floor:1.3})
  );
  find("Mercedes-Benz").models.push(
    M("R129 SL (classique)","r129,500sl","p",1989,2001,30000,"mb_m113:326:a:bva_old",{floor:1}),
    M("W126/W140 (classique)","w126,w140","b",1979,1998,18000,"mb_m113:279:a:bva_old",{floor:.9})
  );
  find("Audi").models.push(M("V8/A8 D2 (classique)","audi v8,a8 d2","b",1988,2002,15000,"vag_18t:245:a:bva_old",{floor:.6}));
  find("Fiat").models.push(
    M("Tipo/Tempra (90s)","tipo 90,tempra","k",1988,1996,7000,"fiat_fire:75",{floor:.5}),
    M("Marea","marea","b",1996,2002,9000,"fiat_jtd:105",{floor:.5}),
    M("Ulysse","ulysse","s",1994,2010,20000,"psa_ew:123|psa_22hdi:128"),
    M("X1/9 (collection)","x1/9,x19","p",1972,1989,12000,"fiat_fire:85",{floor:1.2})
  );
  find("Lancia").models.push(
    M("Dedra/Kappa","dedra,kappa","b",1989,2000,9000,"fiat_fire:103",{floor:.5}),
    M("Stratos (collection)","stratos","x",1973,1978,400000,"dmc_prv:190",{floor:3})
  );
  find("Alfa Romeo").models.push(
    M("33/90 (classique)","alfa 33","k",1983,1995,6500,"subaru_ej:105",{floor:.7}),
    M("155","155","b",1992,1998,9000,"fiat_fire:126",{floor:.7})
  );
  find("Toyota").models.push(
    M("4Runner/Hilux Surf","4runner","s",1990,2005,22000,"toy_d4d:125",{floor:.8}),
    M("Paseo/Cynos","paseo","p",1991,1999,7500,"toy_atmo:90",{floor:.5})
  );
  find("Nissan").models.push(
    M("300ZX (collection)","300zx","p",1990,1996,25000,"nis_vq:283",{floor:1.2}),
    M("Bluebird/Primera (90s)","bluebird","b",1990,1996,7000,"nis_hr16:102",{floor:.5})
  );
  find("Honda").models.push(M("CRX (collection)","crx","p",1987,1997,14000,"honda_atmo:150",{floor:1.2}));
  find("Mazda").models.push(M("MX-3/MX-6","mx-3,mx3,mx-6","p",1991,1998,8000,"mazda_mzr:133",{floor:.7}));
  find("Volkswagen").models.push(M("Scirocco I/II (classique)","scirocco 1,scirocco 2","p",1974,1992,14000,"vag_mpi:112",{floor:1}));
  find("Porsche").models.push(M("356 (collection)","356","p",1950,1965,90000,"classic_fr:75",{floor:2.5}));
  find("Jaguar").models.push(M("Mark 2 (collection)","mark 2,mk2","b",1959,1967,45000,"classic_uk:220",{floor:1.6}));
})();

/* --- Carrosseries réelles (dérivées des modèles existants) --- */
const BODY_NP = { "SW":900,"Break":900,"Estate":900,"Tourer":900,"Touring":1200,"Avant":1200,"Combi":800,"ST":800,"Sports Tourer":800,"SW/Break":900,"Touring Sports":900,"Shooting Brake":1500,"Sportback":800,"Gran Coupé":2500,"Fastback":500,"Coupé":0,"Cabriolet":0,"CC":0,"Roadster":0,"Sport Turismo":2500,"Cross Turismo":2500,"Cabrio":0,"C":1500,"Grand":1200,"Van/Tourer":500 };
const BODY_FACTOR = { "Coupé":1.12,"Cabriolet":1.22,"CC":1.18,"Roadster":1.2,"Cabrio":1.18,"C":1.12 };
const BODY_VARIANTS = [
["Peugeot","308 II (2013–2021)",["SW"]],["Peugeot","308 III (2021+)",["SW"]],["Peugeot","508 I",["SW"]],["Peugeot","508 II",["SW"]],
["Peugeot","206","CC" ],["Peugeot","207",["CC","SW"]],["Peugeot","307",["CC","SW"]],["Peugeot","308 (2007–2013)",["CC","SW"]],["Peugeot","406",["Coupé","Break"]],["Peugeot","407",["Coupé","SW"]],
["Citroën","C5 I/II",["Tourer"]],["Citroën","Xsara",["Break","Coupé"]],["Citroën","ZX",["Break"]],
["Renault","Clio III",["Estate"]],["Renault","Clio IV",["Estate"]],["Renault","Mégane II",["CC","Estate"]],["Renault","Mégane III",["Coupé","CC","Estate"]],["Renault","Mégane IV",["Estate"]],["Renault","Laguna II/III",["Estate","Coupé"]],["Renault","Talisman",["Estate"]],
["Dacia","Logan",["MCV Break"]],
["Volkswagen","Golf 4",["Break","Cabriolet"]],["Volkswagen","Golf 5",["Break"]],["Volkswagen","Golf 6",["Break","Cabriolet"]],["Volkswagen","Golf 7",["SW"]],["Volkswagen","Golf 8",["SW"]],["Volkswagen","Passat B5/B6/B7",["SW"]],["Volkswagen","Passat B8",["SW"]],["Volkswagen","T-Roc",["Cabriolet"]],["Volkswagen","Beetle/New Beetle",["Cabriolet"]],["Volkswagen","Arteon",["Shooting Brake"]],["Volkswagen","Polo VI (2017+)",["GTI? — Sedan"]],
["Audi","A3 (8P)",["Cabriolet","Sportback"]],["Audi","A3 (8V)",["Cabriolet","Sportback"]],["Audi","A4 (B6/B7)",["Avant","Cabriolet"]],["Audi","A4 (B8)",["Avant"]],["Audi","A4 (B9)",["Avant"]],["Audi","A5",["Sportback","Cabriolet"]],["Audi","A6 (C6/C7)",["Avant"]],["Audi","A6 (C8)",["Avant"]],["Audi","TT (8N)",["Roadster"]],["Audi","TT (8J)",["Roadster"]],["Audi","TT (8S)",["Roadster"]],
["BMW","Série 3 (E46)",["Touring","Coupé","Cabriolet"]],["BMW","Série 3 (E90)",["Touring","Coupé","Cabriolet"]],["BMW","Série 3 (F30)",["Touring","GT"]],["BMW","Série 3 (G20)",["Touring"]],["BMW","Série 5 (E39)",["Touring"]],["BMW","Série 5 (E60)",["Touring"]],["BMW","Série 5 (F10)",["Touring"]],["BMW","Série 5 (G30)",["Touring"]],["BMW","Série 4",["Gran Coupé","Cabriolet"]],["BMW","M3/M4 (G80/G82)",["Touring"]],
["Mercedes-Benz","Classe C (W202/W203)",["Break","Coupé"]],["Mercedes-Benz","Classe C (W204)",["Break","Coupé"]],["Mercedes-Benz","Classe C (W205)",["Break","Coupé","Cabriolet"]],["Mercedes-Benz","Classe E (W210/W211)",["Break"]],["Mercedes-Benz","Classe E (W212)",["Break","Coupé","Cabriolet"]],["Mercedes-Benz","Classe E (W213)",["Break","Coupé","Cabriolet"]],["Mercedes-Benz","CLA",["Shooting Brake"]],
["Seat","Leon III/IV",["ST"]],["Seat","Ibiza III/IV",["ST"]],
["Škoda","Octavia I/II",["Combi"]],["Škoda","Octavia III/IV",["Combi"]],["Škoda","Superb",["Combi"]],["Škoda","Fabia III/IV",["Combi"]],
["Ford","Focus I/II",["SW","CC"]],["Ford","Focus III",["SW"]],["Ford","Focus IV",["SW"]],["Ford","Mondeo",["SW"]],["Ford","Fiesta VI (2008–2017)",["Van/Tourer"]],
["Opel","Astra H/J",["Sports Tourer","GTC"]],["Opel","Astra K",["Sports Tourer"]],["Opel","Astra L",["Sports Tourer"]],["Opel","Insignia",["Sports Tourer"]],["Opel","Vectra/Signum",["Break"]],
["Toyota","Corolla XII",["Touring Sports"]],["Toyota","Avensis",["Touring Sports"]],
["Honda","Civic X",["Break? — Berline"]],["Honda","Accord",["Tourer"]],
["Mazda","Mazda6",["Wagon"]],
["Hyundai","i30",["SW","Fastback"]],
["Kia","Ceed",["SW"]],["Kia","Optima",["SW"]],
["Alfa Romeo","156/159",["Sportwagon"]],["Alfa Romeo","Giulietta",["Veloce? — Sprint"]],
["Volvo","S60/V60",["Cross Country"]],["Volvo","S90/V90",["Cross Country"]],
["Mini","Cooper (R56)",["Cabrio","Clubman? — SD"]],["Mini","Cooper (F56)",["Cabrio","5 portes"]],
["Fiat","500 (2007–2024)",["C"]],["Fiat","Punto/Grande Punto",["Evo"]],
["DS Automobiles","DS3 (2010–2019)",["Cabrio"]],
["Porsche","Panamera",["Sport Turismo"]],["Porsche","Taycan",["Cross Turismo"]],["Porsche","911 (991)",["Cabriolet","Targa"]],["Porsche","911 (992)",["Cabriolet","Targa"]],
["Jaguar","XF",["Sportbrake"]],
["Smart","Fortwo (453)",["Cabrio"]],
["Nissan","Micra K14",["N-Sport? — IG-T"]],
["Mercedes-Benz","GLK/GLC",["Coupé"]],["BMW","X4",["M40i? — xDrive"]],
["Peugeot","2008 II",["GT? — Allure"]]
];
(function(){
  for (const [bn, mn, bodies] of BODY_VARIANTS) {
    const b = BRANDS.find(x => x.name === bn); if (!b) continue;
    const m = b.models.find(x => x.name === mn); if (!m) continue;
    const list = Array.isArray(bodies) ? bodies : [bodies];
    for (const v of list) {
      if (/\?/.test(v)) continue; /* garde-fou : variantes non confirmées ignorées */
      const factor = BODY_FACTOR[v] || 1;
      const add = BODY_NP[v] != null ? BODY_NP[v] : 800;
      b.models.push(Object.assign({}, m, {
        name: m.name + ' ' + v,
        alias: m.alias.map(a => a + ' ' + v.toLowerCase()).concat(m.alias.map(a => v.toLowerCase() + ' ' + a)),
        np: Math.round(m.np * factor) + add
      }));
    }
  }
})();
