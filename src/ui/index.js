import './polyfills';
import './styles';
import 'ant-design-vue/dist/antd.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import Antd from 'ant-design-vue';

import Main from 'screens/Main';

const app = createApp(Main);
const pinia = createPinia();

app.use(pinia);
app.use(Antd);

app.mixin({
  created() {
    this.console = window.console;
    this.ymaps = window.ymaps;
  },
});

app.mount('#root');

export default app;
