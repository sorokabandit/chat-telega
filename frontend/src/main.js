import "./assets/main.css";
import Vue3Toastify from "vue3-toastify";
import { createApp } from "vue";
import "vue3-toastify/dist/index.css";
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { provideApolloClient } from "@vue/apollo-composable";
import App from "./App.vue";
import { REFRESH_TOKEN_MUTATION } from "./variables";
import { Observable } from "@apollo/client/core";

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

// Обработка ошибок для обновления токена
const errorLink = onError(({ graphQLErrors, operation, forward }) => {

  // Пропускаем обработку ошибок для мутации register
  if (operation.operationName === "Register") {
    return forward(operation); // Пропускаем без обработки ошибок
  }

  if (graphQLErrors.length) {
    for (let err of graphQLErrors) {
      if (err.message === "Not authenticated") {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          // В обработчике ошибок:
          return new Observable((observer) => {
            apolloClient
              .mutate({
                mutation: REFRESH_TOKEN_MUTATION,
                variables: { refreshToken },
                context: { headers: {} },
              })
              .then(({ data }) => {
                const { accessToken, refreshToken: newRefreshToken } =
                  data.refreshToken;
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                const oldHeaders = operation.getContext().headers || {};
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    Authorization: `Bearer ${accessToken}`,
                  },
                });

                const subscriber = {
                  next: observer.next.bind(observer),
                  error: observer.error.bind(observer),
                  complete: observer.complete.bind(observer),
                };

                forward(operation).subscribe(subscriber);
              })
              .catch((error) => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.reload();
                observer.error(error);
              });
          });
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    }
  }
});

const authLink = setContext((_, { headers = {} }) => {
  // Пропускаем добавление Authorization для мутации register
  if (_.operationName === "Register") {
    return { headers };
  }

  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(errorLink).concat(httpLink),
  cache: new InMemoryCache(),
});

// Подключение Apollo к Vue
const app = createApp(App);
provideApolloClient(apolloClient);
app.use(Vue3Toastify, {
  autoClose: 3000,
});
app.mount("#app");
