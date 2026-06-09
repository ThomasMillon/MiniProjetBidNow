<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');

const handleRegister = async () => {
  try {
    await auth.register(username.value, email.value, password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Registration failed';
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="luxury-card auth-card">
      <h2>Join BidNow</h2>
      <p class="subtitle">Start your journey in high-end auctions</p>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Username</label>
          <input v-model="username" type="text" placeholder="LuxHunter" required />
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input v-model="email" type="email" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="luxury-btn full-width" :disabled="auth.loading">
          {{ auth.loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <p class="switch-auth">
        Already have an account? <router-link to="/login">Sign in here</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h2 {
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.form-group {
  text-align: left;
  margin-bottom: 1.5rem;
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

.switch-auth {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>
