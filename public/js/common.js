// ================= AUTH UI =================
const authArea = document.getElementById("authArea");
const myOrdersLink = document.getElementById("myOrdersLink");
const cartCountEl = document.getElementById("cartCount");

const isLoggedIn = localStorage.getItem("isLoggedIn");
const userName = localStorage.getItem("userName");

if (authArea) {
  if (isLoggedIn === "true") {
    authArea.innerHTML = `
      <span class="user-name">👤 ${userName || "User"}</span>
      <a href="#" class="btn login-btn" onclick="logout()">Logout</a>
    `;
    if (myOrdersLink) {
      myOrdersLink.innerHTML = `<a href="/my-orders">My Orders</a>`;
    }
  } else {
    authArea.innerHTML = `
      <a href="/login" class="btn login-btn">Login</a>
      <a href="/signup" class="btn signup-btn">Sign Up</a>
    `;
  }
}

// ================= LOGOUT =================
function logout() {
  localStorage.clear();
  window.location.href = "/";
}

// ================= CART =================
function openCart() {
  if (localStorage.getItem("isLoggedIn") === "true") {
    window.location.href = "/cart";
  } else {
    alert("Please login first");
    window.location.href = "/login";
  }
}

// ================= CART COUNT =================
async function loadCartCount() {
  const userId = localStorage.getItem("userId");
  if (!userId || !cartCountEl) return;

  try {
    const res = await fetch(`/api/cart/${userId}`);
    const data = await res.json();

    let count = 0;
    if (data.items) {
      data.items.forEach(item => {
        count += item.quantity;
      });
    }

    cartCountEl.innerText = count;
  } catch {
    cartCountEl.innerText = 0;
  }
}

// Auto-load cart count
loadCartCount();

// ================= ADD TO CART =================
async function addToCart(name, price, image) {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("Please login first");
    window.location.href = "/login";
    return;
  }

  await fetch("/api/cart/add-to-cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, price, image })
  });

  loadCartCount(); // real-time update
  alert("Book added to cart");
}
