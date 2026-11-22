// Bouton « Copier le lien » : seul script du site public.
// Sans JavaScript, les boutons restent cachés et le lien reste visible à côté.
document.querySelectorAll('[data-copier]').forEach((bouton) => {
  if (!navigator.clipboard) return;
  bouton.hidden = false;
  bouton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(bouton.dataset.copier);
      bouton.textContent = 'Lien copié ✓';
      bouton.dataset.copie = '';
    } catch {
      bouton.textContent = 'Copie impossible : sélectionnez le lien';
    }
    setTimeout(() => { bouton.textContent = 'Copier le lien'; delete bouton.dataset.copie; }, 2500);
  });
});
