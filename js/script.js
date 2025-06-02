particlesJS("particles-js", {
  "particles": {
    "number": { "value": 20 },
    "color": { "value": "#00bfe0" },
    "shape": { "type": "circle" },
    "opacity": { "value": 0.5 },
    "size": { "value": 3 },
    "line_linked": {
      "enable": true,
      "distance": 250,
      "color": "#adadad",
      "opacity": 0.3,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 2,
      "direction": "none",
      "out_mode": "out"
    }
  },
  "interactivity": {
    "events": {
      "onhover": { "enable": true, "mode": "repulse" },
      "onclick": { "enable": true, "mode": "push" }
    },
    "modes": {
      "repulse": { "distance": 100 },
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});

window.addEventListener("load", (event) => {
  let options = {
    rootMargin: "0px",
    threshold: 0.2
  };

  const intersectionHandler = function(entries, observer) {
    entries.forEach((entry) => {
      console.log(entry.intersectionRatio)
      if (entry.isIntersecting) {
        entry.target.classList.remove("fadeOut");
        entry.target.classList.add("fadeIn");
      } else {
        entry.target.classList.remove("fadeIn");
        entry.target.classList.add("fadeOut");
      }
    });
  };

  let observer = new IntersectionObserver(intersectionHandler, options);
  document.querySelectorAll(".section").forEach((row, index) => {
    observer.observe(row);
  });
});