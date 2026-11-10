// Blocco acquisto biglietti standard, riusabile su qualsiasi pagina evento — sostituisce sia il
// vecchio form Netlify (rotto/scollegato) sia i Payment Link Stripe esterni hardcoded in pagina.
// Flusso in 3 passi, tutto dentro la pagina (nessun redirect esterno):
// 1) scegli la fascia/opzione (visibile subito, stato reale — esaurita o no — dal server)
// 2) compila i tuoi dati (nome/email/consensi), salvati su KV — stesso archivio dei biglietti
// 3) paga con Stripe Embedded Checkout, incorporato qui in pagina
//
// Markup atteso (vedi the-miseducation-of-growmi.html per un esempio completo):
// <div class="event-tickets" data-event="<slug-evento>">
//   <div data-et-tier-list></div>
//   <div data-et-reg-step hidden>
//     <strong data-et-selection-label></strong>
//     <p data-et-price-breakdown></p> (facoltativo: mostra "Biglietto €X + commissione
//       transazione €Y = €Z" — il prezzo sui bottoni fascia è quello netto, la maggiorazione
//       si vede solo qui, dopo la selezione, prima di pagare)
//     <form data-et-reg-form>
//       <input data-et-firstname> <input data-et-lastname>
//       <select data-et-phone-prefix> <input data-et-phone>
//       <input type="email" data-et-email>
//       <div data-et-guests></div> <button type="button" data-et-add-guest>...</button> <p data-et-total></p>
//         (facoltativi: il "+" aggiunge biglietti per altre persone, ognuna con nome/cognome/email)
//       <input type="checkbox" data-et-photo-consent> <input type="checkbox" data-et-newsletter>
//       <input data-et-coupon> (facoltativo: codice del coupon "5° evento gratis" — se compilato
//         e valido, il prezzo del biglietto diventa €0, controllato sempre lato server)
//       <button type="submit" data-et-reg-submit>...</button>
//       <p data-et-reg-status hidden></p>
//     </form>
//   </div>
//   <div data-et-checkout-wrap hidden><div data-et-checkout-container></div></div>
// </div>
(function(){
  // Chiave pubblicabile Stripe (pk_live_...): è fatta apposta per stare in chiaro nel JS lato
  // client, non è un segreto — è quella pubblica, abbinata alla secret key live già configurata
  // sul Worker.
  var STRIPE_PUBLISHABLE_KEY = "pk_live_51RCPfzAlS0d4FgrwKgoxmfFsPUx1a7pAwn5707zCQ9PhmQYHJ41Ji4sXJt60YpD4IuDkEpUZwZe5YKRMz1lKJxbH00hrAkWQYt";

  function euro(cents){
    return "€" + (cents / 100).toLocaleString("it-IT", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
  }

  // Il testo dei bottoni/badge è generato da JS (non è markup statico con data-i18n già in
  // pagina), quindi va tradotto a mano qui — legge la lingua corrente esattamente come fa
  // growmiApplyLang() in assets/i18n.js. Aggiunge comunque data-i18n sull'elemento creato, così
  // un cambio lingua DOPO che i biglietti sono già stati disegnati li aggiorna lo stesso, senza
  // dover ridisegnare la lista.
  // Testo scritto dal pannello con la sua traduzione inglese (se esiste): entrambe nel DOM, il CSS
  // (.i18n-it/.i18n-en in style.css) mostra quella della lingua scelta, anche se si cambia lingua dopo.
  function et_dual(it, en){
    return (en && en !== it) ? '<span class="i18n-it">' + it + '</span><span class="i18n-en">' + en + '</span>' : it;
  }
  function et_pick(it, en){
    return ((document.documentElement.getAttribute("lang") || "it") === "en" && en) ? en : it;
  }
  function et_t(key, fallback){
    var lang = document.documentElement.getAttribute("lang") || "it";
    var dict = (typeof GROWMI_I18N !== "undefined" && GROWMI_I18N[lang]) || {};
    return dict[key] !== undefined ? dict[key] : fallback;
  }

  function initOne(root){
    var slug = root.dataset.event;
    var tierList = root.querySelector("[data-et-tier-list]");
    var regStep = root.querySelector("[data-et-reg-step]");
    var selectionLabel = root.querySelector("[data-et-selection-label]");
    var checkoutBreakdown = root.querySelector("[data-et-checkout-breakdown]");
    var form = root.querySelector("[data-et-reg-form]");
    var status = root.querySelector("[data-et-reg-status]");
    var submitBtn = root.querySelector("[data-et-reg-submit]");
    var checkoutWrap = root.querySelector("[data-et-checkout-wrap]");
    var checkoutContainer = root.querySelector("[data-et-checkout-container]");
    if (!slug || !tierList || !form) return;

    var selectedTierId = null;
    var selectedOptionId = null;
    var selectedPriceInfo = null;
    var guestsWrap = root.querySelector("[data-et-guests]");
    var addGuestBtn = root.querySelector("[data-et-add-guest]");
    var totalEl = root.querySelector("[data-et-total]");
    // Biglietti in un solo acquisto (compreso il proprio): stesso tetto del server.
    var MAX_TICKETS = 5;

    function guestCount(){ return guestsWrap ? guestsWrap.querySelectorAll("[data-et-guest]").length : 0; }
    function ticketCount(){ return 1 + guestCount(); }

    // Riepilogo del totale che si aggiorna a ogni "+" / rimozione: stessa formula del server
    // (commissione calcolata per biglietto), quindi quello che vedi è quello che paghi.
    function updateTotals(){
      var n = ticketCount();
      if (addGuestBtn) addGuestBtn.hidden = n >= MAX_TICKETS;
      if (!totalEl) return;
      if (!selectedPriceInfo || n < 2) { totalEl.textContent = ""; return; }
      totalEl.textContent = n + " " + et_t("et_tickets_word", "biglietti") + " × " + euro(selectedPriceInfo.gross) + " = " + euro(selectedPriceInfo.gross * n) + " (" + et_t("et_fee_incl", "commissione di transazione inclusa") + ")";
    }

    function renumberGuests(){
      if (!guestsWrap) return;
      guestsWrap.querySelectorAll("[data-et-guest]").forEach(function(g, i){
        g.querySelector("[data-et-guest-title]").textContent = et_t("et_ticket_word", "Biglietto") + " " + (i + 2);
      });
    }

    function addGuest(){
      if (!guestsWrap || ticketCount() >= MAX_TICKETS) return;
      var g = document.createElement("div");
      g.className = "et-guest";
      g.setAttribute("data-et-guest", "");
      g.innerHTML =
        '<div class="et-guest-head"><span data-et-guest-title></span><button type="button" class="et-guest-remove" aria-label="Rimuovi questo biglietto">×</button></div>' +
        '<div class="et-form-row"><input type="text" data-g-firstname placeholder="' + et_t("et_ph_firstname", "Nome") + '" required><input type="text" data-g-lastname placeholder="' + et_t("et_ph_lastname", "Cognome") + '" required></div>' +
        '<input type="email" data-g-email placeholder="Email" required>';
      g.querySelector(".et-guest-remove").addEventListener("click", function(){
        g.remove(); renumberGuests(); updateTotals();
      });
      guestsWrap.appendChild(g);
      renumberGuests(); updateTotals();
      g.querySelector("[data-g-firstname]").focus();
    }
    if (addGuestBtn) addGuestBtn.addEventListener("click", addGuest);

    function collectGuests(){
      if (!guestsWrap) return [];
      return Array.prototype.map.call(guestsWrap.querySelectorAll("[data-et-guest]"), function(g){
        return {
          firstName: g.querySelector("[data-g-firstname]").value.trim(),
          lastName: g.querySelector("[data-g-lastname]").value.trim(),
          email: g.querySelector("[data-g-email]").value.trim()
        };
      });
    }

    function renderTiers(data){
      tierList.innerHTML = "";
      data.tiers.forEach(function(tier){
        var row = document.createElement("div");
        // Le tre fasce restano sempre visibili (mai nascoste dalla lista): quella esaurita
        // mostra "Esauriti"/"Sold out", quelle future "Non disponibile"/"Not available" — stesso
        // badge singolo per tutta la riga in entrambi i casi, invece di un bottone disabilitato
        // per ogni opzione con solo un trattino al posto del prezzo.
        var optionsHtml;
        if (tier.soldOut) {
          row.className = "et-tier-row et-sold-out";
          optionsHtml = '<span class="et-sold-out-badge" data-i18n="et_soldout">' + et_t("et_soldout", "Esauriti") + '</span>' +
            '<button type="button" class="et-waitlist-btn" data-waitlist-tier="' + tier.id + '">' + et_t("et_waitlist_cta", "Iscriviti alla lista d'attesa") + '</button>';
        } else if (!tier.active) {
          row.className = "et-tier-row et-upcoming";
          optionsHtml = '<span class="et-sold-out-badge" data-i18n="et_unavailable">' + et_t("et_unavailable", "Presto in vendita") + '</span>';
        } else {
          row.className = "et-tier-row";
          optionsHtml = tier.options.map(function(o){
            return '<button type="button" class="et-tier-btn" data-tier="' + tier.id + '" data-option="' + o.id + '" data-selection-label="' +
              (tier.name + " — " + o.label).replace(/"/g, "&quot;") + '" data-selection-label-en="' +
              ((tier.nameEn || tier.name) + " — " + (o.labelEn || o.label)).replace(/"/g, "&quot;") + '" data-price="' + o.priceCents + '" data-fee="' + o.feeCents + '" data-gross="' + o.grossCents + '">' +
              '<span class="et-tier-btn-label">' + et_dual(o.label, o.labelEn) + '</span><span class="et-tier-btn-price">' + euro(o.priceCents) + '</span>' +
            '</button>';
          }).join("");
        }
        row.innerHTML =
          '<div class="et-tier-name">' + et_dual(tier.name, tier.nameEn) + (tier.sub ? '<small>' + et_dual(tier.sub, tier.subEn) + '</small>' : '') + '</div>' +
          '<div class="et-tier-options">' + optionsHtml + '</div>';
        tierList.appendChild(row);
      });
      tierList.querySelectorAll(".et-tier-btn:not(:disabled)").forEach(function(btn){
        btn.addEventListener("click", function(){
          selectTier(btn.dataset.tier, btn.dataset.option, et_pick(btn.dataset.selectionLabel, btn.dataset.selectionLabelEn), {
            price: parseInt(btn.dataset.price, 10),
            fee: parseInt(btn.dataset.fee, 10),
            gross: parseInt(btn.dataset.gross, 10)
          });
        });
      });
      tierList.querySelectorAll(".et-waitlist-btn").forEach(function(btn){
        btn.addEventListener("click", function(){ openWaitlistForm(btn); });
      });
    }

    // Form minimo (nome + email) iniettato subito sotto il bottone, invece di riusare lo step
    // di registrazione biglietti — qui non c'è nessun pagamento, non ha senso chiedere
    // telefono/consensi foto come per un acquisto vero.
    function openWaitlistForm(btn){
      var tierId = btn.dataset.waitlistTier;
      var row = btn.closest(".et-tier-row");
      if (row.querySelector(".et-waitlist-form")) return; // già aperto
      btn.hidden = true;
      var wrap = document.createElement("div");
      wrap.className = "et-waitlist-form";
      wrap.innerHTML =
        '<input type="text" placeholder="' + et_t("et_ph_firstname", "Nome") + '" class="et-waitlist-name" required>' +
        '<input type="email" placeholder="Email" class="et-waitlist-email" required>' +
        '<button type="button" class="et-waitlist-submit">' + et_t("et_waitlist_submit", "Iscrivimi") + '</button>' +
        '<p class="et-waitlist-status" hidden></p>';
      row.appendChild(wrap);
      var statusEl = wrap.querySelector(".et-waitlist-status");
      wrap.querySelector(".et-waitlist-submit").addEventListener("click", async function(){
        var nameVal = wrap.querySelector(".et-waitlist-name").value.trim();
        var emailVal = wrap.querySelector(".et-waitlist-email").value.trim();
        if (!nameVal || !emailVal) {
          statusEl.textContent = et_t("et_waitlist_fill", "Compila nome ed email.");
          statusEl.hidden = false;
          return;
        }
        try {
          var res = await fetch("/api/waitlist-join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventSlug: slug, tierId: tierId, name: nameVal, email: emailVal })
          });
          var data = await res.json();
          if (!res.ok) throw new Error(data.error || "");
          wrap.innerHTML = '<p class="et-waitlist-status is-ok">' + et_t("et_waitlist_done", "Fatto — ti scriviamo se si libera un posto.") + '</p>';
        } catch (e) {
          statusEl.textContent = et_t("et_waitlist_error", "Qualcosa è andato storto, riprova.");
          statusEl.hidden = false;
        }
      });
    }

    async function loadTiers(){
      try {
        var res = await fetch("/api/event-tiers?event=" + encodeURIComponent(slug));
        var data = await res.json();
        if (res.ok) renderTiers(data);
      } catch (e) { /* si può riprovare ricaricando la pagina, non blocca il resto */ }
    }

    function selectTier(tierId, optionId, label, priceInfo){
      selectedTierId = tierId;
      selectedOptionId = optionId;
      selectedPriceInfo = priceInfo || null;
      if (selectionLabel) selectionLabel.textContent = label;
      updateTotals();
      regStep.hidden = false;
      checkoutWrap.hidden = true;
      checkoutContainer.innerHTML = "";
      regStep.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function startCheckout(registrationId){
      checkoutWrap.hidden = false;
      checkoutContainer.innerHTML = "";
      if (checkoutBreakdown && selectedPriceInfo) {
        var n = ticketCount();
        checkoutBreakdown.textContent = selectedPriceInfo.fee > 0
          ? (n > 1 ? n + " × (" : "") + et_t("et_ticket_word", "Biglietto") + " " + euro(selectedPriceInfo.price) + " + " + et_t("et_fee_word", "commissione transazione") + " " + euro(selectedPriceInfo.fee) + (n > 1 ? ")" : "") + " = " + euro(selectedPriceInfo.gross * n)
          : "";
      }
      checkoutWrap.scrollIntoView({ behavior: "smooth", block: "start" });
      try {
        var res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId: registrationId, tierId: selectedTierId, optionId: selectedOptionId })
        });
        var data = await res.json();
        if (res.ok && data.discountPercent && checkoutBreakdown) {
          var nd = ticketCount();
          checkoutBreakdown.textContent = (nd > 1 ? nd + " × (" : "") + et_t("et_ticket_word", "Biglietto") + " " + euro(data.netCents) + " (−" + data.discountPercent + "%) + " + et_t("et_fee_word", "commissione transazione") + " " + euro(data.feeCents) + (nd > 1 ? ")" : "") + " = " + euro(data.grossCents * nd);
        }
        if (!res.ok) {
          checkoutContainer.textContent = data.error === "fascia esaurita"
            ? et_t("et_err_soldout", "Questa fascia si è appena esaurita — aggiorna la pagina e scegli quella successiva.")
            : data.error === "posti insufficienti"
              ? et_t("et_err_remaining", "In questa fascia restano solo {n} posti: aggiorna la pagina e riduci i biglietti.").replace("{n}", data.remaining)
              : et_t("et_err_generic", "Qualcosa è andato storto, riprova.");
          return;
        }
        var stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        var checkout = await stripe.initEmbeddedCheckout({ clientSecret: data.clientSecret });
        checkout.mount(checkoutContainer);
      } catch (e) {
        checkoutContainer.textContent = et_t("et_err_conn", "Errore di connessione, riprova.");
      }
    }

    form.addEventListener("submit", async function(e){
      e.preventDefault();
      if (!selectedTierId) return;
      submitBtn.disabled = true;
      try {
        var couponInput = form.querySelector("[data-et-coupon]");
        var firstName = form.querySelector("[data-et-firstname]").value.trim();
        var lastName = form.querySelector("[data-et-lastname]").value.trim();
        var phonePrefixEl = form.querySelector("[data-et-phone-prefix]");
        var phonePrefix = phonePrefixEl ? phonePrefixEl.value : "";
        var phoneNumber = form.querySelector("[data-et-phone]").value.trim();
        var res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventSlug: slug,
            name: (firstName + " " + lastName).trim(),
            phone: (phonePrefix + " " + phoneNumber).trim(),
            email: form.querySelector("[data-et-email]").value.trim(),
            termsAccepted: form.querySelector("[data-et-terms]") ? form.querySelector("[data-et-terms]").checked : false,
            photoConsent: form.querySelector("[data-et-photo-consent]").checked,
            newsletterOptin: form.querySelector("[data-et-newsletter]") ? form.querySelector("[data-et-newsletter]").checked : false,
            couponCode: couponInput ? couponInput.value.trim() : "",
            guests: collectGuests()
          })
        });
        var data = await res.json();
        if (!res.ok) {
          status.textContent = data.error || et_t("et_err_check", "Controlla i dati inseriti.");
          status.classList.add("is-error");
          status.hidden = false;
          submitBtn.disabled = false;
          return;
        }
        form.hidden = true;
        await startCheckout(data.registrationId);
      } catch (e) {
        status.textContent = et_t("et_err_conn", "Errore di connessione, riprova.");
        status.classList.add("is-error");
        status.hidden = false;
        submitBtn.disabled = false;
      }
    });

    loadTiers();
  }

  document.addEventListener("DOMContentLoaded", function(){
    document.querySelectorAll(".event-tickets[data-event]").forEach(initOne);
  });
})();
