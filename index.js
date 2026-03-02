// ==================== IMPORT FIREBASE ====================
import { db } from './firebase-config.js';
import {
    collection, getDocs, addDoc, setDoc, deleteDoc,
    doc, query, orderBy, onSnapshot, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ==================== NAVIGATION ENTRE SECTIONS ====================
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardStats();
    loadOrders();
    loadProducts();
    loadSavedContent();
    initOrderNotifications();

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(item.getAttribute('data-section'));
            if (target) target.classList.add('active');
        });
    });
});

// ==================== NOTIFICATIONS EN TEMPS RÉEL ====================
function initOrderNotifications() {
    // Écoute en temps réel les nouvelles commandes Firebase
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    let firstLoad = true;

    onSnapshot(q, (snapshot) => {
        if (firstLoad) {
            firstLoad = false;
            return; // Ne pas alerter au premier chargement
        }
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                const order = change.doc.data();
                showNewOrderAlert(order.id);
                loadOrders();
                loadDashboardStats();
                playNotificationSound();
            }
        });
    });
}

function showNewOrderAlert(orderId) {
    const existing = document.getElementById('newOrderAlert');
    if (existing) existing.remove();

    const alertHTML = `
        <div class="new-order-alert" id="newOrderAlert" style="
            position: fixed; top: 100px; right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 1.5rem; border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 9999;
            min-width: 320px; animation: slideInRight 0.5s ease, pulse 2s ease infinite;">
            <div style="display:flex; align-items:center; gap:1rem; margin-bottom:0.5rem;">
                <span style="font-size:2rem;">🔔</span>
                <div>
                    <h3 style="margin:0; font-size:1.2rem;">Nouvelle commande !</h3>
                    <p style="margin:0.3rem 0 0 0; font-size:0.9rem; opacity:0.9;">${orderId}</p>
                </div>
            </div>
            <button onclick="goToOrders()" style="width:100%; padding:0.8rem; background:white; color:#667eea; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:0.5rem;">Voir la commande</button>
            <button onclick="closeNewOrderAlert()" style="position:absolute; top:10px; right:10px; background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; opacity:0.7;">&times;</button>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', alertHTML);
    setTimeout(closeNewOrderAlert, 10000);
}

function closeNewOrderAlert() {
    const alert = document.getElementById('newOrderAlert');
    if (alert) {
        alert.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => alert.remove(), 500);
    }
}

function goToOrders() {
    closeNewOrderAlert();
    document.querySelector('[data-section="orders"]')?.click();
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) { }
}

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
    @keyframes pulse { 0%, 100% { box-shadow: 0 10px 30px rgba(0,0,0,0.3); } 50% { box-shadow: 0 10px 40px rgba(102,126,234,0.6); } }
`;
document.head.appendChild(style);

// ==================== TABLEAU DE BORD ====================
async function loadDashboardStats() {
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        const orders = snapshot.docs.map(d => d.data());

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'en attente').length;

        const el = id => document.getElementById(id);
        if (el('totalOrders')) el('totalOrders').textContent = totalOrders;
        if (el('totalRevenue')) el('totalRevenue').textContent = totalRevenue.toLocaleString('fr-FR') + ' FCFA';
        if (el('pendingOrders')) el('pendingOrders').textContent = pendingOrders;

        const activityList = el('recentActivity');
        if (activityList) {
            if (orders.length > 0) {
                const recent = orders.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                activityList.innerHTML = recent.map(order => `
                    <div class="activity-item">
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">
                            <strong style="color:#667eea;">${order.id}</strong>
                            <span style="font-size:0.85rem; color:#95a5a6;">${new Date(order.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div style="background:#f8f9fa; padding:0.5rem; border-radius:5px; margin-bottom:0.3rem;">
                            <small style="color:#7f8c8d;">
                                👤 ${order.customerInfo?.name || 'N/A'}<br>
                                📧 ${order.customerInfo?.email || 'N/A'}<br>
                                📱 ${order.customerInfo?.phone || 'N/A'}
                            </small>
                        </div>
                        <small style="color:#7f8c8d;">
                            Montant: <strong style="color:#27ae60;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</strong> |
                            Statut: <strong style="color:${getStatusColor(order.status)};">${order.status}</strong>
                        </small>
                    </div>`).join('');
            } else {
                activityList.innerHTML = '<p class="no-data">Aucune activité récente</p>';
            }
        }
    } catch (e) { console.error('Erreur stats:', e); }
}

