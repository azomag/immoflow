import type { Locale } from "@/lib/i18n";

type PhraseMap = Record<string, string>;

export const localeOptions: Record<
  Locale,
  { short: string; label: string; nativeLabel: string; flag: string }
> = {
  fr: { short: "FR", label: "French", nativeLabel: "Français", flag: "/language/fr.svg" },
  en: { short: "EN", label: "English", nativeLabel: "English", flag: "/language/en.svg" },
  ar: { short: "AR", label: "Arabic", nativeLabel: "العربية", flag: "/language/ar.svg" },
};

const fr: PhraseMap = {
  "+ live inventory": "+ inventaire en direct",
  "84% of resources used": "84 % des ressources utilisees",
  "A signature validates this rental contract in your tenant account.":
    "Une signature valide ce contrat de location dans votre compte locataire.",
  "Access Level": "Niveau d'acces",
  "Access contracts, residence details, and receipts.":
    "Accedez aux contrats, details du logement et recus.",
  "Account Details": "Details du compte",
  "Account awaiting approval": "Compte en attente d'approbation",
  "Action": "Action",
  "Action failed": "Action echouee",
  "Actions": "Actions",
  "Active": "Actif",
  "active": "actif",
  "Active Contract": "Contrat actif",
  "Active Property": "Bien actif",
  "Add photos": "Ajouter des photos",
  "Add Property": "Ajouter un bien",
  "Add the commune": "Ajouter la commune",
  "Add the commune information and it will be saved.":
    "Ajoutez les informations de la commune, elles seront enregistrees.",
  "Address": "Adresse",
  "Admin": "Admin",
  "Administration": "Administration",
  "Admins": "Admins",
  "Admins sign in here. Super admin creates admin accounts.":
    "Les admins se connectent ici. Le super admin cree les comptes admin.",
  "Agent": "Agent",
  "Agent Assignment": "Affectation de l'agent",
  "Agent Code": "Code agent",
  "Agents": "Agents",
  "Alert me 30 days before a lease expires.":
    "M'alerter 30 jours avant l'expiration d'un bail.",
  "All": "Tous",
  "All receipts and rent operations tied to your active account.":
    "Tous les recus et operations de loyer lies a votre compte actif.",
  "Already have an account?": "Vous avez deja un compte ?",
  "Already registered?": "Deja inscrit ?",
  "Amount": "Montant",
  "Approve payment": "Approuver le paiement",
  "Approve payment?": "Approuver le paiement ?",
  "Area": "Surface",
  "Area (m2)": "Surface (m2)",
  "Area (m²)": "Surface (m²)",
  "Assigned Agent": "Agent affecte",
  "Attach tenant to this house": "Associer un locataire a ce logement",
  "Authentication failed.": "Authentification echouee.",
  "Available": "Disponible",
  "available": "disponible",
  "awaiting_tenant_approval": "validation locataire en attente",
  "Back": "Retour",
  "Back to login": "Retour a la connexion",
  "Bank Transfer": "Virement bancaire",
  "Bank Transfer Details": "Details du virement",
  "Bathrooms": "Salles de bain",
  "Bedrooms": "Chambres",
  "Birth Date": "Date de naissance",
  "Brand": "Marque",
  "Cancel": "Annuler",
  "Cancel Google session": "Annuler la session Google",
  "Cash": "Especes",
  "Cash Receipt Note": "Note du recu en especes",
  "Cash receipt note: receiver, place, receipt number...":
    "Note du recu en especes : recepteur, lieu, numero de recu...",
  "Change Password": "Changer le mot de passe",
  "Chats": "Discussions",
  "Check": "Cheque",
  "Check the property": "Verifier le bien",
  "Choose Agent or Locataire to create an account.":
    "Choisissez Agent ou Locataire pour creer un compte.",
  "Choose a contact before sending.": "Choisissez un contact avant l'envoi.",
  "Choose account type": "Choisir le type de compte",
  "Choose one type from the platform list.":
    "Choisissez un type dans la liste de la plateforme.",
  "Choose what events you want to be notified about.":
    "Choisissez les evenements pour lesquels vous voulez etre notifie.",
  "Choose your workspace.": "Choisissez votre espace de travail.",
  "Click to upload photos": "Cliquez pour ajouter des photos",
  "Click to upload property photos": "Cliquez pour ajouter les photos du bien",
  "Close sidebar": "Fermer le menu lateral",
  "Collected": "Encaisse",
  "Collection Rate": "Taux d'encaissement",
  "Collections": "Encaissements",
  "Commune / Area": "Commune / Zone",
  "Commune name": "Nom de la commune",
  "Company Name": "Nom de l'entreprise",
  "Configured housing categories.": "Categories de logements configurees.",
  "Confirm New Password": "Confirmer le nouveau mot de passe",
  "Confirm Password": "Confirmer le mot de passe",
  "Contact": "Contact",
  "Continue": "Continuer",
  "Continue with Google": "Continuer avec Google",
  "Contract": "Contrat",
  "Contract Details": "Details du contrat",
  "Contract Expirations": "Expirations de contrats",
  "Contract Information": "Informations du contrat",
  "Contract Opened": "Contrat ouvert",
  "Contract Sent": "Contrat envoye",
  "Contract Signature": "Signature du contrat",
  "Contract Signed": "Contrat signe",
  "Contract created.": "Contrat cree.",
  "Contract deleted.": "Contrat supprime.",
  "Contract details": "Details du contrat",
  "Contract documents": "Documents du contrat",
  "Contract end": "Fin du contrat",
  "Contract ref": "Ref. contrat",
  "Contract signed": "Contrat signe",
  "Contract signed.": "Contrat signe.",
  "Contract start": "Debut du contrat",
  "Contract summary": "Resume du contrat",
  "Contract updated.": "Contrat mis a jour.",
  "Contracts": "Contrats",
  "Contracts with payments cannot be deleted.":
    "Les contrats avec paiements ne peuvent pas etre supprimes.",
  "Control access for agents, admins, and tenants.":
    "Controlez les acces des agents, admins et locataires.",
  "Conversation": "Conversation",
  "Could not complete sign-in.": "Impossible de terminer la connexion.",
  "Could not prepare the avatar image.":
    "Impossible de preparer l'image du profil.",
  "Could not prepare the selected images.":
    "Impossible de preparer les images selectionnees.",
  "Create Contract": "Creer un contrat",
  "Create Property": "Creer un bien",
  "Create account": "Creer un compte",
  "Create account first": "Creer un compte d'abord",
  "Create listings with a guided flow.": "Creez des annonces avec un parcours guide.",
  "Create properties, contracts, and collect payments.":
    "Creez des biens, contrats et encaissez les paiements.",
  "Create property": "Creer un bien",
  "Create your agent profile.": "Creez votre profil agent.",
  "Create your tenant profile.": "Creez votre profil locataire.",
  "Creating...": "Creation...",
  "Creating…": "Creation...",
  "Credit Card": "Carte bancaire",
  "Current Password": "Mot de passe actuel",
  "Current Residence": "Residence actuelle",
  "Dashboard": "Tableau de bord",
  "Dashboard failed to load": "Le tableau de bord n'a pas pu charger",
  "Database Link": "Lien base de donnees",
  "Date": "Date",
  "Delete": "Supprimer",
  "Delete contract?": "Supprimer le contrat ?",
  "Delete notification": "Supprimer la notification",
  "Delete property?": "Supprimer le bien ?",
  "Describe the house": "Decrire le logement",
  "Description": "Description",
  "Directory of all locataires linked to your properties.":
    "Repertoire des locataires lies a vos biens.",
  "Distance to agency (km)": "Distance a l'agence (km)",
  "Documents": "Documents",
  "Draft": "Brouillon",
  "draft": "brouillon",
  "Draw your signature": "Dessiner votre signature",
  "Each property must have between 2 and 10 images.":
    "Chaque bien doit avoir entre 2 et 10 images.",
  "Edit Contract": "Modifier le contrat",
  "Edit Property": "Modifier le bien",
  "Electric": "Electrique",
  "Email": "Email",
  "Email Address": "Adresse email",
  "Email or Username": "Email ou identifiant",
  "End": "Fin",
  "End Date": "Date de fin",
  "Ends": "Fin",
  "Enterprise": "Entreprise",
  "Enter current address": "Saisir l'adresse actuelle",
  "Existing images": "Images existantes",
  "Expected Revenue": "Revenu prevu",
  "Expired": "Expire",
  "expired": "expire",
  "Failed to load dashboard.": "Echec du chargement du tableau de bord.",
  "Final confirmation": "Confirmation finale",
  "Finishing Google sign-in": "Finalisation de la connexion Google",
  "First Name": "Prenom",
  "First name and last name are required.": "Le prenom et le nom sont requis.",
  "Floor": "Etage",
  "Full Name": "Nom complet",
  "Get notified when a rent payment is recorded.":
    "Recevoir une notification lorsqu'un paiement de loyer est enregistre.",
  "Go back": "Retour",
  "Go to login": "Aller a la connexion",
  "Google sign-in is not enabled for this frontend session.":
    "La connexion Google n'est pas activee pour cette session frontend.",
  "Heating": "Chauffage",
  "House Images": "Images du logement",
  "House Information": "Informations du logement",
  "I understand": "Je comprends",
  "ID": "ID",
  "Images ready for upload.": "Images pretes pour l'envoi.",
  "ImmoFlow workspace": "Espace de travail ImmoFlow",
  "Immoflow Web": "Immoflow Web",
  "Included": "Inclus",
  "Initial Status": "Statut initial",
  "JPG, PNG up to 5MB": "JPG, PNG jusqu'a 5 Mo",
  "Keep property vacant": "Garder le bien vacant",
  "Landing page": "Page d'accueil",
  "Last Login": "Derniere connexion",
  "Last Payment": "Dernier paiement",
  "Last login": "Derniere connexion",
  "Last Name": "Nom",
  "Leave these blank if you only want to update profile information.":
    "Laissez ces champs vides si vous voulez seulement modifier le profil.",
  "Listed": "Publie",
  "listed": "publie",
  "Locataire": "Locataire",
  "Log out": "Deconnexion",
  "Maintenance": "Maintenance",
  "maintenance": "maintenance",
  "Manage your personal information and account security.":
    "Gerez vos informations personnelles et la securite du compte.",
  "Manage your platform preferences and configurations.":
    "Gerez les preferences et configurations de la plateforme.",
  "Manager": "Manager",
  "Mark as read": "Marquer comme lu",
  "Message could not be sent.": "Le message n'a pas pu etre envoye.",
  "Messages": "Messages",
  "Messages could not be loaded.": "Les messages n'ont pas pu etre charges.",
  "Method": "Methode",
  "Minimum 8 characters": "Minimum 8 caracteres",
  "Mode": "Mode",
  "Monthly Rent": "Loyer mensuel",
  "Monthly Rent (MAD)": "Loyer mensuel (MAD)",
  "My Contract": "Mon contrat",
  "My Profile": "Mon profil",
  "My Properties": "Mes biens",
  "N/A": "N/D",
  "Need a new account?": "Besoin d'un nouveau compte ?",
  "Needs tenant approval": "Validation locataire requise",
  "Never": "Jamais",
  "New Messages": "Nouveaux messages",
  "New Password": "Nouveau mot de passe",
  "New chat": "Nouvelle discussion",
  "New uploads": "Nouveaux fichiers",
  "News about product and feature updates.":
    "Actualites sur le produit et les nouvelles fonctionnalites.",
  "Next Due": "Prochaine echeance",
  "Next Event": "Prochain evenement",
  "Next Visit": "Prochaine visite",
  "Next step opens a signature pad. Draw your signature with your mouse, pen, or finger.":
    "L'etape suivante ouvre une zone de signature. Dessinez votre signature avec la souris, un stylet ou le doigt.",
  "No active property": "Aucun bien actif",
  "No active residence": "Aucune residence active",
  "No active tenant": "Aucun locataire actif",
  "No contacts found": "Aucun contact trouve",
  "No contract": "Aucun contrat",
  "No contract attached.": "Aucun contrat associe.",
  "No contract attached to this property.": "Aucun contrat associe a ce bien.",
  "No contract available.": "Aucun contrat disponible.",
  "No contract found for this property.": "Aucun contrat trouve pour ce bien.",
  "No contracts yet": "Aucun contrat pour le moment",
  "No conversations found": "Aucune conversation trouvee",
  "No description has been added for this property yet.":
    "Aucune description n'a encore ete ajoutee pour ce bien.",
  "No detailed description provided for this property.":
    "Aucune description detaillee fournie pour ce bien.",
  "No email available": "Aucun email disponible",
  "No image available": "Aucune image disponible",
  "No messages yet": "Aucun message pour le moment",
  "No notifications yet.": "Aucune notification pour le moment.",
  "No pending contract to sign.": "Aucun contrat en attente de signature.",
  "No phone": "Aucun telephone",
  "No property": "Aucun bien",
  "No property types configured.": "Aucun type de bien configure.",
  "None": "Aucun",
  "Not included": "Non inclus",
  "Not recorded": "Non enregistre",
  "Not selected": "Non selectionne",
  "Not set": "Non defini",
  "Notification Preferences": "Preferences de notification",
  "Notifications": "Notifications",
  "Occupied": "Occupe",
  "occupied": "occupe",
  "One global login for super admin, admins, agents, and locataires.":
    "Une connexion unique pour super admin, admins, agents et locataires.",
  "Open": "Ouvrir",
  "Open signature pad": "Ouvrir la zone de signature",
  "Organization Profile": "Profil de l'organisation",
  "Output": "Sortie",
  "Overdue": "En retard",
  "PDF invoice generated.": "Facture PDF generee.",
  "Parking": "Parking",
  "Partial": "Partiel",
  "partial": "partiel",
  "paid": "paye",
  "Password": "Mot de passe",
  "Password confirmation must match.": "La confirmation du mot de passe doit correspondre.",
  "Payment Confirmations": "Confirmations de paiement",
  "Payment Date": "Date de paiement",
  "Payment History": "Historique des paiements",
  "Payment Received": "Paiement recu",
  "Payment Recorded": "Paiement enregistre",
  "Payment approved.": "Paiement approuve.",
  "Payment recorded and sent to the tenant for approval.":
    "Paiement enregistre et envoye au locataire pour approbation.",
  "Payments": "Paiements",
  "Payments Summary": "Resume des paiements",
  "Pending": "En attente",
  "pending": "en attente",
  "Pending signature": "Signature en attente",
  "Personal Information": "Informations personnelles",
  "Phone": "Telephone",
  "Phone Number": "Numero de telephone",
  "Photos are saved in the property record.":
    "Les photos sont enregistrees dans la fiche du bien.",
  "Pick an account type first. Administration is login-only.":
    "Choisissez d'abord un type de compte. L'administration est reservee a la connexion.",
  "Platform Version": "Version de la plateforme",
  "Please draw your signature before confirming the contract.":
    "Veuillez dessiner votre signature avant de confirmer le contrat.",
  "Population": "Population",
  "Premium rental invoice": "Facture locative premium",
  "Preparing image...": "Preparation de l'image...",
  "Preparing images...": "Preparation des images...",
  "Primary Tenant": "Locataire principal",
  "Privacy": "Confidentialite",
  "Profile": "Profil",
  "Profile Image": "Image du profil",
  "Profile Settings": "Parametres du profil",
  "Profile preview": "Apercu du profil",
  "Profile saved successfully.": "Profil enregistre avec succes.",
  "Profile update failed.": "Echec de la mise a jour du profil.",
  "Profile updated. Sign out and in again to refresh the header identity.":
    "Profil mis a jour. Deconnectez-vous puis reconnectez-vous pour actualiser l'identite dans l'en-tete.",
  "Properties": "Biens",
  "Property": "Bien",
  "Property Address": "Adresse du bien",
  "Property Details": "Details du bien",
  "Property Name": "Nom du bien",
  "Property Type": "Type de bien",
  "Property Types": "Types de biens",
  "Property actions": "Actions du bien",
  "Property copied.": "Bien copie.",
  "Property created.": "Bien cree.",
  "Property deleted.": "Bien supprime.",
  "Property details": "Details du bien",
  "Property details are limited until the record is loaded.":
    "Les details du bien sont limites tant que la fiche n'est pas chargee.",
  "Property details copied.": "Details du bien copies.",
  "Property is correct": "Le bien est correct",
  "Property updated.": "Bien mis a jour.",
  "Publication status": "Statut de publication",
  "Quick Actions": "Actions rapides",
  "Read before signing": "Lire avant de signer",
  "Receipt": "Recu",
  "Receive an email when a tenant sends a message.":
    "Recevoir un email lorsqu'un locataire envoie un message.",
  "Received Amount (MAD)": "Montant recu (MAD)",
  "Recently": "Recemment",
  "rejected": "rejete",
  "Recent Activity": "Activite recente",
  "Record Payment": "Enregistrer un paiement",
  "Records": "Dossiers",
  "Ref": "Ref",
  "Reference": "Reference",
  "Rent": "Loyer",
  "Rent (MAD)": "Loyer (MAD)",
  "Repeat password": "Repeter le mot de passe",
  "Request failed.": "Requete echouee.",
  "Residence": "Residence",
  "Residential Address": "Adresse de residence",
  "Role": "Role",
  "Save Changes": "Enregistrer",
  "Save Contract": "Enregistrer le contrat",
  "Save property": "Enregistrer le bien",
  "Saved signature": "Signature enregistree",
  "Saved. Data refresh is taking longer, please refresh once.":
    "Enregistre. L'actualisation prend plus de temps, veuillez rafraichir une fois.",
  "Search by reference, address or tenant...": "Rechercher par reference, adresse ou locataire...",
  "Search by reference, name or tenant...": "Rechercher par reference, nom ou locataire...",
  "Search contacts": "Rechercher des contacts",
  "Search contracts by tenant, property or status...":
    "Rechercher des contrats par locataire, bien ou statut...",
  "Search contracts by tenant, property, status...":
    "Rechercher des contrats par locataire, bien, statut...",
  "Search or start a new chat": "Rechercher ou demarrer une discussion",
  "Search payments by tenant, amount or mode...":
    "Rechercher des paiements par locataire, montant ou mode...",
  "Search payments by tenant, amount, mode...":
    "Rechercher des paiements par locataire, montant, mode...",
  "Search properties by ref, address or tenant...":
    "Rechercher des biens par ref, adresse ou locataire...",
  "Search properties by ref, address, tenant...":
    "Rechercher des biens par ref, adresse, locataire...",
  "Search tenants by name, email or phone...":
    "Rechercher des locataires par nom, email ou telephone...",
  "Search tenants by name, email, phone...":
    "Rechercher des locataires par nom, email, telephone...",
  "Search users by name, role, email...": "Rechercher des utilisateurs par nom, role, email...",
  "Sections": "Sections",
  "Secure access": "Acces securise",
  "Select agent": "Selectionner un agent",
  "Select an agent": "Selectionner un agent",
  "Select commune": "Selectionner une commune",
  "Select contract": "Selectionner un contrat",
  "Select property": "Selectionner un bien",
  "Select tenant": "Selectionner un locataire",
  "Select type": "Selectionner un type",
  "Settings": "Parametres",
  "Sign": "Signature",
  "Sign in": "Connexion",
  "Sign in to your workspace.": "Connectez-vous a votre espace de travail.",
  "Sign out": "Deconnexion",
  "Signature": "Signature",
  "Signature required": "Signature requise",
  "Signed at": "Signe le",
  "Signing in...": "Connexion...",
  "Signing in…": "Connexion...",
  "Start": "Debut",
  "Start Date": "Date de debut",
  "Starts": "Debut",
  "Status": "Statut",
  "Storage Used": "Stockage utilise",
  "Success": "Succes",
  "Super Admin": "Super admin",
  "Support": "Support",
  "Support Email": "Email support",
  "Suspended": "Suspendu",
  "suspended": "suspendu",
  "signed": "signe",
  "cancelled": "annule",
  "Synchronizing your Google account with ImmoFlow...":
    "Synchronisation de votre compte Google avec ImmoFlow...",
  "System Admins": "Admins systeme",
  "System Status": "Etat du systeme",
  "System Updates": "Mises a jour systeme",
  "System Username": "Identifiant systeme",
  "Tax ID (ICE)": "Identifiant fiscal (ICE)",
  "Temporary Password": "Mot de passe temporaire",
  "Tenant": "Locataire",
  "Tenant Assignment": "Affectation du locataire",
  "Tenant Contact": "Contact locataire",
  "Tenant Details": "Details du locataire",
  "Tenant Signature": "Signature du locataire",
  "Tenant account": "Compte locataire",
  "Tenant, property, rent, balance": "Locataire, bien, loyer, solde",
  "Tenants": "Locataires",
  "Terms": "Conditions",
  "The dashboard will update automatically once a property is attached to your contract.":
    "Le tableau de bord se mettra a jour automatiquement lorsqu'un bien sera associe a votre contrat.",
  "The tenant will approve this confirmation after checking the transfer.":
    "Le locataire approuvera cette confirmation apres verification du virement.",
  "This will permanently delete this property and all related contracts and payments.":
    "Cette action supprimera definitivement ce bien ainsi que les contrats et paiements associes.",
  "Title": "Titre",
  "Total Agents": "Total agents",
  "Total Tenants": "Total locataires",
  "Track and record incoming rent collections.":
    "Suivez et enregistrez les encaissements de loyer entrants.",
  "Try again": "Reessayer",
  "Type": "Type",
  "Type a message": "Ecrire un message",
  "Unassigned": "Non affecte",
  "Unknown Tenant": "Locataire inconnu",
  "Update Password": "Mettre a jour le mot de passe",
  "Update your company details and tax information.":
    "Mettez a jour les informations de votre societe et les donnees fiscales.",
  "Upload image": "Ajouter une image",
  "Upload photo": "Ajouter une photo",
  "User": "Utilisateur",
  "User Management": "Gestion des utilisateurs",
  "User Pending Approval": "Utilisateur en attente d'approbation",
  "User Updated": "Utilisateur mis a jour",
  "User created.": "Utilisateur cree.",
  "Username": "Identifiant",
  "Username and email are required.": "L'identifiant et l'email sont requis.",
  "Vacant": "Vacant",
  "What kind of property is it?": "Quel type de bien est-ce ?",
  "Who received the cash, location, receipt number...":
    "Qui a recu les especes, lieu, numero de recu...",
  "Working with live backend data...": "Traitement avec les donnees backend en direct...",
  "Yesterday": "Hier",
  "You already have 10 images. Remove one to upload another.":
    "Vous avez deja 10 images. Supprimez-en une pour en ajouter une autre.",
  "Your account is ready. No active billing notice right now.":
    "Votre compte est pret. Aucun avis de facturation actif pour le moment.",
  "Your account is registered, but this role still needs approval before dashboard access is unlocked.":
    "Votre compte est enregistre, mais ce role doit encore etre approuve avant l'acces au tableau de bord.",
  "Your signature was saved on the contract.":
    "Votre signature a ete enregistree sur le contrat.",
  "Your tenant portal is connected and ready for contracts, payments, and documents.":
    "Votre portail locataire est connecte et pret pour les contrats, paiements et documents.",
  "or": "ou",
  "portfolio": "portefeuille",
  "unread": "non lu(s)",
  "© 2024 ImmoFlow Real Estate SaaS. All rights reserved.":
    "© 2024 ImmoFlow Real Estate SaaS. Tous droits reserves.",
};

