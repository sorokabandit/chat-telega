<template>
  <div>
    <h1>Лк</h1>
    <h2>Welcome back! {{ result?.me?.email }}</h2>
    <button @click="logout" class="button button-logout">Logout</button>
  </div>
</template>

<script setup>
const emit = defineEmits(["logout"]);

defineProps({
  result: {
    type: Object,
    required: true,
  },
  isAuth: {
    type: Boolean,
    required: true,
  },
});

const logout = () => {
  emit("logout");
};
</script>

<style scoped>

.button-logout {
  padding: 8px 16px;
  background: yellow;
  color: black;
  border: none;
  cursor: pointer;
  width: 100%;
}
</style>
