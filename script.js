// Minimal interactivity: mobile nav toggle, donate placeholder, contact form -> mailto
document.addEventListener('DOMContentLoaded', function(){
  // year in footer
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('nav-toggle');
  const siteNav = document.getElementById('site-nav');
  if(navToggle && siteNav){
    navToggle.addEventListener('click', function(){
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      if(!expanded){
        siteNav.setAttribute('open','');
      } else {
        siteNav.removeAttribute('open');
      }
    });
  }
});

function openDonate(){
  // Placeholder behavior: show a simple confirmation and redirect to a donate page if desired.
  const url = 'https://example.com/donate';
  const ok = confirm('This demo will open an external donate page. Continue?');
  if(ok) window.open(url, '_blank');
}

function handleContact(ev){
  // legacy handler removed; this function is kept for backwards compat but not used.
}

// New contact form submission via fetch to /api/contact
document.addEventListener('DOMContentLoaded', function(){
  const contactForm = document.getElementById('contact-form');
  if(!contactForm) return;
  contactForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const form = e.target;
    // Decide where to post:
    // - Local dev (Express server): POST JSON to /api/contact
    // - Deployed to Netlify: POST FormData to form action ("/"), Netlify will capture the submission
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    if(!name || !email || !message){
      alert('Please complete all fields.');
      return;
    }

    try{
      if(isLocal){
        // send JSON to local Express server
        const resp = await fetch('/api/contact', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ name, email, message })
        });
        if(resp.ok){
          alert('Thank you — your message was sent. We will follow up shortly.');
          form.reset();
        } else {
          const body = await resp.json().catch(()=>({}));
          alert('Submission failed: ' + (body.error || resp.statusText || 'Unknown error'));
        }
      } else {
        // send as FormData so Netlify Forms can capture it
        const formData = new FormData(form);
        // ensure form-name is present for Netlify
        if(!formData.get('form-name')) formData.set('form-name', form.getAttribute('name') || 'contact');
        const resp = await fetch(form.action || '/', { method: 'POST', body: formData });
        if(resp.ok || resp.status === 0){
          // Netlify may redirect; treat as success
          alert('Thank you — your message was sent. We will follow up shortly.');
          form.reset();
        } else {
          alert('Submission failed: ' + (resp.statusText || resp.status));
        }
      }
    } catch(err){
      console.error(err);
      alert('Network error while sending your message. Please try again later.');
    }
  });
});

