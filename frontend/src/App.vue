<template>
  <div class="app">
    <div v-if="!isAuth">
      <h1>Авторизация/Регистрация</h1>
      <div class="button-wrap">
        <button @click="curTab = 'login'" class="button-tab">Login</button>
        <button @click="curTab = 'reg'" class="button-tab">Registration</button>
      </div>

      <BaseUserForm
        v-if="curTab === 'login'"
        :cur-tab="curTab"
        @login="login"
      />
      <BaseUserForm v-if="curTab === 'reg'" :cur-tab="curTab" @reg="reg" />
    </div>
    <div v-else>
      <BaseUser :result="result" @logout="logout" />
      <BaseChat :user="result?.me" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { toast } from "vue3-toastify";
import {
  LOGIN_MUTATION,
  REG_MUTATION,
  ME_QUERY,
  LOGOUT_MUTATION,
} from "./variables";
import { io } from "socket.io-client";

import BaseUserForm from "@/components/common/BaseUserForm.vue";
import BaseUser from "@/components/common/BaseUser.vue";
import BaseChat from "@/components/common/BaseChat.vue";

const curTab = ref("login");
let socket = null;
const isAuth = ref(localStorage.getItem("accessToken") !== null);

const { mutate: regAuth } = useMutation(REG_MUTATION);
const { mutate: loginAuth } = useMutation(LOGIN_MUTATION);
const { mutate: logoutAuth } = useMutation(LOGOUT_MUTATION);

const login = async (user) => {
  try {
    const response = await loginAuth({
      email: user.email,
      password: user.password,
    });

    // Сохраняем access и refresh токены
    const { accessToken, refreshToken, user: userData } = response.data.login;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    isAuth.value = true;
    // Подключение к Socket.IO после логина
    socket = io("http://localhost:4000", {
      auth: { token: localStorage.getItem("accessToken") },
    });
    toast.success("Успешный вход");
    refetch();
  } catch (err) {
    console.log(err);
    toast.error("Ошибка авторизации");
  }
};

const reg = async (user) => {
  try {
    const response = await regAuth({
      email: user.email,
      password: user.password,
    });

    // Сохраняем access и refresh токены
    const {
      accessToken,
      refreshToken,
      user: userData,
    } = response.data.register;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    isAuth.value = true;
    // Подключение к Socket.IO после регистрации
    socket = io("http://localhost:4000", {
      auth: { token: localStorage.getItem("accessToken") },
    });
    toast.success("Успешная регистрация");
    refetch();
  } catch (err) {
    toast.error("Ошибка регистрации");
  }
};

const logout = async () => {
  try {
    const { data } = await logoutAuth(LOGOUT_MUTATION);
    console.log("Logout response:", data);
    if (data.logout) {
      // Очищаем localStorage после успешного выхода
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      console.log("Logged out successfully, localStorage cleared");
      isAuth.value = false;
    }
    return data.logout;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

const { result, refetch } = useQuery(ME_QUERY);
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  display: block;
}

.app {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: Arial, sans-serif;
  width: 100%;
  height: 100%;
}

h1 {
  text-align: center;
}

.button-wrap {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.button-tab {
  padding: 16px 0;
  background: transparent;
  color: white;
  text-decoration: underline;
  border: none;
  cursor: pointer;
}
</style>
