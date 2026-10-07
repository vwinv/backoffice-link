<script setup lang="ts">
useSeoMeta({
  title: 'Politique de confidentialité | DropOne',
  description:
    'Politique de confidentialité de DropOne - comment MEGA - SN collecte, utilise et protège vos données personnelles.',
})

const sections = [
  {
    title: '1. Introduction',
    paragraphs: [
      'La présente Politique de confidentialité décrit la manière dont MEGA - SN (« nous », « notre » ou « nos ») collecte, utilise, stocke et protège les données personnelles des utilisateurs de l’application DropOne.',
      'En utilisant DropOne, vous acceptez les pratiques décrites dans cette politique.',
    ],
  },
  {
    title: '2. Responsable du traitement',
    paragraphs: [
      'MEGA - SN',
      'Site web : https://mega-sn.com',
      'E-mail : contact@mega-sn.com',
    ],
  },
  {
    title: '3. Données collectées',
    paragraphs: [
      'Selon votre utilisation de l’application, nous pouvons collecter les informations suivantes :',
    ],
    subsections: [
      {
        title: 'Informations de compte',
        bullets: [
          'Nom et prénom',
          'Adresse e-mail',
          'Numéro de téléphone',
          'Photo de profil',
        ],
      },
      {
        title: 'Informations professionnelles',
        bullets: [
          'Fonction ou poste',
          'Nom de l’entreprise',
          'Informations de l’équipe (pour les comptes Entreprise)',
        ],
      },
      {
        title: 'Informations de profil (facultatives)',
        bullets: [
          'Réseaux sociaux',
          // 'Portfolio',
          'Site web',
          'Informations de présentation',
        ],
      },
      {
        title: 'Authentification',
        paragraphs: [
          'Lorsque vous choisissez de vous connecter avec Google ou Apple, nous recevons uniquement les informations nécessaires à votre authentification conformément aux autorisations accordées.',
        ],
      },
      {
        title: 'Notifications',
        paragraphs: [
          'Nous utilisons les notifications push afin de vous informer notamment des nouvelles demandes, des mises à jour et des événements liés à votre compte.',
          'Vous pouvez désactiver ces notifications à tout moment depuis les paramètres de votre appareil.',
        ],
      },
      {
        title: 'Paiements',
        paragraphs: [
          'Pour les abonnements et achats, les paiements peuvent être réalisés via des prestataires tiers tels que Wave et Orange Money.',
          'Les informations bancaires ou de paiement ne sont jamais stockées par DropOne.',
        ],
      },
    ],
  },
  {
    title: '4. Utilisation des données',
    paragraphs: ['Vos données sont utilisées afin de :'],
    bullets: [
      'créer et gérer votre compte ;',
      'générer votre carte de visite numérique ;',
      'partager votre profil via QR Code, NFC ou lien ;',
      'gérer les équipes et entreprises ;',
      'permettre l’authentification sécurisée ;',
      'envoyer des notifications importantes ;',
      'traiter les abonnements et paiements ;',
      'améliorer les performances et la sécurité de l’application ;',
      'fournir une assistance utilisateur.',
    ],
  },
  {
    title: '5. Partage des données',
    paragraphs: [
      'Nous ne vendons jamais vos données personnelles.',
      'Vos informations peuvent uniquement être partagées :',
    ],
    bullets: [
      'avec les prestataires techniques nécessaires au fonctionnement de l’application ;',
      'avec les services d’authentification (Google ou Apple) lorsque vous utilisez ces modes de connexion ;',
      'avec les prestataires de paiement (Wave ou Orange Money) lors des transactions ;',
      'lorsque la loi l’exige.',
    ],
  },
  {
    title: '6. Sécurité',
    paragraphs: [
      'Nous mettons en œuvre des mesures techniques et organisationnelles destinées à protéger vos données contre tout accès non autorisé, toute perte, modification ou divulgation.',
      'Cependant, aucun système informatique ne peut garantir une sécurité absolue.',
    ],
  },
  {
    title: '7. Conservation des données',
    paragraphs: [
      'Vos données sont conservées aussi longtemps que votre compte est actif ou aussi longtemps que nécessaire pour fournir les services proposés.',
      'Vous pouvez demander la suppression de votre compte à tout moment.',
    ],
  },
  {
    title: '8. Vos droits',
    paragraphs: ['Vous pouvez à tout moment :'],
    bullets: [
      'consulter vos informations ;',
      'modifier votre profil ;',
      'demander la suppression de votre compte ;',
      'demander la suppression de vos données personnelles ;',
      'retirer votre consentement lorsque celui-ci est applicable.',
    ],
    closing: ['Pour toute demande, contactez-nous à : contact@mega-sn.com'],
  },
  {
    title: '9. Services tiers',
    paragraphs: ['DropOne peut utiliser les services suivants :'],
    bullets: [
      'Google Sign-In',
      'Sign in with Apple',
      'Firebase Cloud Messaging (notifications push)',
      'Wave',
      'Orange Money',
    ],
    closing: [
      'Ces services disposent de leurs propres politiques de confidentialité.',
    ],
  },
  {
    title: '10. Protection des enfants',
    paragraphs: [
      'DropOne n’est pas destiné aux enfants de moins de 13 ans.',
      'Nous ne collectons pas sciemment de données personnelles concernant des mineurs sans autorisation parentale lorsque celle-ci est requise.',
    ],
  },
  {
    title: '11. Modifications',
    paragraphs: [
      'Nous pouvons modifier la présente Politique de confidentialité afin de tenir compte des évolutions légales, techniques ou fonctionnelles.',
      'La date de dernière mise à jour figurera toujours en haut de cette page.',
    ],
  },
  {
    title: '12. Contact',
    paragraphs: [
      'Pour toute question relative à cette Politique de confidentialité ou à vos données personnelles, vous pouvez nous contacter :',
      'MEGA - SN',
      'Site : https://mega-sn.com',
      'E-mail : contact@mega-sn.com',
    ],
  },
] as const

