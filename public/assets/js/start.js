/* Ładowany w <head> BEZ defer: klasa .js, włączenie animacji przy przewijaniu oraz przejścia między podstronami (View Transitions). */
(function () {
  var de = document.documentElement;
  de.classList.add('js');
  var reduce = false, off = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var m = document.querySelector('meta[name="np:anim"]');
  off = !!(m && m.content === '0');
  if (!reduce && !off) de.classList.add('np-anim');
  // Typ przejścia: obrót karty 3D na komputerze, zwykłe przenikanie na telefonie.
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    try { e.viewTransition.types.add(matchMedia('(max-width:760px)').matches ? 'np-fade' : 'np-flip'); } catch (x) {}
  });
  // Link do tej samej strony nie uruchamia przejścia.
  addEventListener('pageswap', function (e) {
    try {
      var a = e.activation;
      if (e.viewTransition && a && a.from && a.entry && a.from.url === a.entry.url) e.viewTransition.skipTransition();
    } catch (x) {}
  });
})();
