/**
 * Burr Paw cart page renderer (includes free-shipping progress bar)
 */
(function () {
  "use strict";

  var page = document.querySelector("[data-cart-page]");
  if (!page || !window.BURR_PAW_CART) return;

  var itemsEl = document.querySelector("[data-cart-items]");
  var summaryEl = document.querySelector("[data-cart-summary]");
  var emptyEl = document.querySelector("[data-cart-empty]");
  var progressEl = document.querySelector("[data-cart-progress]");

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function shippingProgressHtml(subtotal) {
    var threshold = window.BURR_PAW_CART.FREE_SHIPPING_THRESHOLD;
    var remaining = Math.max(0, threshold - subtotal);
    var pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    var unlocked = remaining <= 0;
    var label = unlocked
      ? "You’ve unlocked free shipping"
      : "Spend " +
        window.BURR_PAW_CART.formatPrice(remaining) +
        " more to get free shipping";
    var meta = unlocked
      ? "Free shipping applied"
      : window.BURR_PAW_CART.formatPrice(subtotal) +
        " / " +
        window.BURR_PAW_CART.formatPrice(threshold);

    return (
      '<div class="shipping-progress' +
      (unlocked ? " is-complete" : "") +
      '" role="status" aria-live="polite">' +
      '<div class="shipping-progress__copy">' +
      '<p class="shipping-progress__label">' +
      label +
      "</p>" +
      '<p class="shipping-progress__meta">' +
      meta +
      "</p>" +
      "</div>" +
      '<div class="shipping-progress__track" aria-hidden="true">' +
      '<div class="shipping-progress__fill" style="width:' +
      pct +
      '%"></div>' +
      "</div>" +
      '<span class="sr-only">Free shipping progress: ' +
      pct +
      " percent</span>" +
      "</div>"
    );
  }

  function render() {
    var items = window.BURR_PAW_CART.getItems();
    var hasItems = items.length > 0;
    var subtotal = window.BURR_PAW_CART.getSubtotal();

    if (itemsEl) itemsEl.hidden = !hasItems;
    if (summaryEl) summaryEl.hidden = !hasItems;
    if (emptyEl) emptyEl.hidden = hasItems;
    if (progressEl) {
      progressEl.hidden = !hasItems;
      if (hasItems) progressEl.innerHTML = shippingProgressHtml(subtotal);
    }
    if (!hasItems) return;

    itemsEl.innerHTML = items
      .map(function (item) {
        var img = window.BURR_PAW_CART.resolveUrl(item.image);
        var url = window.BURR_PAW_CART.resolveUrl(item.url);
        return (
          '<article class="cart-item" data-cart-item="' +
          esc(item.id) +
          '">' +
          '<a class="cart-item__image" href="' +
          esc(url) +
          '"><img src="' +
          esc(img) +
          '" alt="" loading="lazy" width="160" height="160"></a>' +
          '<div class="cart-item__details">' +
          '<h2 class="cart-item__title"><a href="' +
          esc(url) +
          '">' +
          esc(item.title) +
          "</a></h2>" +
          '<p class="cart-item__price">' +
          window.BURR_PAW_CART.formatPrice(item.price) +
          "</p>" +
          "</div>" +
          '<div class="cart-item__actions">' +
          '<div class="cart-qty">' +
          '<button type="button" class="cart-qty__btn" data-cart-qty-minus aria-label="Decrease quantity">−</button>' +
          '<input type="number" class="cart-qty__input" value="' +
          item.quantity +
          '" min="1" max="99" aria-label="Quantity" data-cart-qty-input>' +
          '<button type="button" class="cart-qty__btn" data-cart-qty-plus aria-label="Increase quantity">+</button>' +
          "</div>" +
          '<p class="cart-item__line-total">' +
          window.BURR_PAW_CART.formatPrice(item.price * item.quantity) +
          "</p>" +
          '<button type="button" class="cart-item__remove" data-cart-remove>Remove</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    var shipping = window.BURR_PAW_CART.shippingEstimate(subtotal);
    var total = subtotal + shipping;
    var checkoutHref = window.BURR_PAW_CART.useShopify()
      ? "/checkout"
      : "mailto:Lindsey@Burrpaw.com?subject=" +
        encodeURIComponent("Burr Paw order request") +
        "&body=" +
        encodeURIComponent(buildEmailBody(items, subtotal, shipping, total));

    summaryEl.innerHTML =
      '<div class="cart-summary">' +
      '<h2 class="cart-summary__title">Order summary</h2>' +
      shippingProgressHtml(subtotal) +
      '<div class="cart-summary__row"><span>Subtotal</span><span>' +
      window.BURR_PAW_CART.formatPrice(subtotal) +
      "</span></div>" +
      '<div class="cart-summary__row"><span>Shipping</span><span>' +
      (shipping === 0 ? "Free" : window.BURR_PAW_CART.formatPrice(shipping)) +
      "</span></div>" +
      '<div class="cart-summary__row cart-summary__row--total"><span>Total</span><span>' +
      window.BURR_PAW_CART.formatPrice(total) +
      "</span></div>" +
      '<a class="btn btn--blaze cart-summary__checkout" href="' +
      checkoutHref +
      '">' +
      (window.BURR_PAW_CART.useShopify() ? "Checkout" : "Email order") +
      "</a>" +
      (window.BURR_PAW_CART.useShopify()
        ? ""
        : '<p class="cart-summary__fine">We’ll confirm your order and send payment details by email. On Shopify this becomes a live checkout.</p>') +
      '<a class="cart-summary__continue" href="shop.html">Continue shopping</a>' +
      "</div>";

    bindEvents();
  }

  function buildEmailBody(items, subtotal, shipping, total) {
    var lines = items.map(function (item) {
      return (
        item.quantity +
        "x " +
        item.title +
        " — " +
        window.BURR_PAW_CART.formatPrice(item.price * item.quantity)
      );
    });
    lines.push("");
    lines.push("Subtotal: " + window.BURR_PAW_CART.formatPrice(subtotal));
    lines.push("Shipping: " + (shipping === 0 ? "Free" : window.BURR_PAW_CART.formatPrice(shipping)));
    lines.push("Total: " + window.BURR_PAW_CART.formatPrice(total));
    return lines.join("\n");
  }

  function bindEvents() {
    if (!itemsEl) return;
    itemsEl.querySelectorAll("[data-cart-item]").forEach(function (row) {
      var id = row.getAttribute("data-cart-item");
      var input = row.querySelector("[data-cart-qty-input]");
      var minus = row.querySelector("[data-cart-qty-minus]");
      var plus = row.querySelector("[data-cart-qty-plus]");
      var removeBtn = row.querySelector("[data-cart-remove]");

      function setQty(next) {
        window.BURR_PAW_CART.updateQuantity(id, next).then(render);
      }

      if (minus) {
        minus.addEventListener("click", function () {
          setQty(Math.max(0, Number(input.value || 1) - 1));
        });
      }
      if (plus) {
        plus.addEventListener("click", function () {
          setQty(Math.min(99, Number(input.value || 1) + 1));
        });
      }
      if (input) {
        input.addEventListener("change", function () {
          setQty(Number(input.value || 1));
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener("click", function () {
          window.BURR_PAW_CART.removeItem(id).then(render);
        });
      }
    });
  }

  document.addEventListener("burrpaw:cart-updated", render);
  render();
})();
