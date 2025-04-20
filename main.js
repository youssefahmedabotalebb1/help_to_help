const firebaseConfig = {
  databaseURL: "https://whatsbesnes-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const categories = {
  "moater": "dolab",
  "molame": "rham",
  "monazef": "zgag",
  "enaya": "kalb",
  "Other": "wath"  // إضافة قسم المشاريب الجديد
};

let allProducts = [];
let currentProduct = null;
let cart = []; // سلة المشتريات

// استرجاع محتويات السلة من التخزين المحلي عند تحميل الصفحة
const loadCartFromLocalStorage = () => {
  const savedCart = localStorage.getItem('kajo_cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartBadge();
  }
};

// حفظ محتويات السلة في التخزين المحلي
const saveCartToLocalStorage = () => {
  localStorage.setItem('kajo_cart', JSON.stringify(cart));
};

const fetchAllProducts = async () => {
  const all = [];

  for (let path in categories) {
    const prefix = categories[path];
    const snapshot = await db.ref(path).once("value");
    const data = snapshot.val();
    
    if (data) {  // التحقق من وجود البيانات
      for (let id in data) {
        const item = data[id];
        
        // حل مشكلة الوصف المختلف لكل قسم
        let description = "";
        if (item[`${prefix}_waf`]) {
          description = item[`${prefix}_waf`];
        } else if (item[`agng_waf`]) {
          description = item[`agng_waf`];
        } else if (item[`Kalb_wat`]) {
          description = item[`Kalb_wat`];
        } else if (item[`wath_desc`]) {  // إضافة حقل وصف محتمل للمشاريب
          description = item[`wath_desc`];
        }
        
        all.push({
          image: item[`${prefix}_photo`] || "",
          title: item[`${prefix}_titel`] || item[`${prefix}_title`] || item[`${prefix}_name`] || "منتج بدون اسم",
          description: description,
          price: parseFloat(item[`${prefix}_price`] || 0),
          category: path
        });
      }
    }
  }

  allProducts = all.sort(() => 0.5 - Math.random());
  renderProducts(allProducts);
  loadCartFromLocalStorage(); // تحميل السلة بعد تحميل المنتجات
};

