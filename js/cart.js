/**
 * Burr Paw cart — localStorage now, Shopify Ajax when variant IDs are set.
 * Mirrors the Rowem cart pattern used on rowemproducts.com.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "burr-paw-cart";
  var FREE_SHIPPING_THRESHOLD = 50;
  var FLAT_RATE_SHIPPING = 7.5;

  function basePrefix() {
    return (window.BURR_PAW && window.BURR_PAW.base) || "";
  }

  function useShopify() {
    if (window.BURR_PAW_USE_SHOPIFY === true) return true;
    return !!(window.Shopify && window.Shopify.shop);
  }

  function getItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateHeaderBadge();
    document.dispatchEvent(new CustomEvent("burrpaw:cart-updated"));
  }

  function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
  }

  function getCount() {
    return getItems().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function getSubtotal() {
    return getItems().reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function updateHeaderBadge() {
    var count = getCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(count);
    });
  }

  function resolveUrl(path) {
    if (!path) return basePrefix() + "shop.html";
    if (/^https?:\/\//i.test(path) || path.charAt(0) === "/") return path;
    return basePrefix() + path;
  }

  function addItem(item) {
    var items = getItems();
    var existing = items.find(function (entry) {
      return entry.id === item.id;
    });

    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + (item.quantity || 1));
    } else {
      items.push({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
        url: item.url,
        shopifyVariantId: item.shopifyVariantId || null
      });
    }

    saveItems(items);
  }

  function addFromProduct(productId, quantity) {
    var catalog = window.BURR_PAW_PRODUCTS || {};
    var product = catalog[productId];
    if (!product) return Promise.reject(new Error("Unknown product: " + productId));

    var qty = Math.max(1, Number(quantity) || 1);

    if (useShopify() && product.shopifyVariantId) {
      return fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          items: [{ id: product.shopifyVariantId, quantity: qty }]
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Could not add to cart");
          return res.json();
        })
        .then(function () {
          return fetch("/cart.js").then(function (r) {
            return r.json();
          });
        })
        .then(function (cart) {
          syncFromShopifyCart(cart);
          return product;
        });
    }

    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: qty,
      image: product.image,
      url: product.url,
      shopifyVariantId: product.shopifyVariantId
    });
    return Promise.resolve(product);
  }

  function syncFromShopifyCart(cart) {
    if (!cart || !cart.items) return;
    var catalog = window.BURR_PAW_PRODUCTS || {};
    var mapped = cart.items.map(function (line) {
      var match = Object.keys(catalog).find(function (key) {
        return String(catalog[key].shopifyVariantId) === String(line.variant_id);
      });
      var product = match ? catalog[match] : null;
      return {
        id: product ? product.id : String(line.variant_id),
        title: line.product_title || line.title,
        price: line.price / 100,
        quantity: line.quantity,
        image: line.image || (product && product.image) || "",
        url: product ? product.url : "/products/" + (line.handle || ""),
        shopifyVariantId: line.variant_id,
        key: line.key
      };
    });
    saveItems(mapped);
  }

  function refreshFromShopify() {
    if (!useShopify()) return Promise.resolve(getItems());
    return fetch("/cart.js")
      .then(function (r) {
        return r.json();
      })
      .then(function (cart) {
        syncFromShopifyCart(cart);
        return getItems();
      });
  }

  function updateQuantity(id, quantity) {
    var items = getItems();
    var item = items.find(function (entry) {
      return entry.id === id;
    });
    if (!item) return Promise.resolve();

    if (quantity < 1) return removeItem(id);

    if (useShopify() && item.shopifyVariantId) {
      return fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: item.key || item.shopifyVariantId, quantity: quantity })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Could not update cart");
          return refreshFromShopify();
        });
    }

    item.quantity = Math.min(99, quantity);
    saveItems(items);
    return Promise.resolve();
  }

  function removeItem(id) {
    var items = getItems();
    var item = items.find(function (entry) {
      return entry.id === id;
    });

    if (useShopify() && item && item.shopifyVariantId) {
      return fetch("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: item.key || item.shopifyVariantId, quantity: 0 })
      }).then(function () {
        return refreshFromShopify();
      });
    }

    saveItems(
      items.filter(function (entry) {
        return entry.id !== id;
      })
    );
    return Promise.resolve();
  }

  function clearCart() {
    if (useShopify()) {
      return fetch("/cart/clear.js", { method: "POST" }).then(function () {
        saveItems([]);
      });
    }
    saveItems([]);
    return Promise.resolve();
  }

  function shippingEstimate(subtotal) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return FLAT_RATE_SHIPPING;
  }

  window.BURR_PAW_CART = {
    FREE_SHIPPING_THRESHOLD: FREE_SHIPPING_THRESHOLD,
    FLAT_RATE_SHIPPING: FLAT_RATE_SHIPPING,
    getItems: getItems,
    getCount: getCount,
    getSubtotal: getSubtotal,
    addItem: addItem,
    addFromProduct: addFromProduct,
    updateQuantity: updateQuantity,
    removeItem: removeItem,
    clearCart: clearCart,
    updateHeaderBadge: updateHeaderBadge,
    formatPrice: formatPrice,
    resolveUrl: resolveUrl,
    useShopify: useShopify,
    refreshFromShopify: refreshFromShopify,
    shippingEstimate: shippingEstimate
  };

  if (useShopify()) {
    refreshFromShopify().catch(function () {
      updateHeaderBadge();
    });
  } else {
    updateHeaderBadge();
  }
})();
