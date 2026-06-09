<script setup lang="ts">
import { useAuthStore } from './store/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <header class="navbar">
    <div class="container nav-content">
      <router-link to="/" class="logo">BID<span>NOW</span></router-link>
      <nav>
        <router-link to="/">Auctions</router-link>
        <template v-if="auth.isAuthenticated">
          <router-link to="/items/new">List Item</router-link>
          <span class="user-greeting">Welcome, {{ auth.user.username }}</span>
          <button @click="logout" class="logout-link">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login">Login</router-link>
          <router-link to="/register" class="luxury-btn">Register</router-link>
        </template>
      </nav>
    </div>
  </header>

  <main class="container">
    <router-view></router-view>
  </main>
</template>

<style scoped>
.navbar {
  background: rgba(10, 14, 23, 0.8);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid var(--color-border);
  padding: 1.5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-accent);
}

.logo span {
  color: var(--color-text);
}

nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

nav a {
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.user-greeting {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.logout-link {
  background: none;
  color: #ff4d4d;
  font-size: 0.85rem;
  text-transform: uppercase;
  font-weight: 600;
}

main {
  padding-top: 3rem;
  padding-bottom: 5rem;
}
</style>
