// ==================== NAVIGATION ENTRE SECTIONS ====================
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadOrders();
    loadProducts();
    loadSavedContent();
    initOrderNotifications();
    
    // Gestion du menu sidebar
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Retirer la classe active de tous les items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Ajouter la classe active à l'item cliqué
            item.classList.add('active');
            
            // Cacher toutes les sections
            const sections = document.querySelectorAll('.admin-section');
            sections.forEach(s => s.classList.remove('active'));
            
            // Afficher la section correspondante
            const sectionId = item.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
});

// ==================== SYSTÈME DE NOTIFICATIONS EN TEMPS RÉEL ====================
function initOrderNotifications() {
    // Vérifier les nouvelles commandes toutes les 2 secondes
    setInterval(() => {
        checkForNewOrders();
    }, 2000);
    
    // Écouter les changements dans localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'newOrderNotification' && e.newValue) {
            try {
                const notification = JSON.parse(e.newValue);
                if (notification && notification.orderId) {
                    showNewOrderAlert(notification.orderId);
                    loadOrders();
                    loadDashboardStats();
                }
            } catch (error) {
                console.error('Erreur lors du parsing de la notification:', error);
            }
        }
    });
}

// Vérifier s'il y a de nouvelles commandes
let lastOrderCount = 0;

function checkForNewOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const currentOrderCount = orders.length;
        
        // Si le nombre de commandes a augmenté
        if (currentOrderCount > lastOrderCount && lastOrderCount > 0) {
            const newOrder = orders[orders.length - 1];
            showNewOrderAlert(newOrder.id);
            loadOrders();
            loadDashboardStats();
            
            // Jouer un son de notification (optionnel)
            playNotificationSound();
        }
        
        lastOrderCount = currentOrderCount;
    } catch (error) {
        console.error('Erreur lors de la vérification des commandes:', error);
    }
}

// Afficher une alerte de nouvelle commande
function showNewOrderAlert(orderId) {
    const alertHTML = `
        <div class="new-order-alert" id="newOrderAlert" style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 9999;
            min-width: 320px;
            animation: slideInRight 0.5s ease, pulse 2s ease infinite;
        ">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">🔔</span>
                <div>
                    <h3 style="margin: 0; font-size: 1.2rem;">Nouvelle commande !</h3>
                    <p style="margin: 0.3rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">${orderId}</p>
                </div>
            </div>
            <button onclick="goToOrders()" style="
                width: 100%;
                padding: 0.8rem;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 0.5rem;
            ">Voir la commande</button>
            <button onclick="closeNewOrderAlert()" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                opacity: 0.7;
            ">&times;</button>
        </div>
    `;
    
    // Supprimer l'ancienne alerte si elle existe
    const existingAlert = document.getElementById('newOrderAlert');
    if (existingAlert) existingAlert.remove();
    
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-fermer après 10 secondes
    setTimeout(() => {
        closeNewOrderAlert();
    }, 10000);
}

// Fermer l'alerte de nouvelle commande
function closeNewOrderAlert() {
    const alert = document.getElementById('newOrderAlert');
    if (alert) {
        alert.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => alert.remove(), 500);
    }
}

// Aller à la section commandes
function goToOrders() {
    closeNewOrderAlert();
    const ordersMenuItem = document.querySelector('[data-section="orders"]');
    if (ordersMenuItem) {
        ordersMenuItem.click();
    }
}

// Jouer un son de notification (simple beep)
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.error('Erreur lors de la lecture du son:', error);
    }
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        50% {
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.6);
        }
    }
