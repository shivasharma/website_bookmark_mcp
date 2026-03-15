// maincontent.js - minimal interactivity for maincontent.html
const searchInput = document.querySelector('.dashboard-header input[type="text"]');
if (searchInput) {
  searchInput.addEventListener('input', function() {
    // Placeholder: implement search/filter logic here
    // For now, just log the value
    console.log('Search:', searchInput.value);
  });
}
