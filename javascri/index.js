const cartKey = 'queens-teddy-cart';
const cartData = JSON.parse(localStorage.getItem(cartKey) || '[]');

const usersKey = 'queens-teddy-users';
const authKey = 'queens-teddy-current-user';
let currentUser = JSON.parse(localStorage.getItem(authKey) || 'null');

const cartCountEls = document.querySelectorAll('.cart-count');
const cartPageContainer = document.querySelector('.cart-page');
const pagePath = window.location.pathname;

const getStoredUsers = () => {
  return JSON.parse(localStorage.getItem(usersKey) || '[]');
}

const saveStoredUsers = (users) => {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

const hashPassword = async (password) => {
  if (!password) return '';
  if (!window.crypto?.subtle) {
    return btoa(password);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashString = hashArray.map(byte => String.fromCharCode(byte)).join('');
  return btoa(hashString);
}

const setCurrentUser = (user) => {
  currentUser = user;
  localStorage.setItem(authKey, JSON.stringify(user));
}

const clearCurrentUser = () => {
  currentUser = null;
  localStorage.removeItem(authKey);
}

const renderUserNav = () => {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks || !currentUser) return;

  const existing = document.querySelector('.auth-link');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'auth-link';

  const welcome = document.createElement('span');
  welcome.className = 'nav-welcome';
  welcome.textContent = `Hi, ${currentUser.name}`;

  const signout = document.createElement('a');
  signout.className = 'signout-link';
  signout.href = '#';
  signout.textContent = 'Sign Out';
  signout.addEventListener('click', event => {
    event.preventDefault();
    clearCurrentUser();
    redirectToAuthPage();
  });

  wrapper.appendChild(welcome);
  wrapper.appendChild(signout);
  navLinks.appendChild(wrapper);
}

const getAuthPageUrl = (pageName) => {
  const inHtmlFolder = /\/html\//i.test(window.location.pathname);
  return inHtmlFolder ? pageName : `./html/${pageName}`;
}

const buildAbsoluteUrl = (relativePath) => {
  return new URL(relativePath, window.location.href).href;
}

const redirectToAuthPage = () => {
  localStorage.setItem('queens-teddy-redirect', window.location.pathname + window.location.search);
  window.location.href = buildAbsoluteUrl(getAuthPageUrl('signin.html'));
}

const redirectToHome = () => {
  const inHtmlFolder = /\/html\//i.test(window.location.pathname);
  const destination = inHtmlFolder ? '../index.html' : 'index.html';
  window.location.href = buildAbsoluteUrl(destination);
}

const isAuthPage = () => {
  return /signin\.html|signup\.html/i.test(window.location.pathname);
}

const getRedirectTarget = () => {
  const saved = localStorage.getItem('queens-teddy-redirect');
  if (!saved) return null;
  localStorage.removeItem('queens-teddy-redirect');
  return saved;
}

const initAuthForms = () => {
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');

  if (signinForm) {
    signinForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(signinForm);
      const email = formData.get('email')?.toString().trim().toLowerCase();
      const password = formData.get('password')?.toString().trim();

      if (!email || !password) {
        alert('Enter both email and password.');
        return;
      }

      const hashedPassword = await hashPassword(password);
      const users = getStoredUsers();
      const user = users.find(item => item.email === email && item.password === hashedPassword);
      if (!user) {
        alert('Wrong credentials. Please sign up or try again.');
        return;
      }

      setCurrentUser({ name: user.name, email: user.email });
      createToast(`Welcome back, ${user.name}!`);
      const target = getRedirectTarget();
      if (target) {
        window.location.href = buildAbsoluteUrl(target);
      } else {
        redirectToHome();
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(signupForm);
      const name = formData.get('name')?.toString().trim();
      const email = formData.get('email')?.toString().trim().toLowerCase();
      const password = formData.get('password')?.toString().trim();
      const confirm = formData.get('confirm')?.toString().trim();

      if (!name || !email || !password || !confirm) {
        alert('Please fill all fields.');
        return;
      }
      if (password !== confirm) {
        alert('Passwords do not match.');
        return;
      }

      const users = getStoredUsers();
      if (users.some(user => user.email === email)) {
        alert('Email already registered. Please sign in.');
        return;
      }

      const hashedPassword = await hashPassword(password);
      users.push({ name, email, password: hashedPassword });
      saveStoredUsers(users);
      setCurrentUser({ name, email });
      alert(`Welcome, ${name}! Your account is ready.`);
      const target = getRedirectTarget();
      if (target) {
        window.location.href = buildAbsoluteUrl(target);
      } else {
        redirectToHome();
      }
    });
  }
}

const initAuth = () => {
  if (isAuthPage()) {
    if (currentUser) {
      redirectToHome();
      return;
    }
    initAuthForms();
    return;
  }

  if (!currentUser) {
    redirectToAuthPage();
    return;
  }

  renderUserNav();
}

const formatPrice = (value) => {
  return value.toLocaleString('en-US');
}