`;
document.head.appendChild(style);

// ==================== TABLEAU DE BORD ====================
function loadDashboardStats() {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Statistiques
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'en attente').length;
        
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalRevenueEl = document.getElementById('totalRevenue');
        const pendingOrdersEl = document.getElementById('pendingOrders');
        
        if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
        if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue.toLocaleString('fr-FR') + ' FCFA';
        if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
        
        // Activité récente
        const activityList = document.getElementById('recentActivity');
        if (activityList) {
            if (orders.length > 0) {
                const recentOrders = orders.slice(-5).reverse();
                activityList.innerHTML = recentOrders.map(order => `
                    <div class="activity-item">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <strong style="color: #667eea;">${order.id}</strong>
                            <span style="font-size: 0.85rem; color: #95a5a6;">${new Date(order.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div style="background: #f8f9fa; padding: 0.5rem; border-radius: 5px; margin-bottom: 0.3rem;">
                            <small style="color: #7f8c8d;">
                                👤 ${order.customerInfo?.name || 'N/A'}<br>
                                📧 ${order.customerInfo?.email || 'N/A'}<br>
                                📱 ${order.customerInfo?.phone || 'N/A'}
                            </small>
                        </div>
                        <small style="color: #7f8c8d;">
                            Montant: <strong style="color: #27ae60;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</strong> | 
                            Statut: <strong style="color: ${getStatusColor(order.status)};">${order.status}</strong>
                        </small>
                    </div>
                `).join('');
            } else {
                activityList.innerHTML = '<p class="no-data">Aucune activité récente</p>';
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// ==================== GESTION DES COMMANDES ====================
function loadOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const tableBody = document.getElementById('ordersTableBody');
        
        if (!tableBody) return;
        
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">Aucune commande pour le moment</td></tr>';
            return;
        }
        
        // Trier les commandes par date (plus récentes en premier)
        const sortedOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tableBody.innerHTML = sortedOrders.map((order, index) => {
            const isNew = isOrderNew(order.date);
            
            return `
            <tr style="${isNew ? 'background-color: #fff3cd;' : ''}">
                <td>
                    <strong>${order.id}</strong>
                    ${isNew ? '<span style="background: #ff6b6b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px;">NOUVEAU</span>' : ''}
                </td>
                <td>${new Date(order.date).toLocaleString('fr-FR')}</td>
                <td>
                    <strong>${order.items?.length || 0}</strong> article(s)
                    <br>
                    <small style="color: #7f8c8d;">
                        ${(order.items || []).map(item => `${item.name} x${item.quantity}`).join(', ').substring(0, 50)}${(order.items || []).map(item => `${item.name} x${item.quantity}`).join(', ').length > 50 ? '...' : ''}
                    </small>
                </td>
                <td><strong style="color: #667eea; font-size: 1.1rem;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</strong></td>
                <td>
                    <select class="status-select" onchange="updateOrderStatus(${index}, this.value)" style="
                        padding: 0.5rem;
                        border-radius: 6px;
                        border: 2px solid #ddd;
                        font-weight: bold;
                        color: ${getStatusColor(order.status)};
                    ">
                        <option value="en attente" ${order.status === 'en attente' ? 'selected' : ''}>⏳ En attente</option>
                        <option value="validée" ${order.status === 'validée' ? 'selected' : ''}>✓ Validée</option>
                        <option value="expédiée" ${order.status === 'expédiée' ? 'selected' : ''}>📦 Expédiée</option>
                        <option value="livrée" ${order.status === 'livrée' ? 'selected' : ''}>🎉 Livrée</option>
                        <option value="annulée" ${order.status === 'annulée' ? 'selected' : ''}>❌ Annulée</option>
                    </select>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewOrder(${index})" title="Voir les détails">👁️</button>
                        <button class="btn-action btn-validate" onclick="quickValidateOrder(${index})" title="Valider rapidement">✓</button>
                        <button class="btn-action btn-delete" onclick="deleteOrder(${index})" title="Supprimer">🗑️</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
    }
}

// Vérifier si une commande est nouvelle (moins de 5 minutes)
function isOrderNew(orderDate) {
    const now = new Date();
    const orderTime = new Date(orderDate);
    const diffMinutes = (now - orderTime) / 1000 / 60;
    return diffMinutes < 5;
}