const renderProducts = (list) => {
  const container = document.getElementById("productsGrid");
  container.innerHTML = "";
  list.forEach(product => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h2>${product.title}</h2>
      <p>${product.description}</p>
      <p><strong>${product.price} جنيه</strong></p>
    `;
    div.onclick = () => showPopup(product);
    container.appendChild(div);
  });
};

const filterProducts = (category) => {
  if (category === "all") {
    renderProducts(allProducts);
  } else {
    const filtered = allProducts.filter(p => p.category === category);
    renderProducts(filtered);
  }
};

const showPopup = (product) => {
  currentProduct = product;
  document.getElementById("popupImg").src = product.image;
  document.getElementById("popupTitle").innerText = product.title;
  document.getElementById("popupDesc").innerText = product.description;
  document.getElementById("popupPrice").innerText = product.price;
  document.getElementById("quantity").value = 1;
  document.getElementById("userAddress").value = "";
  updateTotal();
  document.getElementById("popup").classList.remove("hidden");
};

const updateTotal = () => {
  const qty = parseInt(document.getElementById("quantity").value) || 1;
  const total = qty * currentProduct.price;
  document.getElementById("totalPrice").innerText = total;
};

const closePopup = () => {
  document.getElementById("popup").classList.add("hidden");
};

// وظائف سلة المشتريات الجديدة

// إضافة منتج إلى السلة
const addToCart = () => {
  const qty = parseInt(document.getElementById("quantity").value) || 1;
  
  // البحث عن المنتج في السلة
  const existingItemIndex = cart.findIndex(item => item.title === currentProduct.title);
  
  if (existingItemIndex !== -1) {
    // تحديث الكمية إذا كان المنتج موجودًا
    cart[existingItemIndex].quantity += qty;
  } else {
    // إضافة منتج جديد إلى السلة
    cart.push({
      title: currentProduct.title,
      price: currentProduct.price,
      image: currentProduct.image,
      quantity: qty
    });
  }
  
  // تحديث العداد وحفظ السلة
  updateCartBadge();
  saveCartToLocalStorage();
  
  // إظهار رسالة تأكيد
  showNotification(`تمت إضافة ${qty} ${currentProduct.title} إلى السلة`);
  
  // إغلاق النافذة المنبثقة
  closePopup();
};

// عرض إشعار
const showNotification = (message) => {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  }, 100);
};

// تحديث عدد المنتجات في الأيقونة
const updateCartBadge = () => {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
};

// عرض سلة المشتريات
const showCart = () => {
  renderCartItems();
  document.getElementById("cartPopup").classList.remove("hidden");
};

// إغلاق سلة المشتريات
const closeCart = () => {
  document.getElementById("cartPopup").classList.add("hidden");
};

// عرض محتويات السلة
const renderCartItems = () => {
  const container = document.getElementById("cartItems");
  container.innerHTML = "";
  
  if (cart.length === 0) {
    container.innerHTML = "<p class='empty-cart'>سلة المشتريات فارغة</p>";
    document.getElementById("checkoutBtn").disabled = true;
    document.getElementById("clearCartBtn").disabled = true;
    document.getElementById("cartTotal").textContent = "0";
    return;
  }
  
  let total = 0;
  
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-details">
        <h3>${item.title}</h3>
        <p>${item.price} جنيه × ${item.quantity} = ${itemTotal} جنيه</p>
      </div>
      <div class="cart-item-actions">
        <button onclick="changeQuantity(${index}, 1)">+</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity(${index}, -1)">-</button>
        <button onclick="removeFromCart(${index})" class="remove-btn">×</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  document.getElementById("cartTotal").textContent = total;
  document.getElementById("checkoutBtn").disabled = false;
  document.getElementById("clearCartBtn").disabled = false;
};

// تغيير كمية المنتج في السلة
const changeQuantity = (index, change) => {
  cart[index].quantity += change;
  
  if (cart[index].quantity <= 0) {
    removeFromCart(index);
  } else {
    renderCartItems();
    updateCartBadge();
    saveCartToLocalStorage();
  }
};

// إزالة منتج من السلة
const removeFromCart = (index) => {
  cart.splice(index, 1);
  renderCartItems();
  updateCartBadge();
  saveCartToLocalStorage();
};

// إفراغ السلة
const clearCart = () => {
  cart = [];
  renderCartItems();
  updateCartBadge();
  saveCartToLocalStorage();
  showNotification("تم إفراغ السلة");
};

// إتمام الطلب
const checkout = () => {
  const address = document.getElementById("cartAddress").value;
  
  if (!address) {
    showNotification("الرجاء إدخال العنوان للتوصيل");
    return;
  }
  
  // إنشاء نص الطلب
  let orderText = "مرحبا، أرغب في طلب المنتجات التالية:\n\n";
  
  cart.forEach(item => {
    orderText += `${item.title}: ${item.quantity} قطعة - ${item.price * item.quantity} جنيه\n`;
  });
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  orderText += `\nالإجمالي: ${total} جنيه`;
  orderText += `\nالعنوان: ${address}`;
  
  // محاولة الحصول على موقع المستخدم
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        orderText += `\nموقعي: ${locationLink}`;
        sendWhatsAppOrder(orderText);
      },
      (error) => {
        // في حالة رفض إعطاء الموقع
        sendWhatsAppOrder(orderText);
      }
    );
  } else {
    // في حالة عدم دعم تحديد الموقع
    sendWhatsAppOrder(orderText);
  }
};

const sendWhatsAppOrder = (message) => {
  const encodedMsg = encodeURIComponent(message);
  window.open(`https://wa.me/201006433740?text=${encodedMsg}`, '_blank');
  
  // إفراغ السلة بعد إتمام الطلب
  clearCart();
  closeCart();
};

const sendWhatsappOrder = () => {
  const qty = parseInt(document.getElementById("quantity").value);
  const total = qty * currentProduct.price;
  const address = document.getElementById("userAddress").value;
  
  // محاولة الحصول على موقع المستخدم
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        const msg = `مرحبا، اريد طلب منتج: ${currentProduct.title}
الكمية: ${qty}
الإجمالي: ${total} جنيه
العنوان: ${address}
موقعي: ${locationLink}`;

        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://wa.me/201006433740?text=${encodedMsg}`, '_blank');
      },
      (error) => {
        // في حالة رفض إعطاء الموقع، نرسل الرسالة بدون رابط الموقع
        const msg = `مرحبا، اريد طلب منتج: ${currentProduct.title}
الكمية: ${qty}
الإجمالي: ${total} جنيه
العنوان: ${address}`;

        const encodedMsg = encodeURIComponent(msg);
        window.open(`https://wa.me/201006433740?text=${encodedMsg}`, '_blank');
      }
    );
  } else {
    // في حالة عدم دعم تحديد الموقع
    const msg = `مرحبا، اريد طلب منتج: ${currentProduct.title}
الكمية: ${qty}
الإجمالي: ${total} جنيه
العنوان: ${address}`;

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/201006433740?text=${encodedMsg}`, '_blank');
  }
};

const searchProducts = () => {
  const term = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allProducts.filter(p => 
    p.title.toLowerCase().includes(term) ||
    p.description.toLowerCase().includes(term)
  );
  renderProducts(filtered);
};

// تنفيذ الدوال عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  fetchAllProducts();
  
  // إضافة مستمعي الأحداث للأزرار
  const addToCartBtn = document.getElementById("addToCartBtn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", addToCart);
  }
  
  const whatsappBtn = document.getElementById("whatsappBtn");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", sendWhatsappOrder);
  }
  
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }
  
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", clearCart);
  }
});