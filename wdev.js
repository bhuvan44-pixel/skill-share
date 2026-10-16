document.addEventListener("DOMContentLoaded", () => {

  const header = document.querySelector(".site-header");

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  });

  const nav = document.querySelector(".navbar");

  const burger = document.createElement("button");
  burger.className = "burger";
  
  burger.setAttribute("aria-label", "Toggle navigation");
  burger.setAttribute("aria-expanded", "false");
  burger.innerHTML = `<span></span><span></span><span></span>`;
  header.appendChild(burger);

  burger.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    burger.classList.toggle("active", isOpen);
    burger.setAttribute("aria-expanded", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.classList.remove("active");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });

  const sections = document.querySelectorAll("section[id], main[id]");
  const navLinks = document.querySelectorAll(".navbar a");

  const observerNav = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`
            );
          });
        }
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );

  sections.forEach((sec) => observerNav.observe(sec));

  const revealTargets = document.querySelectorAll(
    ".hero-copy, .hero-visual, .section-wrap h2, .section-wrap .lead, .section-wrap > p, .skill-list, .project-card, .contact-links, #contact h2"
  );

  revealTargets.forEach((el) => el.classList.add("reveal"));

  const observerReveal = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((el) => observerReveal.observe(el));

  const heroH1 = document.querySelector(".hero h1");
  if (heroH1) {
    const fullText = heroH1.textContent;
    heroH1.textContent = "";
    heroH1.classList.add("typing-cursor");

    let i = 0;
    const typeSpeed = 70;

    function typeChar() {
      if (i < fullText.length) {
        heroH1.textContent += fullText.charAt(i);
        i++;
        setTimeout(typeChar, typeSpeed);
      } else {
        setTimeout(() => heroH1.classList.remove("typing-cursor"), 1200);
      }
    }

    setTimeout(typeChar, 400);
  }

  const cards = document.querySelectorAll(".project-card");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateY = ((x - midX) / midX) * 6;  
      const rotateX = ((midY - y) / midY) * 6;

      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  document.querySelectorAll(".skill-list li").forEach((li, idx) => {
    li.style.transitionDelay = `${idx * 60}ms`;
  });

  const topBtn = document.createElement("button");
  topBtn.className = "scroll-top";
  topBtn.setAttribute("aria-label", "Scroll to top");
  topBtn.innerHTML = "&#8593;"; // ↑ arrow
  document.body.appendChild(topBtn);

  window.addEventListener("scroll", () => {
    topBtn.classList.toggle("visible", window.scrollY > 500);
  });

  topBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});