const ar: PhraseMap = {
  "+ live inventory": "+ جرد مباشر",
  "84% of resources used": "84% من الموارد مستعملة",
  "A signature validates this rental contract in your tenant account.":
    "التوقيع يؤكد عقد الكراء داخل حسابك كمكتري.",
  "Access Level": "مستوى الوصول",
  "Access contracts, residence details, and receipts.":
    "الوصول إلى العقود وتفاصيل السكن والوصولات.",
  "Account Details": "تفاصيل الحساب",
  "Account awaiting approval": "الحساب في انتظار الموافقة",
  "Action": "إجراء",
  "Action failed": "فشل الإجراء",
  "Actions": "الإجراءات",
  "Active": "نشط",
  "active": "نشط",
  "Active Contract": "العقد النشط",
  "Active Property": "السكن النشط",
  "Add photos": "إضافة صور",
  "Add Property": "إضافة سكن",
  "Add the commune": "إضافة الجماعة",
  "Add the commune information and it will be saved.":
    "أضف معلومات الجماعة وسيتم حفظها.",
  "Address": "العنوان",
  "Admin": "مدير",
  "Administration": "الإدارة",
  "Admins": "المديرون",
  "Admins sign in here. Super admin creates admin accounts.":
    "المديرون يسجلون الدخول هنا. المدير العام ينشئ حسابات الإدارة.",
  "Agent": "وكيل",
  "Agent Assignment": "تعيين الوكيل",
  "Agent Code": "رمز الوكيل",
  "Agents": "الوكلاء",
  "Alert me 30 days before a lease expires.": "نبهني قبل 30 يوما من انتهاء عقد الكراء.",
  "All": "الكل",
  "All receipts and rent operations tied to your active account.":
    "كل الوصولات وعمليات الكراء المرتبطة بحسابك النشط.",
  "Already have an account?": "لديك حساب من قبل؟",
  "Already registered?": "مسجل من قبل؟",
  "Amount": "المبلغ",
  "Approve payment": "الموافقة على الدفع",
  "Approve payment?": "الموافقة على الدفع؟",
  "Area": "المساحة",
  "Area (m2)": "المساحة (م²)",
  "Area (m²)": "المساحة (م²)",
  "Assigned Agent": "الوكيل المعين",
  "Attach tenant to this house": "ربط مكتري بهذا السكن",
  "Authentication failed.": "فشلت المصادقة.",
  "Available": "متاح",
  "available": "متاح",
  "awaiting_tenant_approval": "في انتظار موافقة المكتري",
  "Back": "رجوع",
  "Back to login": "الرجوع إلى تسجيل الدخول",
  "Bank Transfer": "تحويل بنكي",
  "Bank Transfer Details": "تفاصيل التحويل البنكي",
  "Bathrooms": "الحمامات",
  "Bedrooms": "الغرف",
  "Birth Date": "تاريخ الازدياد",
  "Brand": "العلامة",
  "Cancel": "إلغاء",
  "Cancel Google session": "إلغاء جلسة Google",
  "Cash": "نقدا",
  "Cash Receipt Note": "ملاحظة وصل النقد",
  "Cash receipt note: receiver, place, receipt number...":
    "ملاحظة وصل النقد: المستلم، المكان، رقم الوصل...",
  "Change Password": "تغيير كلمة المرور",
  "Chats": "المحادثات",
  "Check": "شيك",
  "Check the property": "التحقق من السكن",
  "Choose Agent or Locataire to create an account.":
    "اختر وكيل أو مكتري لإنشاء حساب.",
  "Choose a contact before sending.": "اختر جهة اتصال قبل الإرسال.",
  "Choose account type": "اختر نوع الحساب",
  "Choose one type from the platform list.": "اختر نوعا واحدا من قائمة المنصة.",
  "Choose what events you want to be notified about.":
    "اختر الأحداث التي تريد تلقي إشعارات حولها.",
  "Choose your workspace.": "اختر مساحة عملك.",
  "Click to upload photos": "اضغط لرفع الصور",
  "Click to upload property photos": "اضغط لرفع صور السكن",
  "Close sidebar": "إغلاق الشريط الجانبي",
  "Collected": "المحصل",
  "Collection Rate": "نسبة التحصيل",
  "Collections": "التحصيلات",
  "Commune / Area": "الجماعة / المنطقة",
  "Commune name": "اسم الجماعة",
  "Company Name": "اسم الشركة",
  "Configured housing categories.": "فئات السكن المهيأة.",
  "Confirm New Password": "تأكيد كلمة المرور الجديدة",
  "Confirm Password": "تأكيد كلمة المرور",
  "Contact": "اتصال",
  "Continue": "متابعة",
  "Continue with Google": "المتابعة عبر Google",
  "Contract": "العقد",
  "Contract Details": "تفاصيل العقد",
  "Contract Expirations": "انتهاء العقود",
  "Contract Information": "معلومات العقد",
  "Contract Opened": "تم فتح العقد",
  "Contract Sent": "تم إرسال العقد",
  "Contract Signature": "توقيع العقد",
  "Contract Signed": "تم توقيع العقد",
  "Contract created.": "تم إنشاء العقد.",
  "Contract deleted.": "تم حذف العقد.",
  "Contract details": "تفاصيل العقد",
  "Contract documents": "وثائق العقد",
  "Contract end": "نهاية العقد",
  "Contract ref": "مرجع العقد",
  "Contract signed": "تم توقيع العقد",
  "Contract signed.": "تم توقيع العقد.",
  "Contract start": "بداية العقد",
  "Contract summary": "ملخص العقد",
  "Contract updated.": "تم تحديث العقد.",
  "Contracts": "العقود",
  "Contracts with payments cannot be deleted.": "لا يمكن حذف العقود التي تحتوي على دفعات.",
  "Control access for agents, admins, and tenants.":
    "تحكم في وصول الوكلاء والمديرين والمكتريين.",
  "Conversation": "محادثة",
  "Could not complete sign-in.": "تعذر إكمال تسجيل الدخول.",
  "Could not prepare the avatar image.": "تعذر تحضير صورة الملف.",
  "Could not prepare the selected images.": "تعذر تحضير الصور المحددة.",
  "Create Contract": "إنشاء عقد",
  "Create Property": "إنشاء سكن",
  "Create account": "إنشاء حساب",
  "Create account first": "أنشئ حسابا أولا",
  "Create listings with a guided flow.": "أنشئ الإعلانات عبر مسار موجه.",
  "Create properties, contracts, and collect payments.":
    "أنشئ السكنات والعقود وحصل الدفعات.",
  "Create property": "إنشاء سكن",
  "Create your agent profile.": "أنشئ ملفك كوكيل.",
  "Create your tenant profile.": "أنشئ ملفك كمكتري.",
  "Creating...": "جار الإنشاء...",
  "Creating…": "جار الإنشاء...",
  "Credit Card": "بطاقة بنكية",
  "Current Password": "كلمة المرور الحالية",
  "Current Residence": "السكن الحالي",
  "Dashboard": "لوحة التحكم",
  "Dashboard failed to load": "فشل تحميل لوحة التحكم",
  "Database Link": "رابط قاعدة البيانات",
  "Date": "التاريخ",
  "Delete": "حذف",
  "Delete contract?": "حذف العقد؟",
  "Delete notification": "حذف الإشعار",
  "Delete property?": "حذف السكن؟",
  "Describe the house": "وصف السكن",
  "Description": "الوصف",
  "Directory of all locataires linked to your properties.":
    "دليل كل المكتريين المرتبطين بسكناتك.",
  "Distance to agency (km)": "المسافة إلى الوكالة (كم)",
  "Documents": "الوثائق",
  "Draft": "مسودة",
  "draft": "مسودة",
  "Draw your signature": "ارسم توقيعك",
  "Each property must have between 2 and 10 images.":
    "يجب أن يحتوي كل سكن على ما بين صورتين و10 صور.",
  "Edit Contract": "تعديل العقد",
  "Edit Property": "تعديل السكن",
  "Electric": "كهربائي",
  "Email": "البريد الإلكتروني",
  "Email Address": "عنوان البريد الإلكتروني",
  "Email or Username": "البريد الإلكتروني أو اسم المستخدم",
  "End": "النهاية",
  "End Date": "تاريخ النهاية",
  "Ends": "ينتهي",
  "Enterprise": "مؤسسة",
  "Enter current address": "أدخل العنوان الحالي",
  "Existing images": "الصور الحالية",
  "Expected Revenue": "الدخل المتوقع",
  "Expired": "منتهي",
  "expired": "منتهي",
  "Failed to load dashboard.": "فشل تحميل لوحة التحكم.",
  "Final confirmation": "التأكيد النهائي",
  "Finishing Google sign-in": "إنهاء تسجيل الدخول عبر Google",
  "First Name": "الاسم الشخصي",
  "First name and last name are required.": "الاسم الشخصي والعائلي مطلوبان.",
  "Floor": "الطابق",
  "Full Name": "الاسم الكامل",
  "Get notified when a rent payment is recorded.": "تلقي إشعار عند تسجيل دفع الكراء.",
  "Go back": "رجوع",
  "Go to login": "الذهاب إلى تسجيل الدخول",
  "Google sign-in is not enabled for this frontend session.":
    "تسجيل الدخول عبر Google غير مفعل في هذه الجلسة.",
  "Heating": "التدفئة",
  "House Images": "صور السكن",
  "House Information": "معلومات السكن",
  "I understand": "فهمت",
  "ID": "المعرف",
  "Images ready for upload.": "الصور جاهزة للرفع.",
  "ImmoFlow workspace": "مساحة عمل ImmoFlow",
  "Immoflow Web": "Immoflow Web",
  "Included": "مشمول",
  "Initial Status": "الحالة الأولية",
  "JPG, PNG up to 5MB": "JPG و PNG حتى 5MB",
  "Keep property vacant": "إبقاء السكن فارغا",
  "Landing page": "الصفحة الرئيسية",
  "Last Login": "آخر دخول",
  "Last Payment": "آخر دفعة",
  "Last login": "آخر دخول",
  "Last Name": "الاسم العائلي",
  "Leave these blank if you only want to update profile information.":
    "اترك هذه الحقول فارغة إذا كنت تريد فقط تحديث معلومات الملف.",
  "Listed": "منشور",
  "listed": "منشور",
  "Locataire": "مكتري",
  "Log out": "تسجيل الخروج",
  "Maintenance": "صيانة",
  "maintenance": "صيانة",
  "Manage your personal information and account security.":
    "دبر معلوماتك الشخصية وأمان الحساب.",
  "Manage your platform preferences and configurations.":
    "دبر تفضيلات وإعدادات المنصة.",
  "Manager": "مسير",
  "Mark as read": "تحديد كمقروء",
  "Message could not be sent.": "تعذر إرسال الرسالة.",
  "Messages": "الرسائل",
  "Messages could not be loaded.": "تعذر تحميل الرسائل.",
  "Method": "الطريقة",
  "Minimum 8 characters": "8 أحرف على الأقل",
  "Mode": "الطريقة",
  "Monthly Rent": "الكراء الشهري",
  "Monthly Rent (MAD)": "الكراء الشهري (درهم)",
  "My Contract": "عقدي",
  "My Profile": "ملفي",
  "My Properties": "سكناتي",
  "N/A": "غير متاح",
  "Need a new account?": "تحتاج حسابا جديدا؟",
  "Needs tenant approval": "يحتاج موافقة المكتري",
  "Never": "أبدا",
  "New Messages": "رسائل جديدة",
  "New Password": "كلمة مرور جديدة",
  "New chat": "محادثة جديدة",
  "New uploads": "الملفات الجديدة",
  "News about product and feature updates.": "أخبار حول المنتج والتحديثات.",
  "Next Due": "الاستحقاق القادم",
  "Next Event": "الحدث القادم",
  "Next Visit": "الزيارة القادمة",
  "Next step opens a signature pad. Draw your signature with your mouse, pen, or finger.":
    "الخطوة التالية تفتح لوحة التوقيع. ارسم توقيعك بالفأرة أو القلم أو الإصبع.",
  "No active property": "لا يوجد سكن نشط",
  "No active residence": "لا توجد إقامة نشطة",
  "No active tenant": "لا يوجد مكتري نشط",
  "No contacts found": "لم يتم العثور على جهات اتصال",
  "No contract": "لا يوجد عقد",
  "No contract attached.": "لا يوجد عقد مرتبط.",
  "No contract attached to this property.": "لا يوجد عقد مرتبط بهذا السكن.",
  "No contract available.": "لا يوجد عقد متاح.",
  "No contract found for this property.": "لم يتم العثور على عقد لهذا السكن.",
  "No contracts yet": "لا توجد عقود بعد",
  "No conversations found": "لم يتم العثور على محادثات",
  "No description has been added for this property yet.": "لم تتم إضافة وصف لهذا السكن بعد.",
  "No detailed description provided for this property.": "لم يتم تقديم وصف مفصل لهذا السكن.",
  "No email available": "لا يوجد بريد إلكتروني",
  "No image available": "لا توجد صورة",
  "No messages yet": "لا توجد رسائل بعد",
  "No notifications yet.": "لا توجد إشعارات بعد.",
  "No pending contract to sign.": "لا يوجد عقد في انتظار التوقيع.",
  "No phone": "لا يوجد هاتف",
  "No property": "لا يوجد سكن",
  "No property types configured.": "لا توجد أنواع سكن مهيأة.",
  "None": "لا شيء",
  "Not included": "غير مشمول",
  "Not recorded": "غير مسجل",
  "Not selected": "غير محدد",
  "Not set": "غير محدد",
  "Notification Preferences": "تفضيلات الإشعارات",
  "Notifications": "الإشعارات",
  "Occupied": "مشغول",
  "occupied": "مشغول",
  "One global login for super admin, admins, agents, and locataires.":
    "تسجيل دخول واحد للمدير العام والمديرين والوكلاء والمكتريين.",
  "Open": "فتح",
  "Open signature pad": "فتح لوحة التوقيع",
  "Organization Profile": "ملف المؤسسة",
  "Output": "الإخراج",
  "Overdue": "متأخر",
  "PDF invoice generated.": "تم إنشاء فاتورة PDF.",
  "Parking": "موقف سيارات",
  "Partial": "جزئي",
  "partial": "جزئي",
  "paid": "مدفوع",
  "Password": "كلمة المرور",
  "Password confirmation must match.": "تأكيد كلمة المرور يجب أن يكون مطابقا.",
  "Payment Confirmations": "تأكيدات الدفع",
  "Payment Date": "تاريخ الدفع",
  "Payment History": "سجل الدفعات",
  "Payment Received": "تم استلام الدفع",
  "Payment Recorded": "تم تسجيل الدفع",
  "Payment approved.": "تمت الموافقة على الدفع.",
  "Payment recorded and sent to the tenant for approval.":
    "تم تسجيل الدفع وإرساله إلى المكتري للموافقة.",
  "Payments": "الدفعات",
  "Payments Summary": "ملخص الدفعات",
  "Pending": "قيد الانتظار",
  "pending": "قيد الانتظار",
  "Pending signature": "في انتظار التوقيع",
  "Personal Information": "المعلومات الشخصية",
  "Phone": "الهاتف",
  "Phone Number": "رقم الهاتف",
  "Photos are saved in the property record.": "تم حفظ الصور في سجل السكن.",
  "Pick an account type first. Administration is login-only.":
    "اختر نوع الحساب أولا. الإدارة مخصصة لتسجيل الدخول فقط.",
  "Platform Version": "نسخة المنصة",
  "Please draw your signature before confirming the contract.":
    "يرجى رسم توقيعك قبل تأكيد العقد.",
  "Population": "عدد السكان",
  "Premium rental invoice": "فاتورة كراء مميزة",
  "Preparing image...": "جار تحضير الصورة...",
  "Preparing images...": "جار تحضير الصور...",
  "Primary Tenant": "المكتري الرئيسي",
  "Privacy": "الخصوصية",
  "Profile": "الملف",
  "Profile Image": "صورة الملف",
  "Profile Settings": "إعدادات الملف",
  "Profile preview": "معاينة الملف",
  "Profile saved successfully.": "تم حفظ الملف بنجاح.",
  "Profile update failed.": "فشل تحديث الملف.",
  "Profile updated. Sign out and in again to refresh the header identity.":
    "تم تحديث الملف. سجل الخروج ثم الدخول لتحديث الهوية في الأعلى.",
  "Properties": "السكنات",
  "Property": "السكن",
  "Property Address": "عنوان السكن",
  "Property Details": "تفاصيل السكن",
  "Property Name": "اسم السكن",
  "Property Type": "نوع السكن",
  "Property Types": "أنواع السكن",
  "Property actions": "إجراءات السكن",
  "Property copied.": "تم نسخ السكن.",
  "Property created.": "تم إنشاء السكن.",
  "Property deleted.": "تم حذف السكن.",
  "Property details": "تفاصيل السكن",
  "Property details are limited until the record is loaded.":
    "تفاصيل السكن محدودة حتى يتم تحميل السجل.",
  "Property details copied.": "تم نسخ تفاصيل السكن.",
  "Property is correct": "السكن صحيح",
  "Property updated.": "تم تحديث السكن.",
  "Publication status": "حالة النشر",
  "Quick Actions": "إجراءات سريعة",
  "Read before signing": "اقرأ قبل التوقيع",
  "Receipt": "الوصل",
  "Receive an email when a tenant sends a message.":
    "استلام بريد إلكتروني عندما يرسل المكتري رسالة.",
  "Received Amount (MAD)": "المبلغ المستلم (درهم)",
  "Recently": "مؤخرا",
  "rejected": "مرفوض",
  "Recent Activity": "النشاط الأخير",
  "Record Payment": "تسجيل دفعة",
  "Records": "السجلات",
  "Ref": "مرجع",
  "Reference": "المرجع",
  "Rent": "الكراء",
  "Rent (MAD)": "الكراء (درهم)",
  "Repeat password": "إعادة كلمة المرور",
  "Request failed.": "فشل الطلب.",
  "Residence": "الإقامة",
  "Residential Address": "عنوان السكن",
  "Role": "الدور",
  "Save Changes": "حفظ التغييرات",
  "Save Contract": "حفظ العقد",
  "Save property": "حفظ السكن",
  "Saved signature": "التوقيع المحفوظ",
  "Saved. Data refresh is taking longer, please refresh once.":
    "تم الحفظ. تحديث البيانات يستغرق وقتا أطول، يرجى التحديث مرة واحدة.",
  "Search by reference, address or tenant...": "البحث بالمرجع أو العنوان أو المكتري...",
  "Search by reference, name or tenant...": "البحث بالمرجع أو الاسم أو المكتري...",
  "Search contacts": "البحث في جهات الاتصال",
  "Search contracts by tenant, property or status...":
    "البحث في العقود بالمكتري أو السكن أو الحالة...",
  "Search contracts by tenant, property, status...":
    "البحث في العقود بالمكتري أو السكن أو الحالة...",
  "Search or start a new chat": "البحث أو بدء محادثة جديدة",
  "Search payments by tenant, amount or mode...":
    "البحث في الدفعات بالمكتري أو المبلغ أو الطريقة...",
  "Search payments by tenant, amount, mode...":
    "البحث في الدفعات بالمكتري أو المبلغ أو الطريقة...",
  "Search properties by ref, address or tenant...":
    "البحث في السكنات بالمرجع أو العنوان أو المكتري...",
  "Search properties by ref, address, tenant...":
    "البحث في السكنات بالمرجع أو العنوان أو المكتري...",
  "Search tenants by name, email or phone...":
    "البحث في المكتريين بالاسم أو البريد أو الهاتف...",
  "Search tenants by name, email, phone...":
    "البحث في المكتريين بالاسم أو البريد أو الهاتف...",
  "Search users by name, role, email...": "البحث في المستخدمين بالاسم أو الدور أو البريد...",
  "Sections": "الأقسام",
  "Secure access": "ولوج آمن",
  "Select agent": "اختيار وكيل",
  "Select an agent": "اختيار وكيل",
  "Select commune": "اختيار جماعة",
  "Select contract": "اختيار عقد",
  "Select property": "اختيار سكن",
  "Select tenant": "اختيار مكتري",
  "Select type": "اختيار النوع",
  "Settings": "الإعدادات",
  "Sign": "التوقيع",
  "Sign in": "تسجيل الدخول",
  "Sign in to your workspace.": "سجل الدخول إلى مساحة عملك.",
  "Sign out": "تسجيل الخروج",
  "Signature": "التوقيع",
  "Signature required": "التوقيع مطلوب",
  "Signed at": "وقع في",
  "Signing in...": "جار تسجيل الدخول...",
  "Signing in…": "جار تسجيل الدخول...",
  "Start": "البداية",
  "Start Date": "تاريخ البداية",
  "Starts": "يبدأ",
  "Status": "الحالة",
  "Storage Used": "التخزين المستعمل",
  "Success": "نجاح",
  "Super Admin": "المدير العام",
  "Support": "الدعم",
  "Support Email": "بريد الدعم",
  "Suspended": "موقوف",
  "suspended": "موقوف",
  "signed": "موقع",
  "cancelled": "ملغى",
  "Synchronizing your Google account with ImmoFlow...":
    "مزامنة حساب Google الخاص بك مع ImmoFlow...",
  "System Admins": "مديرو النظام",
  "System Status": "حالة النظام",
  "System Updates": "تحديثات النظام",
  "System Username": "اسم المستخدم في النظام",
  "Tax ID (ICE)": "المعرف الضريبي (ICE)",
  "Temporary Password": "كلمة مرور مؤقتة",
  "Tenant": "مكتري",
  "Tenant Assignment": "تعيين المكتري",
  "Tenant Contact": "اتصال المكتري",
  "Tenant Details": "تفاصيل المكتري",
  "Tenant Signature": "توقيع المكتري",
  "Tenant account": "حساب المكتري",
  "Tenant, property, rent, balance": "المكتري، السكن، الكراء، الرصيد",
  "Tenants": "المكتريون",
  "Terms": "الشروط",
  "The dashboard will update automatically once a property is attached to your contract.":
    "سيتم تحديث لوحة التحكم تلقائيا عند ربط سكن بعقدك.",
  "The tenant will approve this confirmation after checking the transfer.":
    "سيوافق المكتري على هذا التأكيد بعد التحقق من التحويل.",
  "This will permanently delete this property and all related contracts and payments.":
    "سيحذف هذا السكن نهائيا مع كل العقود والدفعات المرتبطة به.",
  "Title": "العنوان",
  "Total Agents": "مجموع الوكلاء",
  "Total Tenants": "مجموع المكتريين",
  "Track and record incoming rent collections.": "تتبع وسجل تحصيلات الكراء الواردة.",
  "Try again": "إعادة المحاولة",
  "Type": "النوع",
  "Type a message": "اكتب رسالة",
  "Unassigned": "غير معين",
  "Unknown Tenant": "مكتري غير معروف",
  "Update Password": "تحديث كلمة المرور",
  "Update your company details and tax information.": "حدث معلومات الشركة والمعطيات الضريبية.",
  "Upload image": "رفع صورة",
  "Upload photo": "رفع صورة",
  "User": "مستخدم",
  "User Management": "تدبير المستخدمين",
  "User Pending Approval": "مستخدم في انتظار الموافقة",
  "User Updated": "تم تحديث المستخدم",
  "User created.": "تم إنشاء المستخدم.",
  "Username": "اسم المستخدم",
  "Username and email are required.": "اسم المستخدم والبريد الإلكتروني مطلوبان.",
  "Vacant": "فارغ",
  "What kind of property is it?": "ما نوع هذا السكن؟",
  "Who received the cash, location, receipt number...":
    "من استلم النقد، المكان، رقم الوصل...",
  "Working with live backend data...": "جار العمل على بيانات الواجهة الخلفية المباشرة...",
  "Yesterday": "أمس",
  "You already have 10 images. Remove one to upload another.":
    "لديك بالفعل 10 صور. احذف واحدة لإضافة أخرى.",
  "Your account is ready. No active billing notice right now.":
    "حسابك جاهز. لا يوجد إشعار أداء نشط حاليا.",
  "Your account is registered, but this role still needs approval before dashboard access is unlocked.":
    "تم تسجيل حسابك، لكن هذا الدور يحتاج إلى موافقة قبل فتح لوحة التحكم.",
  "Your signature was saved on the contract.": "تم حفظ توقيعك في العقد.",
  "Your tenant portal is connected and ready for contracts, payments, and documents.":
    "بوابة المكتري متصلة وجاهزة للعقود والدفعات والوثائق.",
  "or": "أو",
  "portfolio": "المحفظة",
  "unread": "غير مقروء",
  "© 2024 ImmoFlow Real Estate SaaS. All rights reserved.":
    "© 2024 ImmoFlow Real Estate SaaS. جميع الحقوق محفوظة.",
};

