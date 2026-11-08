/* Testi IT/EN della pagina UnitMilano (unitmilano.html). Si aggiungono al dizionario globale di
   assets/i18n.js: va caricato DOPO i18n.js e prima che parta DOMContentLoaded, così lo
   scambio di lingua del sito (pulsanti IT/EN) li applica come tutti gli altri testi. */
(function(){
  if (typeof GROWMI_I18N === 'undefined') return;
  var it = {
    um_badge: "Nuovo format · ogni mercoledì",
    um_subtitle: "Il mercoledì universitario di Milano.",
    um_lead: "Un nuovo format di apericena con musica house e commerciale e una community di studenti da conoscere. Cibo, drink e la città che si incontra, in una sola serata.",
    um_when_label: "Quando", um_when_value: "Mercoledì 18 novembre", um_when_sub: "Dalle 19:30 alle 3:00",
    um_where_label: "Dove", um_where_sub: "Via Torino 64, Milano",
    um_fa_label: "Formula apericena", um_fa_sub: "Apericena + 1 drink inclusi", um_fa_when: "Fino alle 21:30",
    um_fs_label: "Formula serata", um_fs_sub: "2 drink inclusi", um_fs_when: "Dopo le 21:30, fino alle 3:00",
    um_cta: "Registrati gratis", um_cta_note: "Paghi all'ingresso, dopo la scansione del QR code",

    um_format_eyebrow: "Il format", um_format_title: "Una serata, tre ingredienti",
    um_f1_t: "Musica", um_f1_p: "House e commerciale: il sound giusto per iniziare la serata e ballare fino a tardi.",
    um_f2_t: "Community", um_f2_p: "Conosci studenti di tutte le università di Milano: nuovi amici, nuovi progetti.",
    um_f3_t: "Apericena", um_f3_p: "Cibo e un drink inclusi nei 15&nbsp;€: arrivi, mangi, brindi. Dalle 21:30 passi alla Formula serata: sempre 15&nbsp;€, con due drink.",

    um_how_eyebrow: "Come funziona", um_how_title: "Tre passaggi, zero pagamenti online",
    um_s1_t: "Ti registri", um_s1_p: "Compili il form qui sotto: ci metti un minuto e non costa nulla.",
    um_s2_t: "Ricevi il QR code via email", um_s2_p: "Subito dopo la registrazione ti arriva il tuo QR personale, che vedi anche in questa pagina.",
    um_s3_t: "All'ingresso scansioniamo il QR e paghi 15&nbsp;€", um_s3_p: "Mostri il QR allo staff, paghi 15&nbsp;€ e ti godi apericena e drink.",

    um_form_eyebrow: "Registrazione gratuita", um_form_title: "Registrati gratis",
    um_form_lead: "Nessun pagamento online: paghi 15&nbsp;€ all'ingresso.",
    um_f_first: "Nome", um_f_last: "Cognome", um_f_email: "Email", um_f_phone: "Telefono",
    um_f_uni: "Università", um_f_uni_ph: "Scegli la tua università", um_f_uni_other: "Altro",
    um_f_privacy: "Ho letto e accetto la", um_f_privacy_link: "privacy policy",
    um_f_adult: "Confermo di essere maggiorenne.",
    um_f_submit: "Registrati gratis", um_f_sending: "Invio in corso…",
    um_err_generic: "Non siamo riusciti a completare la registrazione. Riprova tra poco.",
    um_err_network: "Connessione assente o instabile. Riprova.",
    um_err_required: "Compila tutti i campi e accetta le due caselle.",
    um_done_eyebrow: "Registrazione confermata", um_done_title: "Sei dentro!",
    um_done_lead_mail: "Ciao {name}, ti abbiamo inviato il QR code via email (controlla anche lo spam). Eccolo anche qui: mostralo all'ingresso.",
    um_done_lead_nomail: "Ciao {name}, ecco il tuo QR code: mostralo all'ingresso. Salvalo o fai uno screenshot.",
    um_done_code: "Codice", um_done_save: "Salva il QR", um_done_note: "15&nbsp;€ all'ingresso: Formula apericena (1 drink) fino alle 21:30, Formula serata (2 drink) dopo.",
    um_aside_t: "Da ricordare",
    um_aside_1: "Il QR è personale: non condividerlo.",
    um_aside_2: "Porta un documento d'identità.",
    um_aside_3: "Paghi 15&nbsp;€ all'ingresso, dopo la scansione del QR.",
    um_aside_4: "Ingresso fino a esaurimento posti.",

    um_partners: "UnitMilano è un progetto di",

    um_faq_title: "Domande frequenti",
    um_q1: "Devo pagare online?",
    um_a1: "No. La registrazione è gratuita e non chiediamo nessun pagamento online: paghi 15&nbsp;€ all'ingresso, dopo la scansione del tuo QR code.",
    um_q2: "Cosa include il prezzo?",
    um_a2: "La Formula apericena (fino alle 21:30) costa 15&nbsp;€ e include il cibo e un drink. La Formula serata (dopo le 21:30) costa sempre 15&nbsp;€ e include due drink.",
    um_q3: "È solo per studenti?",
    um_a3: "UnitMilano nasce come il mercoledì universitario di Milano, pensato per gli studenti. Ti chiediamo l'università al momento della registrazione e di portare un documento d'identità."
  };
  var en = {
    um_badge: "New format · every Wednesday",
    um_subtitle: "Milan's university Wednesday.",
    um_lead: "A new aperitivo-dinner format with house and commercial music and a community of students to meet. Food, drinks and the city meeting up, in a single night.",
    um_when_label: "When", um_when_value: "Wednesday, November 18", um_when_sub: "From 7:30 PM to 3:00 AM",
    um_where_label: "Where", um_where_sub: "Via Torino 64, Milan",
    um_fa_label: "Aperitivo deal", um_fa_sub: "Aperitivo dinner + 1 drink included", um_fa_when: "Until 9:30 PM",
    um_fs_label: "Night deal", um_fs_sub: "2 drinks included", um_fs_when: "After 9:30 PM, until 3:00 AM",
    um_cta: "Register for free", um_cta_note: "You pay at the door, after the QR code scan",

    um_format_eyebrow: "The format", um_format_title: "One night, three ingredients",
    um_f1_t: "Music", um_f1_p: "House and commercial: the right sound to start the night and dance until late.",
    um_f2_t: "Community", um_f2_p: "Meet students from every university in Milan: new friends, new projects.",
    um_f3_t: "Aperitivo dinner", um_f3_p: "Food and a drink included in the €15: you arrive, you eat, you toast. From 9:30 PM you move to the Night deal: still €15, with two drinks.",

    um_how_eyebrow: "How it works", um_how_title: "Three steps, no online payment",
    um_s1_t: "You register", um_s1_p: "Fill in the form below: it takes a minute and costs nothing.",
    um_s2_t: "You get your QR code by email", um_s2_p: "Right after registering you receive your personal QR code, which you also see on this page.",
    um_s3_t: "At the door we scan the QR and you pay €15", um_s3_p: "Show the QR to our staff, pay €15 and enjoy the aperitivo dinner and your drink.",

    um_form_eyebrow: "Free registration", um_form_title: "Register for free",
    um_form_lead: "No online payment: you pay €15 at the door.",
    um_f_first: "First name", um_f_last: "Last name", um_f_email: "Email", um_f_phone: "Phone",
    um_f_uni: "University", um_f_uni_ph: "Choose your university", um_f_uni_other: "Other",
    um_f_privacy: "I have read and accept the", um_f_privacy_link: "privacy policy",
    um_f_adult: "I confirm I am 18 or over.",
    um_f_submit: "Register for free", um_f_sending: "Sending…",
    um_err_generic: "We couldn't complete your registration. Please try again shortly.",
    um_err_network: "No or unstable connection. Please try again.",
    um_err_required: "Please fill in every field and tick both boxes.",
    um_done_eyebrow: "Registration confirmed", um_done_title: "You're in!",
    um_done_lead_mail: "Hi {name}, we sent your QR code by email (check your spam too). Here it is again: show it at the entrance.",
    um_done_lead_nomail: "Hi {name}, here is your QR code: show it at the entrance. Save it or take a screenshot.",
    um_done_code: "Code", um_done_save: "Save the QR", um_done_note: "€15 at the door: Aperitivo deal (1 drink) until 9:30 PM, Night deal (2 drinks) after.",
    um_aside_t: "Remember",
    um_aside_1: "The QR code is personal: don't share it.",
    um_aside_2: "Bring a photo ID.",
    um_aside_3: "You pay €15 at the door, after the QR scan.",
    um_aside_4: "Entry until capacity is reached.",

    um_partners: "UnitMilano is a project by",

    um_faq_title: "Frequently asked questions",
    um_q1: "Do I have to pay online?",
    um_a1: "No. Registration is free and we don't ask for any online payment: you pay €15 at the door, after your QR code is scanned.",
    um_q2: "What does the price include?",
    um_a2: "The Aperitivo deal (until 9:30 PM) is €15 and includes food and one drink. The Night deal (after 9:30 PM) is still €15 and includes two drinks.",
    um_q3: "Is it for students only?",
    um_a3: "UnitMilano is Milan's university Wednesday, designed for students. We ask for your university when you register and for a photo ID at the entrance."
  };
  Object.keys(it).forEach(function(k){ GROWMI_I18N.it[k] = it[k]; });
  Object.keys(en).forEach(function(k){ GROWMI_I18N.en[k] = en[k]; });
})();