// ==================== GESTION DES COMMANDES ====================
async function loadOrders() {
    try {
        const tableBody = document.getElementById('ordersTableBody');
        if (!tableBody) return;

        const q = query(collection(db, "orders"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Aucune commande pour le moment</td></tr>';
            return;
        }

        const orders = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

        tableBody.innerHTML = orders.map((order, index) => {
            const isNew = isOrderNew(order.date);
            return `
            <tr style="${isNew ? 'background-color:#fff3cd;' : ''}">
                <td>
                    <strong>${order.id}</strong>
                    ${isNew ? '<span style="background:#ff6b6b; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px;">NOUVEAU</span>' : ''}
                </td>
                <td>${new Date(order.date).toLocaleString('fr-FR')}</td>
                <td>
                    <strong>${order.items?.length || 0}</strong> article(s)<br>
                    <small style="color:#7f8c8d;">${(order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ').substring(0, 50)}</small>
                </td>
                <td><strong style="color:#667eea; font-size:1.1rem;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus('${order.docId}', this.value)" style="padding:0.5rem; border-radius:6px; border:2px solid #ddd; font-weight:bold; color:${getStatusColor(order.status)};">
                        <option value="en attente" ${order.status === 'en attente' ? 'selected' : ''}>⏳ En attente</option>
                        <option value="validée" ${order.status === 'validée' ? 'selected' : ''}>✓ Validée</option>
                        <option value="expédiée" ${order.status === 'expédiée' ? 'selected' : ''}>📦 Expédiée</option>
                        <option value="livrée" ${order.status === 'livrée' ? 'selected' : ''}>🎉 Livrée</option>
                        <option value="annulée" ${order.status === 'annulée' ? 'selected' : ''}>❌ Annulée</option>
                    </select>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewOrder('${order.docId}')" title="Voir">👁️</button>
                        <button class="btn-action btn-validate" onclick="quickValidateOrder('${order.docId}')" title="Valider">✓</button>
                        <button class="btn-action btn-delete" onclick="deleteOrder('${order.docId}')" title="Supprimer">🗑️</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { console.error('Erreur commandes:', e); }
}

function isOrderNew(orderDate) {
    return (new Date() - new Date(orderDate)) / 1000 / 60 < 5;
}

function getStatusColor(status) {
    return { 'en attente': '#f39c12', 'validée': '#3498db', 'expédiée': '#27ae60', 'livrée': '#2ecc71', 'annulée': '#e74c3c' }[status] || '#95a5a6';
}

async function viewOrder(docId) {
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        const orderDoc = snapshot.docs.find(d => d.id === docId);
        if (!orderDoc) return;
        const order = orderDoc.data();

        const modalBody = document.getElementById('orderModalBody');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="order-details">
                <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; padding:1.5rem; border-radius:10px; margin-bottom:1.5rem;">
                    <h3 style="margin:0 0 0.5rem 0;">📋 ${order.id}</h3>
                    <p style="margin:0; opacity:0.9;">Commande passée le ${new Date(order.date).toLocaleString('fr-FR')}</p>
                </div>
                <div style="background:#e3f2fd; padding:1.5rem; border-radius:10px; margin-bottom:1.5rem; border-left:4px solid #2196f3;">
                    <h4 style="margin:0 0 1rem 0; color:#1976d2;">👤 Informations du client</h4>
                    <p><strong>Nom :</strong> ${order.customerInfo?.name || 'N/A'}</p>
                    <p><strong>Email :</strong> <a href="mailto:${order.customerInfo?.email}">${order.customerInfo?.email || 'N/A'}</a></p>
                    <p><strong>Téléphone :</strong> <a href="tel:${order.customerInfo?.phone}">${order.customerInfo?.phone || 'N/A'}</a></p>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
                    <div style="background:#f8f9fa; padding:1rem; border-radius:8px;">
                        <small style="color:#7f8c8d;">Statut</small>
                        <p style="margin:0.5rem 0 0 0; font-weight:bold; color:${getStatusColor(order.status)};">${order.status.toUpperCase()}</p>
                    </div>
                    <div style="background:#f8f9fa; padding:1rem; border-radius:8px;">
                        <small style="color:#7f8c8d;">Total</small>
                        <p style="margin:0.5rem 0 0 0; font-weight:bold; color:#667eea; font-size:1.3rem;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</p>
                    </div>
                </div>
                <h4>🛒 Articles</h4>
                ${(order.items || []).map(item => `
                    <div style="padding:1rem; background:#f8f9fa; border-radius:8px; margin-bottom:0.8rem; display:flex; justify-content:space-between; border-left:4px solid #667eea;">
                        <div>
                            <strong>${item.name}</strong><br>
                            <small>${(item.price || 0).toLocaleString('fr-FR')} FCFA × ${item.quantity}</small>
                        </div>
                        <strong style="color:#667eea;">${((item.quantity || 0) * (item.price || 0)).toLocaleString('fr-FR')} FCFA</strong>
                    </div>`).join('')}
                <div style="margin-top:1.5rem; padding:1rem; background:linear-gradient(135deg,#27ae60,#229954); border-radius:8px; color:white; display:flex; justify-content:space-between;">
                    <span style="font-size:1.2rem; font-weight:bold;">TOTAL</span>
                    <span style="font-size:1.5rem; font-weight:bold;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div style="margin-top:1.5rem; display:flex; gap:0.5rem;">
                    <button onclick="quickValidateOrder('${docId}'); closeOrderModal();" style="flex:1; padding:1rem; background:#27ae60; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">✓ Valider</button>
                    <button onclick="closeOrderModal()" style="padding:1rem 1.5rem; background:#95a5a6; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">Fermer</button>
                </div>
            </div>`;

        document.getElementById('orderModal')?.classList.add('active');
    } catch (e) { console.error('Erreur viewOrder:', e); }
}

async function quickValidateOrder(docId) {
    try {
        await updateDoc(doc(db, "orders", docId), { status: 'validée' });
        loadOrders();
        loadDashboardStats();
        showNotification('✓ Commande validée !');
    } catch (e) { console.error('Erreur validation:', e); }
}

function closeOrderModal() {
    document.getElementById('orderModal')?.classList.remove('active');
}

async function updateOrderStatus(docId, newStatus) {
    try {
        await updateDoc(doc(db, "orders", docId), { status: newStatus });
        loadOrders();
        loadDashboardStats();
        showNotification('Statut mis à jour !');
    } catch (e) { console.error('Erreur statut:', e); }
}

async function deleteOrder(docId) {
    if (!confirm('Supprimer cette commande ?')) return;
    try {
        await deleteDoc(doc(db, "orders", docId));
        loadOrders();
        loadDashboardStats();
        showNotification('Commande supprimée', 'error');
    } catch (e) { console.error('Erreur suppression:', e); }
}

// Recherche/filtre commandes (inchangé)
document.getElementById('searchOrder')?.addEventListener('input', filterOrders);
document.getElementById('filterStatus')?.addEventListener('change', filterOrders);

function filterOrders() {
    const search = document.getElementById('searchOrder')?.value.toLowerCase() || '';
    const status = document.getElementById('filterStatus')?.value || 'all';
    document.querySelectorAll('#ordersTableBody tr').forEach(row => {
        const matchSearch = row.textContent.toLowerCase().includes(search);
        const matchStatus = status === 'all' || row.querySelector('select')?.value === status;
        row.style.display = matchSearch && matchStatus ? '' : 'none';
    });
}

// ==================== GESTION DES PRODUITS ====================
async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        let products = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

        // Si aucun produit en base, initialiser avec les produits par défaut
        if (products.length === 0) {
            await initDefaultProducts();
            return loadProducts();
        }

        const productsList = document.getElementById('productsList');
        if (!productsList) return;

        productsList.innerHTML = products.map(product => `
            <div class="product-admin-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-admin-info">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <p class="product-admin-price">${(product.price || 0).toLocaleString('fr-FR')} FCFA</p>
                    <div class="product-admin-actions">
                        <button class="btn-action btn-view" onclick="editProduct('${product.docId}')">Modifier</button>
                        <button class="btn-action btn-delete" onclick="deleteProduct('${product.docId}')">Supprimer</button>
                    </div>
                </div>
            </div>`).join('');
    } catch (e) { console.error('Erreur produits:', e); }
}

async function initDefaultProducts() {
    const defaults = [
        { name: 'Ensemble chemise + culotte', description: "Ensemble élégant composé d'une chemise fluide et d'une culotte assortie", price: 40000, image: 'IMG2.jpg' },
        { name: 'Robe En Grani', description: 'Magnifique robe en tissu Grani aux motifs traditionnels colorés', price: 25000, image: 'IMG6.jpg' },
        { name: 'Robe Simple', description: 'Robe sobre et élégante, parfaite pour un style minimaliste', price: 20000, image: 'IMG8.jpg' },
        { name: 'Chemise En Grani', description: 'Chemise tendance en tissu Grani aux couleurs vives', price: 15000, image: 'IMG12.jpg' },
        { name: 'Ensemble Top + culotte + Bonnet', description: 'Ensemble trois pièces coordonnées pour bébé', price: 20000, image: 'IMG4.jpg' },
        { name: 'Bonnet Violet', description: 'Joli bonnet pour bébé en couleur violette douce', price: 2000, image: 'IMG18.jpg' }
    ];
    for (const p of defaults) {
        await addDoc(collection(db, "products"), p);
    }
}

function openProductModal() {
    document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    document.getElementById('productDocId').value = '';
    ['productName', 'productDescription', 'productPrice', 'productImage'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal')?.classList.remove('active');
}

async function editProduct(docId) {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        const productDoc = snapshot.docs.find(d => d.id === docId);
        if (!productDoc) return;
        const p = productDoc.data();

        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
        document.getElementById('productDocId').value = docId;
        document.getElementById('productName').value = p.name;
        document.getElementById('productDescription').value = p.description;
        document.getElementById('productPrice').value = p.price;
        document.getElementById('productImage').value = p.image;
        document.getElementById('productModal').classList.add('active');
    } catch (e) { console.error('Erreur édition:', e); }
}

async function saveProduct() {
    const docId = document.getElementById('productDocId')?.value || '';
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value;

    if (!name || !description || !price || !image) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    try {
        if (docId === '') {
            await addDoc(collection(db, "products"), { name, description, price, image });
            showNotification('Produit ajouté !');
        } else {
            await setDoc(doc(db, "products", docId), { name, description, price, image });
            showNotification('Produit modifié !');
        }
        loadProducts();
        closeProductModal();
    } catch (e) { console.error('Erreur sauvegarde produit:', e); }
}

async function deleteProduct(docId) {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
        await deleteDoc(doc(db, "products", docId));
        loadProducts();
        showNotification('Produit supprimé', 'error');
    } catch (e) { console.error('Erreur suppression produit:', e); }
}

