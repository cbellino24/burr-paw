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

  function addToCart(qty, productId) {
    if (!window.BURR_PAW_CART || !productId) {
      showToast("Could not add to cart");
      return;
    }
    window.BURR_PAW_CART
      .addFromProduct(productId, qty)
      .then(function (product) {
        showToast(product && product.title ? "Added " + product.title + " to cart" : "Added to cart");
      })
      .catch(function () {
        showToast("Could not add to cart");
      });
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
    var hero = document.querySelector(".hero-video");
    var video = document.querySelector(".hero-video video");
    var muteBtn = document.querySelector("[data-hero-mute]");
    var playBtn = document.querySelector("[data-hero-play]");
    var restoreBtn = document.querySelector("[data-hero-restore]");
    var content = document.querySelector(".hero-video__content");
    if (!video || !hero) return;

    function markReady() {
      video.classList.add("is-ready");
    }

    function setWatching(on) {
      hero.classList.toggle("is-watching", on);
      var copy = hero.querySelector(".hero-video__copy");
      if (copy) {
        if (on) copy.setAttribute("aria-hidden", "true");
        else copy.removeAttribute("aria-hidden");
      }
      if (restoreBtn) {
        if (on) restoreBtn.removeAttribute("hidden");
        else restoreBtn.setAttribute("hidden", "");
      }
    }

    // Reveal once a real frame is available (avoids stale poster sitting "behind" playback)
    if (video.readyState >= 2) {
      markReady();
    } else {
      video.addEventListener("loadeddata", markReady, { once: true });
      video.addEventListener("playing", markReady, { once: true });
    }

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        markReady();
      });
    }

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

    if (restoreBtn) {
      restoreBtn.addEventListener("click", function () {
        setWatching(false);
      });
    }

    // Tap/click the hero to clear copy and watch — keep Shop CTA
    if (content) {
      content.addEventListener("click", function (event) {
        var target = event.target;
        if (target.closest("a, button, input, label")) return;
        if (hero.classList.contains("is-watching")) return;
        setWatching(true);
      });
    }

    hero.addEventListener("click", function (event) {
      var target = event.target;
      if (target.closest(".hero-video__content, .hero-video__controls, a, button")) return;
      if (hero.classList.contains("is-watching")) return;
      setWatching(true);
    });
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
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var productId = btn.getAttribute("data-product-id");
        if (!productId) {
          showToast("Could not add to cart");
          return;
        }
        var qtyAttr = btn.getAttribute("data-qty");
        var qty;
        if (qtyAttr != null && qtyAttr !== "") {
          qty = Number(qtyAttr) || 1;
        } else {
          var qtyEl = document.querySelector("[data-qty] input");
          qty = qtyEl ? Number(qtyEl.value || 1) : 1;
        }
        addToCart(qty, productId);
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

  function initReviewCarousel() {
    var track = document.querySelector("[data-review-track]");
    var prev = document.querySelector("[data-review-prev]");
    var next = document.querySelector("[data-review-next]");
    if (!track || !prev || !next) return;

    function cardStep() {
      var card = track.querySelector(".review");
      if (!card) return 320;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function updateButtons() {
      var max = track.scrollWidth - track.clientWidth;
      var x = track.scrollLeft;
      prev.disabled = x <= 4;
      next.disabled = x >= max - 4;
    }

    function scrollByDir(dir) {
      track.scrollBy({ left: dir * cardStep(), behavior: "smooth" });
    }

    prev.addEventListener("click", function () {
      scrollByDir(-1);
    });
    next.addEventListener("click", function () {
      scrollByDir(1);
    });
    track.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  }

  function initLogoLoop() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.querySelectorAll("[data-logo-loop]").forEach(function (stage) {
      var frames = Array.prototype.slice.call(stage.querySelectorAll("img"));
      if (frames.length < 2) return;

      var caption = stage.parentElement
        ? stage.parentElement.querySelector("[data-logo-caption]")
        : null;
      var index = frames.findIndex(function (img) {
        return img.classList.contains("is-active");
      });
      if (index < 0) index = 0;

      function show(next) {
        frames.forEach(function (img, i) {
          img.classList.toggle("is-active", i === next);
        });
        if (caption) {
          var label = frames[next].getAttribute("data-caption") || "";
          caption.classList.add("is-swapping");
          window.setTimeout(function () {
            caption.textContent = label;
            caption.classList.remove("is-swapping");
          }, 180);
        }
        index = next;
      }

      window.setInterval(function () {
        show((index + 1) % frames.length);
      }, 3200);
    });
  }

  function initBookFilters() {
    var root = document.querySelector("[data-book-filters]");
    var grid = document.querySelector("[data-book-grid]");
    if (!root || !grid) return;

    var buttons = Array.prototype.slice.call(
      root.querySelectorAll("[data-book-filter]")
    );
    var books = Array.prototype.slice.call(
      grid.querySelectorAll("[data-book-category]")
    );

    function apply(filter) {
      buttons.forEach(function (btn) {
        var active = btn.getAttribute("data-book-filter") === filter;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
      });

      books.forEach(function (book) {
        var category = book.getAttribute("data-book-category");
        var show = filter === "all" || category === filter;
        book.classList.toggle("is-hidden", !show);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        apply(btn.getAttribute("data-book-filter") || "all");
      });
    });
  }

  function initCloseoutSlides() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.querySelectorAll("[data-closeout-slides]").forEach(function (stage) {
      var frames = Array.prototype.slice.call(stage.querySelectorAll("img"));
      if (frames.length < 2) return;

      var index = frames.findIndex(function (img) {
        return img.classList.contains("is-active");
      });
      if (index < 0) index = 0;

      window.setInterval(function () {
        index = (index + 1) % frames.length;
        frames.forEach(function (img, i) {
          img.classList.toggle("is-active", i === index);
        });
      }, 4500);
    });
  }

  function initProductGallery() {
    document.querySelectorAll("[data-product-gallery]").forEach(function (gallery) {
      var main = gallery.querySelector("[data-gallery-main]");
      var thumbs = Array.prototype.slice.call(
        gallery.querySelectorAll("[data-gallery-thumb]")
      );
      if (!main || thumbs.length < 2) return;

      thumbs.forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          var src = thumb.getAttribute("data-gallery-thumb");
          if (!src) return;
          main.src = src;
          thumbs.forEach(function (btn) {
            var active = btn === thumb;
            btn.classList.toggle("is-active", active);
            if (active) btn.setAttribute("aria-current", "true");
            else btn.removeAttribute("aria-current");
          });
        });
      });
    });
  }

  function initNewsletterPopup() {
    var root = document.querySelector("[data-newsletter-popup]");
    if (!root) return;

    var storageKey = "burrpaw-nl-subscribed";
    var delayMs = 4500;
    var previouslyFocused = null;
    var dialog = root.querySelector(".nl-popup__dialog");
    var form = root.querySelector("[data-newsletter-form]");
    var success = root.querySelector("[data-newsletter-success]");
    var emailInput = root.querySelector("#nl-popup-email");

    function hasSubscribed() {
      try {
        return window.localStorage.getItem(storageKey) === "1";
      } catch (err) {
        return false;
      }
    }

    function markSubscribed() {
      try {
        window.localStorage.setItem(storageKey, "1");
      } catch (err) {
        /* ignore private mode / quota */
      }
    }

    function getFocusable() {
      if (!dialog) return [];
      return Array.prototype.slice.call(
        dialog.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (el) {
        return !el.hasAttribute("hidden") && el.offsetParent !== null;
      });
    }

    function openPopup() {
      if (root.classList.contains("is-open")) return;
      previouslyFocused = document.activeElement;
      root.hidden = false;
      // Force reflow so the open transition runs
      void root.offsetWidth;
      root.classList.add("is-open");
      document.body.classList.add("is-nl-popup-open");
      window.setTimeout(function () {
        if (emailInput && !root.classList.contains("is-success")) emailInput.focus();
        else if (dialog) {
          var focusable = getFocusable();
          if (focusable[0]) focusable[0].focus();
        }
      }, 40);
    }

    function closePopup() {
      if (!root.classList.contains("is-open") && root.hidden) return;
      root.classList.remove("is-open");
      document.body.classList.remove("is-nl-popup-open");
      window.setTimeout(function () {
        root.hidden = true;
        if (previouslyFocused && typeof previouslyFocused.focus === "function") {
          previouslyFocused.focus();
        }
      }, 320);
    }

    root.querySelectorAll("[data-newsletter-dismiss]").forEach(function (el) {
      el.addEventListener("click", function () {
        closePopup();
      });
    });

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        root.classList.add("is-success");
        if (success) success.hidden = false;
        markSubscribed();
        showToast("Welcome code: WELCOME10");
        form.reset();
        var closeBtn = root.querySelector(".nl-popup__close");
        if (closeBtn) closeBtn.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!root.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closePopup();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      var focusable = getFocusable();
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Only skip after they’ve submitted an email; dismiss still reopens next visit
    if (hasSubscribed()) return;

    window.setTimeout(function () {
      openPopup();
    }, delayMs);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.BURR_PAW_CART) window.BURR_PAW_CART.updateHeaderBadge();
    initHeader();
    initHeroVideo();
    initReveals();
    initDemoForms();
    initDemoVideo();
    initQty();
    initAddButtons();
    initReviewCarousel();
    initLogoLoop();
    initBookFilters();
    initCloseoutSlides();
    initProductGallery();
    initNewsletterPopup();
  });
})();
