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

// Przycisk "Dołącz do najbliższego wyjazdu" - kieruje do podstrony edycji z najbliższą
// datą startu (najwcześniejsza edycja, która się jeszcze nie zaczęła). Jedno źródło
// prawdy o terminach: przy dodaniu nowej edycji dopisz ją tutaj z datą "YYYY-MM-DD".
// Edycje bez potwierdzonego terminu pomijamy. Bez JS button zostaje na /pl/retreats.
var WYJAZDY = [
  { start: '2026-09-11', url: '/pl/retreats/biebrza-edition' }
];

function ustawNajblizszyWyjazd() {
  var przycisk = document.querySelector('[data-najblizszy-wyjazd]');
  if (!przycisk) { return; }
  var dzis = new Date();
  dzis.setHours(0, 0, 0, 0);
  var najblizszy = WYJAZDY
    .filter(function (w) { return new Date(w.start + 'T00:00:00') >= dzis; })
    .sort(function (a, b) { return a.start < b.start ? -1 : 1; })[0];
  if (najblizszy) { przycisk.setAttribute('href', najblizszy.url); }
}
ustawNajblizszyWyjazd();

// Akordeon FAQ
function przelaczFaq(przycisk) {
  var pozycja = przycisk.parentElement;
  var odpowiedz = pozycja.querySelector('.faq-odpowiedz');
  var otwarta = pozycja.classList.toggle('otwarta');
  przycisk.setAttribute('aria-expanded', otwarta ? 'true' : 'false');
  odpowiedz.style.maxHeight = otwarta ? odpowiedz.scrollHeight + 'px' : '0';
}