// Obtenir la couleur selon le statut
function getStatusColor(status) {
    const colors = {
        'en attente': '#f39c12',
        'validée': '#3498db',
        'expédiée': '#27ae60',
        'livrée': '#2ecc71',
        'annulée': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
}

// Voir les détails d'une commande
function viewOrder(index) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders[index];
        
        if (!order) return;
        
        const modalBody = document.getElementById('orderModalBody');
        if (!modalBody) return;
        
        modalBody.innerHTML = `
            <div class="order-details">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem 0;">📋 ${order.id}</h3>
                    <p style="margin: 0; opacity: 0.9;">Commande passée le ${new Date(order.date).toLocaleString('fr-FR')}</p>
                </div>
                
                <!-- Informations client -->
                <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border-left: 4px solid #2196f3;">
                    <h4 style="margin: 0 0 1rem 0; color: #1976d2; display: flex; align-items: center; gap: 0.5rem;">
                        <span>👤</span> Informations du client
                    </h4>
                    <div style="display: grid; gap: 0.8rem;">
                        <div>
                            <strong style="color: #1976d2;">Nom :</strong>
                            <p style="margin: 0.3rem 0 0 0; font-size: 1.1rem;">${order.customerInfo?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <strong style="color: #1976d2;">Email :</strong>
                            <p style="margin: 0.3rem 0 0 0;">
                                <a href="mailto:${order.customerInfo?.email || ''}" style="color: #2196f3; text-decoration: none;">
                                    ${order.customerInfo?.email || 'N/A'}
                                </a>
                            </p>
                        </div>
                        <div>
                            <strong style="color: #1976d2;">Téléphone :</strong>
                            <p style="margin: 0.3rem 0 0 0;">
                                <a href="tel:${order.customerInfo?.phone || ''}" style="color: #2196f3; text-decoration: none;">
                                    ${order.customerInfo?.phone || 'N/A'}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                        <small style="color: #7f8c8d;">Statut actuel</small>
                        <p style="margin: 0.5rem 0 0 0; font-weight: bold; color: ${getStatusColor(order.status)}; font-size: 1.1rem;">
                            ${order.status.toUpperCase()}
                        </p>
                    </div>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                        <small style="color: #7f8c8d;">Montant total</small>
                        <p style="margin: 0.5rem 0 0 0; font-weight: bold; color: #667eea; font-size: 1.3rem;">
                            ${(order.total || 0).toLocaleString('fr-FR')} FCFA
                        </p>
                    </div>
                </div>
                
                <h4 style="margin: 1.5rem 0 1rem 0; color: #2c3e50;">🛒 Articles commandés</h4>
                <div style="margin-top: 1rem;">
                    ${(order.items || []).map(item => `
                        <div style="
                            padding: 1rem;
                            background: #f8f9fa;
                            border-radius: 8px;
                            margin-bottom: 0.8rem;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-left: 4px solid #667eea;
                        ">
                            <div>
                                <strong style="color: #2c3e50; display: block; margin-bottom: 0.3rem;">${item.name}</strong>
                                <small style="color: #7f8c8d;">Prix unitaire: ${(item.price || 0).toLocaleString('fr-FR')} FCFA × ${item.quantity}</small>
                            </div>
                            <div style="text-align: right;">
                                <strong style="color: #667eea; font-size: 1.1rem;">${((item.quantity || 0) * (item.price || 0)).toLocaleString('fr-FR')} FCFA</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
                    border-radius: 8px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span style="font-size: 1.2rem; font-weight: bold;">TOTAL</span>
                    <span style="font-size: 1.5rem; font-weight: bold;">${(order.total || 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
                    <button onclick="quickValidateOrder(${index}); closeOrderModal();" style="
                        flex: 1;
                        padding: 1rem;
                        background: #27ae60;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                    ">✓ Valider la commande</button>
                    <button onclick="closeOrderModal()" style="
                        padding: 1rem 1.5rem;
                        background: #95a5a6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: bold;
                        cursor: pointer;
                    ">Fermer</button>
                </div>
            </div>
        `;
        
        const modal = document.getElementById('orderModal');
        if (modal) modal.classList.add('active');
    } catch (error) {
        console.error('Erreur lors de l\'affichage des détails:', error);
    }
}

// Validation rapide d'une commande
function quickValidateOrder(index) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        if (orders[index] && orders[index].status === 'en attente') {
            orders[index].status = 'validée';
            localStorage.setItem('orders', JSON.stringify(orders));
            loadOrders();
            loadDashboardStats();
            showNotification('✓ Commande validée avec succès !');
        }
    } catch (error) {
        console.error('Erreur lors de la validation:', error);
    }
}

// Fermer le modal commande
function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.remove('active');
}

// Mettre à jour le statut d'une commande
function updateOrderStatus(index, newStatus) {
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        if (orders[index]) {
            orders[index].status = newStatus;
            localStorage.setItem('orders', JSON.stringify(orders));
            loadOrders();
            loadDashboardStats();
            showNotification('Statut de la commande mis à jour !');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
    }
}

// Supprimer une commande
function deleteOrder(index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
    
    try {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.splice(index, 1);
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
        loadDashboardStats();
        showNotification('Commande supprimée', 'error');
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
    }
}

// Recherche et filtrage des commandes
const searchOrderEl = document.getElementById('searchOrder');
const filterStatusEl = document.getElementById('filterStatus');

if (searchOrderEl) searchOrderEl.addEventListener('input', filterOrders);
if (filterStatusEl) filterStatusEl.addEventListener('change', filterOrders);

function filterOrders() {
    const searchTerm = document.getElementById('searchOrder')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const statusCell = row.querySelector('select')?.value || '';
        
        const matchSearch = text.includes(searchTerm);
        const matchStatus = statusFilter === 'all' || statusCell === statusFilter;
        
        row.style.display = matchSearch && matchStatus ? '' : 'none';
    });
}

// ==================== GESTION DES PRODUITS ====================
function loadProducts() {
    try {
        // Produits par défaut
        const defaultProducts = [
            { id: 1, name: 'Ensemble chemise + culotte', description: 'Ensemble élégant composé d\'une chemise fluide et d\'une culotte assortie', price: 40000, image: 'IMG2.jpg' },
            { id: 2, name: 'Robe En Grani', description: 'Magnifique robe en tissu Grani aux motifs traditionnels colorés', price: 25000, image: 'IMG6.jpg' },
            { id: 3, name: 'Robe Simple', description: 'Robe sobre et élégante, parfaite pour un style minimaliste', price: 20000, image: 'IMG8.jpg' },
            { id: 4, name: 'Chemise En Grani', description: 'Chemise tendance en tissu Grani aux couleurs vives', price: 15000, image: 'IMG12.jpg' },
            { id: 5, name: 'Ensemble Top + culotte + Bonnet', description: 'Ensemble trois pièces coordonnées pour bébé', price: 20000, image: 'IMG4.jpg' },
            { id: 6, name: 'Bonnet Violet', description: 'Joli bonnet pour bébé en couleur violette douce', price: 2000, image: 'IMG18.jpg' }
        ];
        
        const products = JSON.parse(localStorage.getItem('products') || JSON.stringify(defaultProducts));
        const productsList = document.getElementById('productsList');
        
        if (!productsList) return;
        
        productsList.innerHTML = products.map((product, index) => `
            <div class="product-admin-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-admin-info">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <p class="product-admin-price">${(product.price || 0).toLocaleString('fr-FR')} FCFA</p>
                    <div class="product-admin-actions">
                        <button class="btn-action btn-view" onclick="editProduct(${index})">Modifier</button>
                        <button class="btn-action btn-delete" onclick="deleteProduct(${index})">Supprimer</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
    }
}

// Ouvrir le modal d'ajout de produit
function openProductModal() {
    document.getElementById('productModalTitle').textContent = 'Ajouter un produit';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productModal').classList.add('active');
}

// Fermer le modal produit
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
}

