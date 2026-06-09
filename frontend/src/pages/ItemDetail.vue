<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { socket, connectSocket } from '../socket';
import { useAuthStore } from '../store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const item = ref<any>(null);
const bids = ref<any[]>([]);
const bidAmount = ref<number | null>(null);
const error = ref('');
const message = ref('');

const fetchItemData = async () => {
  try {
    const [itemRes, bidsRes] = await Promise.all([
      axios.get(`/api/items/${route.params.id}`),
      axios.get(`/api/items/${route.params.id}/bids`)
    ]);
    item.value = itemRes.data;
    bids.value = bidsRes.data;
  } catch (err) {
    console.error('Error fetching item details:', err);
    router.push('/');
  }
};

onMounted(() => {
  fetchItemData();

  if (auth.token) {
    connectSocket(auth.token);
  } else {
    socket.connect();
  }

  socket.emit('join-item', route.params.id);

  socket.on('new-bid', (newBid) => {
    if (newBid.itemId === route.params.id) {
      bids.value.unshift(newBid);
      if (item.value) {
        item.value.currentPrice = newBid.amount;
        item.value.currentBidder = newBid.bidder;
      }
    }
  });

  socket.on('auction-ended', (data) => {
    if (data.itemId === route.params.id && item.value) {
      item.value.status = 'ended';
      item.value.currentBidder = data.winner;
      item.value.currentPrice = data.finalPrice;
    }
  });

  socket.on('bid-rejected', (data) => {
    error.value = data.reason;
    setTimeout(() => error.value = '', 5000);
  });
});

onUnmounted(() => {
  socket.emit('leave-item', route.params.id);
  socket.off('new-bid');
  socket.off('auction-ended');
  socket.off('bid-rejected');
});

const placeBid = () => {
  if (!bidAmount.value) return;
  socket.emit('place-bid', {
    itemId: route.params.id,
    amount: bidAmount.value
  });
  bidAmount.value = null;
};

const deleteItem = async () => {
  try {
    await axios.delete(`/api/items/${route.params.id}`);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Delete failed';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const isOwner = computed(() => {
  return auth.user && item.value && item.value.ownerId === auth.user.id;
});

const minBid = computed(() => {
  return item.value ? item.value.currentPrice + 1 : 0;
});
</script>

<template>
  <div v-if="item" class="item-detail-page">
    <div class="luxury-card detail-card">
      <div class="detail-header">
        <router-link to="/" class="back-link">← Back to Gallery</router-link>
        <div class="status-wrap">
          <span :class="['status-badge', item.status]">{{ item.status }}</span>
        </div>
      </div>

      <div class="main-content">
        <div class="info-section">
          <h1>{{ item.title }}</h1>
          <p class="description">{{ item.description }}</p>
          
          <div class="stats-grid">
            <div class="stat-item">
              <label>Current Price</label>
              <div class="stat-value highlight">{{ formatCurrency(item.currentPrice) }}</div>
            </div>
            <div class="stat-item">
              <label>Starting Price</label>
              <div class="stat-value">{{ formatCurrency(item.startPrice) }}</div>
            </div>
            <div class="stat-item">
              <label>Owner</label>
              <div class="stat-value">{{ item.ownerUsername }}</div>
            </div>
          </div>

          <div v-if="item.status === 'active'" class="bid-form-section">
            <template v-if="auth.isAuthenticated">
              <div v-if="!isOwner">
                <label>Your Bid (Min: {{ formatCurrency(minBid) }})</label>
                <div class="bid-input-group">
                  <input v-model="bidAmount" type="number" :min="minBid" placeholder="Enter amount" />
                  <button @click="placeBid" class="luxury-btn">Place Bid</button>
                </div>
                <p v-if="error" class="error-msg">{{ error }}</p>
              </div>
              <p v-else class="owner-msg">This is your item. You cannot bid on it.</p>
            </template>
            <p v-else class="login-msg">Please <router-link to="/login">login</router-link> to place a bid.</p>
          </div>

          <div v-if="item.status === 'ended' && isOwner" class="admin-actions">
            <button @click="deleteItem" class="delete-btn">Delete Finished Auction</button>
          </div>
        </div>

        <div class="bids-section">
          <h3>Bid History</h3>
          <div class="bids-list">
            <div v-for="bid in bids" :key="bid.at" class="bid-entry">
              <div class="bidder">{{ bid.bidder }}</div>
              <div class="bid-details">
                <span class="bid-amount">{{ formatCurrency(bid.amount) }}</span>
                <span class="bid-time">{{ formatDate(bid.at) }}</span>
              </div>
            </div>
            <div v-if="bids.length === 0" class="no-bids">
              No bids placed yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="loading">Loading masterpiece...</div>
</template>

<style scoped>
.item-detail-page {
  animation: fadeIn 0.8s ease;
}

.detail-card {
  padding: 3rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.back-link {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.status-badge.ended {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 4rem;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.description {
  color: var(--color-text-muted);
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 4rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.stat-item label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
}

.stat-value.highlight {
  color: var(--color-accent);
  font-size: 1.8rem;
  font-family: var(--font-heading);
}

.bid-form-section {
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.bid-input-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.bid-input-group input {
  flex-grow: 1;
}

.bids-section {
  background: rgba(0, 0, 0, 0.2);
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.bids-list {
  margin-top: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
}

.bid-entry {
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bidder {
  font-weight: 600;
  color: var(--color-accent);
}

.bid-details {
  text-align: right;
}

.bid-amount {
  display: block;
  font-weight: 700;
}

.bid-time {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.delete-btn {
  background: #e74c3c;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 2rem;
}

.error-msg {
  color: #ff4d4d;
  font-size: 0.9rem;
  margin-top: 1rem;
}
</style>