function linkify(text: string) {
  if (text.startsWith('Site web : https://')) {
    return { prefix: 'Site web : ', href: 'https://mega-sn.com', label: 'https://mega-sn.com' }
  }
  if (text.startsWith('Site : https://')) {
    return { prefix: 'Site : ', href: 'https://mega-sn.com', label: 'https://mega-sn.com' }
  }
  if (text.startsWith('E-mail : ')) {
    return { prefix: 'E-mail : ', href: 'mailto:contact@mega-sn.com', label: 'contact@mega-sn.com' }
  }
  if (text.includes('contact@mega-sn.com') && text.startsWith('Pour toute demande')) {
    return {
      prefix: 'Pour toute demande, contactez-nous à : ',
      href: 'mailto:contact@mega-sn.com',
      label: 'contact@mega-sn.com',
    }
  }
  return null
}
</script>

<template>
  <div class="policy-page">
    <header class="top">
      <div class="top-inner">
        <NuxtLink to="/" class="brand" aria-label="DropOne">
          <img src="/images/icone.png" alt="DropOne" width="48" height="48">
          <span>DropOne</span>
        </NuxtLink>
        <NuxtLink to="/" class="back">← Accueil</NuxtLink>
      </div>
    </header>

    <main class="main">
      <article class="doc">
        <p class="eyebrow">Légal</p>
        <h1>Politique de confidentialité</h1>
        <p class="updated">Dernière mise à jour : 21 juillet 2026</p>

        <section
          v-for="section in sections"
          :key="section.title"
          class="section"
        >
          <h2>{{ section.title }}</h2>

          <p
            v-for="(paragraph, index) in section.paragraphs"
            :key="`${section.title}-p-${index}`"
          >
            <template v-if="linkify(paragraph)">
              {{ linkify(paragraph)!.prefix }}
              <a :href="linkify(paragraph)!.href">{{ linkify(paragraph)!.label }}</a>
            </template>
            <template v-else>
              {{ paragraph }}
            </template>
          </p>

          <ul v-if="section.bullets?.length">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>

          <div
            v-for="sub in section.subsections || []"
            :key="sub.title"
            class="subsection"
          >
            <h3>{{ sub.title }}</h3>
            <p
              v-for="(paragraph, index) in sub.paragraphs || []"
              :key="`${sub.title}-p-${index}`"
            >
              {{ paragraph }}
            </p>
            <ul v-if="sub.bullets?.length">
              <li v-for="bullet in sub.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
          </div>

          <p
            v-for="(paragraph, index) in section.closing || []"
            :key="`${section.title}-c-${index}`"
          >
            <template v-if="linkify(paragraph)">
              {{ linkify(paragraph)!.prefix }}
              <a :href="linkify(paragraph)!.href">{{ linkify(paragraph)!.label }}</a>
            </template>
            <template v-else>
              {{ paragraph }}
            </template>
          </p>
        </section>
      </article>
    </main>
  </div>
</template>

<style scoped>
.policy-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 40% at 0% 0%, var(--do-blue-glow), transparent 55%),
    var(--do-surface-soft);
  color: var(--do-ink);
  font-family: var(--do-font);
}

.top {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  background: rgba(244, 246, 251, 0.88);
  border-bottom: 1px solid var(--do-line);
}

.top-inner {
  width: min(100% - 32px, 760px);
  margin-inline: auto;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.brand img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
}

.back {
  color: var(--do-blue);
  font-weight: 700;
  font-size: 0.92rem;
}

.main {
  padding: 32px 16px 64px;
}

.doc {
  width: min(100%, 760px);
  margin-inline: auto;
  padding: 32px 28px;
  border-radius: var(--do-radius-lg);
  background: var(--do-surface);
  border: 1.5px solid var(--do-line);
  box-shadow: var(--do-shadow);
}

.eyebrow {
  margin: 0 0 10px;
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--do-blue-soft);
  color: var(--do-blue);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 8px;
  font-size: clamp(1.7rem, 3vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.updated {
  margin: 0 0 28px;
  color: var(--do-muted);
  font-weight: 600;
  font-size: 0.92rem;
}

.section {
  padding-top: 22px;
  margin-top: 22px;
  border-top: 1px solid var(--do-line);
}

.section:first-of-type {
  border-top: 0;
  margin-top: 0;
  padding-top: 0;
}

h2 {
  margin: 0 0 12px;
  font-size: 1.15rem;
  font-weight: 800;
}

h3 {
  margin: 16px 0 8px;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--do-blue);
}

p {
  margin: 0 0 10px;
  color: var(--do-muted);
  line-height: 1.65;
}

ul {
  margin: 0 0 12px;
  padding-left: 1.2rem;
  color: var(--do-muted);
  line-height: 1.6;
}

li {
  margin-bottom: 6px;
}

a {
  color: var(--do-blue);
  font-weight: 700;
  word-break: break-word;
}

.subsection {
  margin-top: 8px;
}

@media (max-width: 640px) {
  .doc {
    padding: 24px 18px;
    border-radius: var(--do-radius);
  }
}
</style>
