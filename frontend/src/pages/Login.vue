<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');

const handleLogin = async () => {
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed';
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="luxury-card auth-card">
      <h2>Sign In</h2>
      <p class="subtitle">Access the luxury auction house</p>

      <form @submit.prevent="handleLogin">
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
          {{ auth.loading ? 'Authenticating...' : 'Sign In' }}
        </button>
      </form>

      <p class="switch-auth">
        New to BidNow? <router-link to="/register">Create an account</router-link>
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
