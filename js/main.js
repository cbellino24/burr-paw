(function () {
  "use strict";

  function pathDepth() {
    var path = window.location.pathname.replace(/\\/g, "/");
    var parts = path.split("/").filter(Boolean);
    if (parts.length && parts[parts.length - 1].indexOf(".") !== -1) {
      parts.pop();
    }
    // Estimate depth from folders relative to site root for local file opens
    var folders = ["products", "policies", "pages", "collections"];
    var depth = 0;
    parts.forEach(function (part) {
      if (folders.indexOf(part) !== -1) depth += 1;
    });
    return depth;
  }

  function basePrefix() {
    var depth = pathDepth();
    if (depth <= 0) return "";
    return new Array(depth + 1).join("../");
  }

  window.BURR_PAW = window.BURR_PAW || {};
  window.BURR_PAW.base = basePrefix();

  var cartCount = Number(localStorage.getItem("bp_cart_count") || 0);

  function updateCartUI() {
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(cartCount);
    });
  }

  function addToCart(qty) {
    cartCount += qty || 1;
    localStorage.setItem("bp_cart_count", String(cartCount));
    updateCartUI();
    showToast("Added to cart (demo)");
  }

  function showToast(message) {
    var toast = document.getElementById("site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  window.BURR_PAW.addToCart = addToCart;
  window.BURR_PAW.showToast = showToast;

  function initHeader() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".primary-nav");
    var searchToggle = document.querySelector("[data-search-toggle]");
    var searchDrawer = document.getElementById("search-drawer");
    if (!header) return;

    var backdrop = document.querySelector(".nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    }

    // Drawer footer links (created once)
    if (nav && !nav.querySelector(".nav-drawer-foot")) {
      var foot = document.createElement("div");
      foot.className = "nav-drawer-foot";
      var base = window.BURR_PAW.base || "";
      foot.innerHTML =
        '<a href="' + base + 'shop.html">Shop Burr Paw</a>' +
        '<a href="' + base + 'where-to-buy.html">Find a Store</a>' +
        '<a href="tel:+14023708050">1 (402) 370-8050</a>';
      nav.appendChild(foot);
    }

    function setNavOpen(open) {
      if (!toggle || !nav) return;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("is-nav-open", open);
      document.body.classList.toggle("is-nav-open", open);
      backdrop.classList.toggle("is-visible", open);
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") !== "true";
        setNavOpen(open);
      });

      backdrop.addEventListener("click", function () {
        setNavOpen(false);
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          setNavOpen(false);
        });
      });

      window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") setNavOpen(false);
      });

      window.addEventListener("resize", function () {
        // Match CSS: drawer through 1100px, or touch tablets through 1400px
        var isTouchTablet =
          window.matchMedia("(hover: none) and (pointer: coarse)").matches &&
          window.innerWidth <= 1400;
        if (window.innerWidth > 1100 && !isTouchTablet) setNavOpen(false);
      });
    }

    if (searchToggle && searchDrawer) {
      searchToggle.addEventListener("click", function () {
        setNavOpen(false);
        var isHidden = searchDrawer.hasAttribute("hidden");
        if (isHidden) {
          searchDrawer.removeAttribute("hidden");
          var input = searchDrawer.querySelector("input");
          if (input) input.focus();
        } else {
          searchDrawer.setAttribute("hidden", "");
        }
      });
    }
  }

  function initHeroVideo() {
    var video = document.querySelector(".hero-video video");
    var muteBtn = document.querySelector("[data-hero-mute]");
    var playBtn = document.querySelector("[data-hero-play]");
    if (!video) return;

    if (muteBtn) {
      muteBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted ? "Unmute" : "Mute";
      });
    }

    if (playBtn) {
      playBtn.addEventListener("click", function () {
        if (video.paused) {
          video.play();
          playBtn.textContent = "Pause";
        } else {
          video.pause();
          playBtn.textContent = "Play";
        }
      });
    }
  }

  function initReveals() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) {
        n.classList.add("is-in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  function initDemoForms() {
    document.querySelectorAll("[data-demo-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var success = form.querySelector(".form-success");
        if (success) success.classList.add("is-visible");
        form.reset();
        showToast("Message sent (demo)");
      });
    });
  }

  function initQty() {
    document.querySelectorAll("[data-qty]").forEach(function (wrap) {
      var input = wrap.querySelector("input");
      var minus = wrap.querySelector("[data-qty-minus]");
      var plus = wrap.querySelector("[data-qty-plus]");
      if (!input) return;
      if (minus) {
        minus.addEventListener("click", function () {
          input.value = String(Math.max(1, Number(input.value || 1) - 1));
        });
      }
      if (plus) {
        plus.addEventListener("click", function () {
          input.value = String(Math.max(1, Number(input.value || 1) + 1));
        });
      }
    });
  }

  function initAddButtons() {
    document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var qtyEl = document.querySelector("[data-qty] input");
        var qty = qtyEl ? Number(qtyEl.value || 1) : 1;
        addToCart(qty);
      });
    });
  }

  function initDemoVideo() {
    document.querySelectorAll("[data-demo-video]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("is-playing")) return;
        var id = btn.getAttribute("data-youtube-id");
        if (!id) return;

        var iframe = document.createElement("iframe");
        iframe.className = "demo__frame";
        iframe.src =
          "https://www.youtube.com/embed/" +
          encodeURIComponent(id) +
          "?autoplay=1&rel=0&modestbranding=1";
        iframe.title = "Burr Paw Demonstration";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;

        btn.classList.add("is-playing");
        btn.replaceChildren(iframe);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateCartUI();
    initHeader();
    initHeroVideo();
    initReveals();
    initDemoForms();
    initDemoVideo();
    initQty();
    initAddButtons();
  });
})();
