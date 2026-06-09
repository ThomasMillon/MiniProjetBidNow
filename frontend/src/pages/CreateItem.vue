<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const title = ref('');
const description = ref('');
const startPrice = ref<number | null>(null);
const durationMinutes = ref<number>(10);
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  try {
    await axios.post('/api/items', {
      title: title.value,
      description: description.value,
      startPrice: startPrice.value,
      durationMinutes: durationMinutes.value
    });
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to list item';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="create-page">
    <div class="luxury-card form-card">
      <h2>List a Masterpiece</h2>
      <p class="subtitle">Prepare your item for the grand gallery</p>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Title</label>
          <input v-model="title" type="text" placeholder="e.g. Rare Renaissance Painting" required />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="description" rows="5" placeholder="Describe the item's history and condition..." required></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Starting Price (€)</label>
            <input v-model="startPrice" type="number" step="0.01" min="1" placeholder="100.00" required />
          </div>
          <div class="form-group">
            <label>Duration (Minutes)</label>
            <input v-model="durationMinutes" type="number" min="1" max="1440" required />
          </div>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="luxury-btn full-width" :disabled="loading">
          {{ loading ? 'Listing...' : 'Launch Auction' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create-page {
  display: flex;
  justify-content: center;
  padding-top: 2rem;
}

.form-card {
  width: 100%;
  max-width: 600px;
}

h2 {
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 2.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  color: var(--color-accent);
}

.full-width {
  width: 100%;
  margin-top: 1rem;
}

.error-msg {
  color: #ff4d4d;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
</style>