// ==================== GESTION DU CONTENU ====================
async function loadSavedContent() {
    try {
        const snapshot = await getDocs(collection(db, "siteContent"));
        if (snapshot.empty) return;
        const content = snapshot.docs[0].data();

        const map = {
            heroTitle: 'heroTitle', heroSubtitle: 'heroSubtitle',
            contactAddress: 'contactAddress', contactPhone: 'contactPhone', contactEmail: 'contactEmail'
        };
        Object.entries(map).forEach(([key, id]) => {
            const el = document.getElementById(id);
            if (el && content[key]) el.value = content[key];
        });
    } catch (e) { console.error('Erreur contenu:', e); }
}

async function saveHeroContent() {
    await saveContent({
        heroTitle: document.getElementById('heroTitle')?.value || '',
        heroSubtitle: document.getElementById('heroSubtitle')?.value || ''
    });
    showNotification('Contenu Hero enregistré !');
}

async function saveContactInfo() {
    await saveContent({
        contactAddress: document.getElementById('contactAddress')?.value || '',
        contactPhone: document.getElementById('contactPhone')?.value || '',
        contactEmail: document.getElementById('contactEmail')?.value || ''
    });
    showNotification('Informations de contact enregistrées !');
}

async function saveContent(data) {
    try {
        const snapshot = await getDocs(collection(db, "siteContent"));
        if (snapshot.empty) {
            await addDoc(collection(db, "siteContent"), data);
        } else {
            await updateDoc(doc(db, "siteContent", snapshot.docs[0].id), data);
        }
    } catch (e) { console.error('Erreur saveContent:', e); }
}

