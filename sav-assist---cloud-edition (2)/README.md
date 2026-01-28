# SAV Assist - Cloud Edition 🛠️

Application web collaborative pour les techniciens SAV (Chauffage, Ventilation, Climatisation). Permet de transcrire les appels, générer des diagnostics par IA et partager l'historique au sein d'une équipe.

## ✨ Fonctionnalités
- **Transcription en temps réel** : Utilisez le microphone pour dicter vos notes techniques.
- **Diagnostic IA** : Analyse profonde via Gemini 3 Pro (Thinking) pour les pannes complexes.
- **Synchronisation d'Équipe** : Partagez votre historique avec vos collègues via un système de "Sync Codes".
- **Statistiques** : Suivez le volume d'appels et la satisfaction client.

## 🚀 Installation & Déploiement

### 1. Cloner le projet
```bash
git clone https://github.com/VOTRE_NOM/sav-assist.git
cd sav-assist
```

### 2. Configuration API
L'application nécessite une clé **Google Gemini API**. 
1. Obtenez une clé sur [Google AI Studio](https://aistudio.google.com/).
2. Si vous déployez sur **Vercel** ou **Netlify**, ajoutez une variable d'environnement nommée `API_KEY`.

## 🛠️ Technologies
- **React** (via ESM.sh)
- **Tailwind CSS** (Design)
- **Google GenAI SDK** (Gemini 2.5/3)
- **Lucide React** (Icônes)

## 🔒 Sécurité
Les données sont stockées localement dans le navigateur (`localStorage`). La synchronisation se fait manuellement par échange de codes cryptés (base64) pour garantir la confidentialité des données clients.
