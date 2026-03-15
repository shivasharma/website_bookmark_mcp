// sidebar.js - minimal interactivity for sidebar.html
const sidebarButtons = document.querySelectorAll('.sidebar-section button');
sidebarButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    sidebarButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