async function saveThemeColors() {
    const primaryColor = document.getElementById('primaryColor')?.value || '#667eea';
    const secondaryColor = document.getElementById('secondaryColor')?.value || '#764ba2';
    await saveContent({ primaryColor, secondaryColor });
    showNotification('Couleurs enregistrées !');
}

// ==================== NOTIFICATION ====================
function showNotification(message, type = 'success') {
    const n = document.createElement('div');
    n.className = `notification-admin ${type}`;
    n.textContent = message;
    n.style.cssText = `
        position:fixed; top:100px; right:20px;
        background:${type === 'success' ? '#27ae60' : '#e74c3c'};
        color:white; padding:1rem 1.5rem; border-radius:10px;
        box-shadow:0 5px 20px rgba(0,0,0,0.3); z-index:9999;
        animation:slideIn 0.3s ease;`;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// ==================== DÉCONNEXION ====================
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        window.location.href = 'pg.html';
    }
}

window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) e.target.classList.remove('active');
});

// Exposer les fonctions globalement (nécessaire pour les onclick HTML)
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrder = viewOrder;
window.quickValidateOrder = quickValidateOrder;
window.closeOrderModal = closeOrderModal;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.saveHeroContent = saveHeroContent;
window.saveContactInfo = saveContactInfo;
window.saveThemeColors = saveThemeColors;
window.goToOrders = goToOrders;
window.closeNewOrderAlert = closeNewOrderAlert;
window.logout = logout;


