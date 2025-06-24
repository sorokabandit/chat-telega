<template>
  <div>
    <h1 class="title">Simple Chat</h1>
    <div>
      <input
        class="input"
        v-model="message"
        placeholder="Type a message"
        @keyup.enter="sendMessage"
      />
      <ul>
        <li v-for="msg in messages" :key="msg.id">
          {{ msg.user }}: {{ msg.content }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import gql from "graphql-tag";
import { io } from "socket.io-client";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const messages = ref([]);
const message = ref("");
let socket = null;

// Загрузка сообщений
const { result: messagesResult, refetch } = useQuery(gql`
  query {
    messages {
      id
      content
      user
    }
  }
`);

watch(messagesResult, (newResult) => {
  if (newResult?.messages) {
    messages.value = [...newResult.messages];
  }
});

// Подключение к Socket.IO
onMounted(() => {
  socket = io("http://localhost:4000", {
    auth: { token: localStorage.getItem("accessToken") },
  });
  socket.on("newMessage", (msg) => {
    messages.value.push(msg);
  });
});

// Отключение Socket.IO
onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});

// Мутация для отправки сообщения
const { mutate: sendMessageMutation } = useMutation(gql`
  mutation ($content: String!, $user: String!) {
    sendMessage(content: $content, user: $user) {
      id
      content
      user
    }
  }
`);

const sendMessage = async () => {
  if (message.value.trim()) {
    await sendMessageMutation({
      content: message.value,
      user: props.user.email,
    });
    refetch();
    message.value = "";
  }
};
</script>

<style>
.input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
}

.title {
    margin-top: 32px;
}
</style>
