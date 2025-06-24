<template>
  <ul v-if="users">
    <li v-for="user in users" :key="user.id">
      <p>{{ user.name }} ({{ user.email }})</p>
      <button @click="deleteUser(user.id)">Удалить</button>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  users: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['deleteUser']);

const deleteUser = (id) => {
    emit('deleteUser', id);
}
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

button {
  padding: 8px 16px;
  background: red;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