// Modifier un produit
function editProduct(index) {
    try {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const product = products[index];
        
        if (!product) return;
        
        document.getElementById('productModalTitle').textContent = 'Modifier le produit';
        document.getElementById('productId').value = index;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('Erreur lors de l\'édition du produit:', error);
    }
}

// Sauvegarder un produit
function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const image = document.getElementById('productImage').value;
    
    if (!name || !description || !price || !image) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    try {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        
        if (id === '') {
            // Nouveau produit
            products.push({ id: Date.now(), name, description, price, image });
            showNotification('Produit ajouté avec succès !');
        } else {
            // Modifier produit existant
            products[id] = { ...products[id], name, description, price, image };
            showNotification('Produit modifié avec succès !');
        }
        
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        closeProductModal();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du produit:', error);
    }
}

// Supprimer un produit
function deleteProduct(index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        showNotification('Produit supprimé', 'error');
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
    }
}

// ==================== GESTION DU CONTENU ====================
function loadSavedContent() {
    try {
        const content = JSON.parse(localStorage.getItem('siteContent') || '{}');
        
        const elements = {
            heroTitle: document.getElementById('heroTitle'),
            heroSubtitle: document.getElementById('heroSubtitle'),
            contactAddress: document.getElementById('contactAddress'),
            contactPhone: document.getElementById('contactPhone'),
            contactEmail: document.getElementById('contactEmail')
        };
        
        if (content.heroTitle && elements.heroTitle) elements.heroTitle.value = content.heroTitle;
        if (content.heroSubtitle && elements.heroSubtitle) elements.heroSubtitle.value = content.heroSubtitle;
        if (content.contactAddress && elements.contactAddress) elements.contactAddress.value = content.contactAddress;
        if (content.contactPhone && elements.contactPhone) elements.contactPhone.value = content.contactPhone;
        if (content.contactEmail && elements.contactEmail) elements.contactEmail.value = content.contactEmail;
    } catch (error) {
        console.error('Erreur lors du chargement du contenu:', error);
    }
}