const getButtonData = (button) => {
  const card = button.closest('.card');
  if (!card) return null;
  const title = card.querySelector('h1')?.textContent.trim();
  const priceText = card.querySelector('p')?.textContent || '';
  const imageSrc = card.querySelector('img')?.src || '';
  const priceMatch = priceText.match(/\d[\d,]*/);
  const price = priceMatch ? Number(priceMatch[0].replace(/,/g, '')) : 0;
  return { title, price, imageSrc };
}

const updateCartCount = () => {
  const count = cartData.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEls.forEach(el => { el.textContent = count; });
}

const saveCart = () => {
  localStorage.setItem(cartKey, JSON.stringify(cartData));
  updateCartCount();
}

const createToast = (message) => {
  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.textContent = message;

  const container = document.querySelector('.toast-container') || document.createElement('div');
  container.className = 'toast-container';
  if (!document.body.contains(container)) document.body.appendChild(container);
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

const paymentDeadlineKey = 'queens-teddy-payment-deadline';
let paymentDeadline = Number(localStorage.getItem(paymentDeadlineKey)) || null;
let paymentTimerId = null;

const openPaymentModal = () => {
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;
  modal.classList.add('visible');
  modal.querySelector('.payment-form')?.classList.add('hidden');
  modal.querySelector('.payment-success')?.classList.add('hidden');
  modal.querySelectorAll('.payment-fields').forEach(el => el.classList.add('hidden'));
  modal.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('active'));
  stopPaymentTimer();
}

const closePaymentModal = () => {
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  const form = modal.querySelector('.payment-form');
  const success = modal.querySelector('.payment-success');
  if (form) form.classList.add('hidden');
  if (success) success.classList.add('hidden');
  modal.querySelectorAll('.payment-fields').forEach(el => el.classList.add('hidden'));
  stopPaymentTimer();
}

const getTimeRemaining = () => {
  if (!paymentDeadline) return 0;
  return Math.max(0, paymentDeadline - Date.now());
}

const formatCountdown = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const updatePaymentTimer = () => {
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;
  const timerContainer = modal.querySelector('.payment-timer');
  const payNowButton = modal.querySelector('.payment-form button[type="submit"]');
  const remaining = getTimeRemaining();
  if (!timerContainer || !payNowButton) return;

  if (remaining <= 0) {
    timerContainer.textContent = 'Payment time expired. Please restart checkout.';
    payNowButton.disabled = true;
    stopPaymentTimer();
    return;
  }

  timerContainer.textContent = `Time remaining: ${formatCountdown(remaining)}`;
  payNowButton.disabled = false;
}

const startPaymentTimer = () => {
  if (!paymentDeadline || getTimeRemaining() <= 0) {
    paymentDeadline = Date.now() + 45 * 60 * 1000;
    localStorage.setItem(paymentDeadlineKey, String(paymentDeadline));
  }
  updatePaymentTimer();
  stopPaymentTimer();
  paymentTimerId = window.setInterval(updatePaymentTimer, 1000);
}

const stopPaymentTimer = () => {
  if (paymentTimerId) {
    window.clearInterval(paymentTimerId);
    paymentTimerId = null;
  }
}

const setPaymentMethod = (method) => {
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;
  modal.querySelectorAll('.payment-method').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === method);
  });
  const form = modal.querySelector('.payment-form');
  if (!form) return;
  form.classList.remove('hidden');
  modal.querySelectorAll('.payment-fields').forEach(el => el.classList.add('hidden'));
  const selected = modal.querySelector(`.${method}-fields`);
  if (selected) selected.classList.remove('hidden');
  if (method === 'account') {
    modal.querySelector('.payment-timer')?.classList.remove('hidden');
    startPaymentTimer();
  } else {
    modal.querySelector('.payment-timer')?.classList.add('hidden');
    stopPaymentTimer();
  }
  modal.querySelector('#notifyEmail')?.focus();
}