const maps: Record<Locale, PhraseMap> = {
  en: {},
  fr,
  ar,
};

const monthMap: Record<
  Locale,
  Record<string, string>
> = {
  en: {},
  fr: {
    Jan: "janv.",
    January: "janvier",
    Feb: "fevr.",
    February: "fevrier",
    Mar: "mars",
    March: "mars",
    Apr: "avr.",
    April: "avril",
    May: "mai",
    Jun: "juin",
    June: "juin",
    Jul: "juil.",
    July: "juillet",
    Aug: "aout",
    August: "aout",
    Sep: "sept.",
    September: "septembre",
    Oct: "oct.",
    October: "octobre",
    Nov: "nov.",
    November: "novembre",
    Dec: "dec.",
    December: "decembre",
  },
  ar: {
    Jan: "يناير",
    January: "يناير",
    Feb: "فبراير",
    February: "فبراير",
    Mar: "مارس",
    March: "مارس",
    Apr: "أبريل",
    April: "أبريل",
    May: "ماي",
    Jun: "يونيو",
    June: "يونيو",
    Jul: "يوليوز",
    July: "يوليوز",
    Aug: "غشت",
    August: "غشت",
    Sep: "شتنبر",
    September: "شتنبر",
    Oct: "أكتوبر",
    October: "أكتوبر",
    Nov: "نونبر",
    November: "نونبر",
    Dec: "دجنبر",
    December: "دجنبر",
  },
};

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function translateDynamicPhrase(text: string, locale: Locale): string | null {
  const step = text.match(/^Step (\d+) of (\d+)$/);
  if (step) {
    return locale === "ar"
      ? `الخطوة ${step[1]} من ${step[2]}`
      : `Etape ${step[1]} sur ${step[2]}`;
  }

  const unread = text.match(/^(\d+) unread$/);
  if (unread) {
    return locale === "ar" ? `${unread[1]} غير مقروء` : `${unread[1]} non lu(s)`;
  }

  const imageCount = text.match(/^Image (\d+) of (\d+)$/);
  if (imageCount) {
    return locale === "ar"
      ? `الصورة ${imageCount[1]} من ${imageCount[2]}`
      : `Image ${imageCount[1]} sur ${imageCount[2]}`;
  }

  const createAccount = text.match(/^Create (.+) account$/);
  if (createAccount) {
    const role = translateRuntimeText(createAccount[1], locale);
    return locale === "ar" ? `إنشاء حساب ${role}` : `Creer un compte ${role}`;
  }

  const emailPending = text.match(
    /^(.+) is registered, but this role still needs approval before dashboard access is unlocked\.$/,
  );
  if (emailPending) {
    return locale === "ar"
      ? `${emailPending[1]} مسجل، لكن هذا الدور يحتاج إلى موافقة قبل فتح لوحة التحكم.`
      : `${emailPending[1]} est inscrit, mais ce role doit encore etre approuve avant l'acces au tableau de bord.`;
  }

  const expectedRent = text.match(/^Expected rent: (.+)$/);
  if (expectedRent) {
    return locale === "ar"
      ? `الكراء المتوقع: ${expectedRent[1]}`
      : `Loyer attendu : ${expectedRent[1]}`;
  }

  const signingFor = text.match(/^You are signing for (.+)\.$/);
  if (signingFor) {
    return locale === "ar"
      ? `أنت توقع من أجل ${signingFor[1]}.`
      : `Vous signez pour ${signingFor[1]}.`;
  }

  const greeting = text.match(/^Good morning, (.+)\.$/);
  if (greeting) {
    return locale === "ar" ? `صباح الخير، ${greeting[1]}.` : `Bonjour, ${greeting[1]}.`;
  }

  const residenceStatus = text.match(
    /^Everything looks in order with your residence at (.+)\.$/,
  );
  if (residenceStatus) {
    return locale === "ar"
      ? `كل شيء يبدو منظما في سكنك في ${residenceStatus[1]}.`
      : `Tout est en ordre pour votre residence a ${residenceStatus[1]}.`;
  }

  const hourAgo = text.match(/^(\d+) hours? ago$/);
  if (hourAgo) {
    return locale === "ar"
      ? `قبل ${hourAgo[1]} ساعة`
      : `il y a ${hourAgo[1]} h`;
  }

  const dayAgo = text.match(/^(\d+) days? ago$/);
  if (dayAgo) {
    return locale === "ar"
      ? `قبل ${dayAgo[1]} يوم`
      : `il y a ${dayAgo[1]} j`;
  }

  const dayMonthYear = text.match(/^(\d{2}) ([A-Za-z]+) (\d{4})$/);
  if (dayMonthYear) {
    const month = monthMap[locale][dayMonthYear[2]] ?? dayMonthYear[2];
    return locale === "ar"
      ? `${dayMonthYear[1]} ${month} ${dayMonthYear[3]}`
      : `${dayMonthYear[1]} ${month} ${dayMonthYear[3]}`;
  }

  return null;
}

export function translateRuntimeText(input: string, locale: Locale): string {
  if (locale === "en") {
    return input;
  }

  const leading = input.match(/^\s*/)?.[0] ?? "";
  const trailing = input.match(/\s*$/)?.[0] ?? "";
  const normalized = normalize(input);

  if (!normalized) {
    return input;
  }

  const direct = maps[locale][normalized];
  const translated = direct ?? translateDynamicPhrase(normalized, locale);

  return translated ? `${leading}${translated}${trailing}` : input;
}
