<template>
  <div class="form">
    <input v-model="newUser.email" placeholder="Email" />
    <input v-model="newUser.password" placeholder="Пароль" />
    <button v-if="curTab === 'login'" @click="handleAuthUser(curTab)">
      {{ "Login" }}
    </button>
    <button v-if="curTab === 'reg'" @click="handleAuthUser(curTab)">
      {{ "Registration" }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['login', 'reg']);
defineProps({
  curTab: {
    type: String,
    default: 'login',
  },
});

const newUser = ref({
  email: '',
  password: '',
});

const handleAuthUser = (tab) => {
  const email = newUser.value.email;
  const password = newUser.value.password;

  if (tab === 'login') {
    // Handle login
    if (email && password) {
      emit('login', { email, password });
    }
  } else {
    if (email && password) {
      emit('reg', { email, password });
    }
  }
};

</script>

<style scoped>
.form {
  margin-bottom: 20px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
input {
  padding: 8px;
  width: 100%;
}
button {
  padding: 8px 16px;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  width: 100%;
}
button:disabled {
  background: #ccc;
}
</style>