const generateOrderReference = () => {
  return `TEDDY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

const showPaymentSuccess = (notificationEmail, orderRef) => {
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;
  const form = modal.querySelector('.payment-form');
  const success = modal.querySelector('.payment-success');
  if (form) form.classList.add('hidden');
  if (success) {
    success.classList.remove('hidden');
    success.innerHTML = `
      <h2>Payment Complete</h2>
      <p>Congratulations! We will get back to you through <strong>${notificationEmail}</strong>.</p>
      <p>Your order reference is <strong>${orderRef}</strong>.</p>
      <button class="action-btn close-modal">Close</button>`;
    success.querySelector('.close-modal')?.addEventListener('click', closePaymentModal);
  }
}

const initializePaymentModal = () => {
  const modal = document.querySelector('.payment-modal');
  if (!modal) return;

  modal.querySelector('.close-modal')?.addEventListener('click', closePaymentModal);
  modal.querySelectorAll('.payment-method').forEach(button => {
    button.addEventListener('click', () => setPaymentMethod(button.dataset.method));
  });

  const form = modal.querySelector('.payment-form');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const selectedMethod = modal.querySelector('.payment-method.active')?.dataset.method;
    if (!selectedMethod) {
      createToast('Select a payment method first.');
      return;
    }
    const notifyInput = form.querySelector('#notifyEmail');
    const notificationEmail = notifyInput?.value.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!notificationEmail || !emailPattern.test(notificationEmail)) {
      createToast('Enter a valid notification email.');
      return;
    }

    if (selectedMethod === 'card') {
      const cardNumber = form.querySelector('#cardNumber')?.value.trim();
      const expiry = form.querySelector('#expiry')?.value.trim();
      const cvv = form.querySelector('#cvv')?.value.trim();
      if (!cardNumber || !expiry || !cvv) {
        createToast('Please complete your card details before paying.');
        return;
      }
    }

    if (selectedMethod === 'account') {
      const receiptInput = form.querySelector('#receiptUpload');
      const receiptFile = receiptInput?.files?.[0];
      if (!receiptFile) {
        createToast('Upload your transfer receipt to complete payment.');
        return;
      }
      if (getTimeRemaining() <= 0) {
        createToast('Payment time has expired. Please restart checkout.');
        return;
      }
    }
    const orderRef = generateOrderReference();
    showPaymentSuccess(notificationEmail, orderRef);
    createToast(`Congratulations! We will get back to you through ${notificationEmail}.`);
    cartData.length = 0;
    saveCart();
    renderCartPage();
    stopPaymentTimer();
    localStorage.removeItem(paymentDeadlineKey);
  });
}

const addCartItem = (data) => {
  const existing = cartData.find(item => item.title === data.title);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartData.push({ ...data, quantity: 1 });
  }
  saveCart();
  createToast(`${data.title} added to cart`);
}

const renderCartPage = () => {
  if (!cartPageContainer) return;
  const cartResults = document.createElement('div');
  cartResults.className = 'cart-results';

  const cartSummary = document.createElement('div');
  cartSummary.className = 'cart-summary';

  if (cartData.length === 0) {
    cartPageContainer.innerHTML = `
      <div class="cart-empty">
        <h1>Your Cart Is Empty</h1>
        <p>Products added to cart will appear here.</p>
        <a href="./product.html" class="continue-shop"><i class="fa-solid fa-arrow-left"></i> Continue Shopping</a>
      </div>`;
    return;
  }

  cartData.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="item-image"><img src="${item.imageSrc}" alt="${item.title}"></div>
      <div class="item-details">
        <h2>${item.title}</h2>
        <p>Price: ₦${formatPrice(item.price)}</p>
        <p>Quantity: ${item.quantity}</p>
      </div>
      <div class="item-actions">
        <button class="action-btn remove-item" data-title="${item.title}">Remove</button>
      </div>`;
    cartResults.appendChild(itemEl);
  });

  const subtotal = cartData.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 2000;
  const vat = Math.ceil(subtotal * 0.05);
  const total = subtotal + deliveryFee + vat;
  cartSummary.innerHTML = `
    <h2>Order Summary</h2>
    <p>Total items: ${cartData.reduce((sum, item) => sum + item.quantity, 0)}</p>
    <p>Subtotal: ₦${formatPrice(subtotal)}</p>
    <p>Delivery fee: ₦${formatPrice(deliveryFee)}</p>
    <p>VAT (5%): ₦${formatPrice(vat)}</p>
    <h3>Total: ₦${formatPrice(total)}</h3>e 
    <button class="checkout-btn">Checkout</button>`;

  cartPageContainer.innerHTML = '';
  cartPageContainer.appendChild(cartResults);
  cartPageContainer.appendChild(cartSummary);

  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      const index = cartData.findIndex(item => item.title === title);
      if (index !== -1) {
        cartData.splice(index, 1);
        saveCart();
        renderCartPage();
        createToast(`${title} removed from cart`);
      }
    });
  });

  const checkoutBtn = cartSummary.querySelector('.checkout-btn');
  checkoutBtn.addEventListener('click', () => {
    openPaymentModal();
  });
}

const initializeAddButtons = () => {
  document.querySelectorAll('.card button').forEach(button => {
    button.addEventListener('click', () => {
      const data = getButtonData(button);
      if (!data || !data.title) return;
      addCartItem(data);
    });
  });
}

const observeHeroButtons = () => {
  const heroButtons = document.querySelectorAll('.hero button, .view-btn button, .continue-shop');
  heroButtons.forEach(button => {
    button.addEventListener('mouseenter', () => button.classList.add('hovered'));
    button.addEventListener('mouseleave', () => button.classList.remove('hovered'));
  });
}

initAuth();
updateCartCount();
initializeAddButtons();
observeHeroButtons();
renderCartPage();
initializePaymentModal();

window.addEventListener('storage', () => {
  const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
  cartData.length = 0;
  cartData.push(...stored);
  currentUser = JSON.parse(localStorage.getItem(authKey) || 'null');
  updateCartCount();
  renderCartPage();
});