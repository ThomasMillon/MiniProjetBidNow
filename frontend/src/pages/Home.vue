<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { socket, connectSocket } from '../socket';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const activeItems = ref<any[]>([]);
const endedItems = ref<any[]>([]);
const activeTab = ref('active');

const fetchItems = async () => {
  try {
    const [activeRes, endedRes] = await Promise.all([
      axios.get('/api/items?status=active'),
      axios.get('/api/items?status=ended')
    ]);
    activeItems.value = activeRes.data;
    endedItems.value = endedRes.data;
  } catch (err) {
    console.error('Error fetching items:', err);
  }
};

onMounted(() => {
  fetchItems();
  
  if (auth.token) {
    connectSocket(auth.token);
  } else {
    socket.connect(); // Connect as guest if backend allows (or just to receive global updates)
  }

  socket.on('item-updated', (updatedItem) => {
    // Update in active list
    const index = activeItems.value.findIndex(item => item._id === updatedItem.itemId);
    if (index !== -1) {
      if (updatedItem.status === 'ended') {
        // Move to ended
        const [item] = activeItems.value.splice(index, 1);
        item.status = 'ended';
        item.currentPrice = updatedItem.currentPrice;
        item.currentBidder = updatedItem.currentBidder;
        endedItems.value.unshift(item);
      } else {
        activeItems.value[index].currentPrice = updatedItem.currentPrice;
        activeItems.value[index].currentBidder = updatedItem.currentBidder;
      }
    }
  });
});

onUnmounted(() => {
  socket.off('item-updated');
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const getTimeRemaining = (endsAt: string) => {
  const diff = new Date(endsAt).getTime() - new Date().getTime();
  if (diff <= 0) return 'Ended';
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};
</script>

<template>
  <div class="home-page">
    <div class="hero">
      <h1>The Grand Gallery</h1>
      <p>Exquisite items for the discerning collector</p>
    </div>

    <div class="tabs">
      <button 
        @click="activeTab = 'active'" 
        :class="{ active: activeTab === 'active' }"
      >
        Live Auctions
      </button>
      <button 
        @click="activeTab = 'ended'" 
        :class="{ active: activeTab === 'ended' }"
      >
        Past Results
      </button>
    </div>

    <div v-if="activeTab === 'active'" class="auction-grid">
      <div v-for="item in activeItems" :key="item._id" class="luxury-card auction-card">
        <div class="card-header">
          <span class="status-badge">Live</span>
          <span class="timer">{{ getTimeRemaining(item.endsAt) }}</span>
        </div>
        <h3>{{ item.title }}</h3>
        <p class="description">{{ item.description }}</p>
        
        <div class="price-info">
          <div class="current-price">
            <label>Current Bid</label>
            <span class="amount">{{ formatCurrency(item.currentPrice) }}</span>
          </div>
          <div class="bidder-info">
            <label>Highest Bidder</label>
            <span>{{ item.currentBidder || 'No bids yet' }}</span>
          </div>
        </div>

        <router-link :to="'/items/' + item._id" class="luxury-btn view-btn">Place Bid</router-link>
      </div>
      <div v-if="activeItems.length === 0" class="empty-state">
        No active auctions at the moment.
      </div>
    </div>

    <div v-else class="auction-grid">
      <div v-for="item in endedItems" :key="item._id" class="luxury-card auction-card ended">
        <div class="card-header">
          <span class="status-badge ended">Sold</span>
        </div>
        <h3>{{ item.title }}</h3>
        <p class="description">{{ item.description }}</p>
        
        <div class="price-info">
          <div class="current-price">
            <label>Final Price</label>
            <span class="amount">{{ formatCurrency(item.currentPrice) }}</span>
          </div>
          <div class="bidder-info">
            <label>Winner</label>
            <span>{{ item.currentBidder || 'No winner' }}</span>
          </div>
        </div>

        <router-link :to="'/items/' + item._id" class="luxury-btn view-btn">View Details</router-link>
      </div>
      <div v-if="endedItems.length === 0" class="empty-state">
        No ended auctions to display.
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  animation: fadeIn 0.8s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
}

.hero h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.hero p {
  color: var(--color-text-muted);
  font-style: italic;
  font-size: 1.2rem;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--color-border);
}

.tabs button {
  background: none;
  color: var(--color-text-muted);
  padding: 1rem 2rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid transparent;
}

.tabs button.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.auction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.auction-card {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.status-badge {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.ended {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.timer {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-accent);
}

h3 {
  margin-bottom: 1rem;
}

.description {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  flex-grow: 1;
  margin-bottom: 2rem;
}

.price-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.price-info label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.view-btn {
  text-align: center;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem;
  color: var(--color-text-muted);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
}
</style>