// Sauvegarder le contenu Hero
function saveHeroContent() {
    try {
        const content = JSON.parse(localStorage.getItem('siteContent') || '{}');
        content.heroTitle = document.getElementById('heroTitle')?.value || '';
        content.heroSubtitle = document.getElementById('heroSubtitle')?.value || '';
        localStorage.setItem('siteContent', JSON.stringify(content));
        showNotification('Contenu Hero enregistré !');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du contenu Hero:', error);
    }
}

// Sauvegarder les informations de contact
function saveContactInfo() {
    try {
        const content = JSON.parse(localStorage.getItem('siteContent') || '{}');
        content.contactAddress = document.getElementById('contactAddress')?.value || '';
        content.contactPhone = document.getElementById('contactPhone')?.value || '';
        content.contactEmail = document.getElementById('contactEmail')?.value || '';
        localStorage.setItem('siteContent', JSON.stringify(content));
        showNotification('Informations de contact enregistrées !');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des informations de contact:', error);
    }
}

// Sauvegarder les couleurs du thème
function saveThemeColors() {
    try {
        const primaryColor = document.getElementById('primaryColor')?.value || '#667eea';
        const secondaryColor = document.getElementById('secondaryColor')?.value || '#764ba2';
        
        const themeColors = { primaryColor, secondaryColor };
        localStorage.setItem('themeColors', JSON.stringify(themeColors));
        showNotification('Couleurs du thème enregistrées !');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des couleurs:', error);
    }
}

// ==================== NOTIFICATION ====================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification-admin ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== DÉCONNEXION ====================
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        window.location.href = 'pg.html';
    }
}

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});


