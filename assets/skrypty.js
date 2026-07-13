// Menu mobilne
function przelaczMenu(przycisk) {
  var menu = document.getElementById('menu');
  var otwarte = menu.classList.toggle('otwarte');
  przycisk.setAttribute('aria-expanded', otwarte ? 'true' : 'false');
}
document.querySelectorAll('.menu a').forEach(function (a) {
  a.addEventListener('click', function () {
    document.getElementById('menu').classList.remove('otwarte');
  });
});

// Akordeon FAQ
function przelaczFaq(przycisk) {
  var pozycja = przycisk.parentElement;
  var odpowiedz = pozycja.querySelector('.faq-odpowiedz');
  var otwarta = pozycja.classList.toggle('otwarta');
  przycisk.setAttribute('aria-expanded', otwarta ? 'true' : 'false');
  odpowiedz.style.maxHeight = otwarta ? odpowiedz.scrollHeight + 'px' : '0';
}

// Formularze (newsletter, kontakt, zapisy Biebrza): wysyłka do Cloudflare Workera (baza D1).
// Weryfikacja Turnstile odbywa się po stronie Workera (token jest jednorazowy - nie
// sprawdzamy go tutaj osobno, bo druga weryfikacja tego samego tokenu by się nie udała).
// Adres wklej po wdrożeniu workera - instrukcja w cf-worker/README.md i w INSTRUKCJA.md.
var FORMULARZE_API = 'https://deep-kind-forms.dkretreatfgh61bnql.workers.dev'; // np. https://deep-kind-forms.twoje-konto.workers.dev

async function wyslijFormularz(zdarzenie, endpoint) {
  zdarzenie.preventDefault();
  var formularz = zdarzenie.target;
  var info = formularz.parentElement.querySelector('.formularz-info');
  var przycisk = formularz.querySelector('button[type="submit"]');
  var tekstPrzycisku = przycisk.textContent;

  if (FORMULARZE_API.indexOf('WKLEJ-TU') !== -1) {
    if (info) {
      info.textContent = 'Formularz nie jest jeszcze podpięty do Cloudflare Workera - instrukcja w pliku INSTRUKCJA.md.';
      info.classList.remove('formularz-sukces');
      info.style.display = 'block';
    }
    return false;
  }

  przycisk.disabled = true;
  przycisk.textContent = 'Wysyłanie…';

  try {
    var odpowiedz = await fetch(FORMULARZE_API + endpoint, {
      method: 'POST',
      body: new FormData(formularz)
    });
    var wynik = await odpowiedz.json();
    if (!odpowiedz.ok) { throw new Error(wynik.blad || 'blad_wysylki'); }
    formularz.reset();
    if (window.turnstile) { window.turnstile.reset(formularz.querySelector('.cf-turnstile')); }
    if (info) {
      info.textContent = 'Dziękujemy! Zgłoszenie zostało wysłane.';
      info.classList.add('formularz-sukces');
      info.style.display = 'block';
    }
  } catch (blad) {
    if (info) {
      info.textContent = blad.message === 'weryfikacja_nieudana'
        ? 'Nie udało się potwierdzić, że jesteś człowiekiem. Spróbuj ponownie.'
        : 'Coś poszło nie tak. Spróbuj ponownie albo napisz na hello@deepkind.org.';
      info.classList.remove('formularz-sukces');
      info.style.display = 'block';
    }
  } finally {
    przycisk.disabled = false;
    przycisk.textContent = tekstPrzycisku;
  }

  return false;
}
