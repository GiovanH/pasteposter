// import './assets/main.css'

import * as Vue from 'vue'

// import * as AsyncComputed from 'vue3-async-computed';
//
import AsyncComputed from 'vue-async-computed'
// import * as AsyncComputed from 'vue3-async-computed';

// const asyncComputed = AsyncComputed.createPlugin({ ref: Vue.ref });
// import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import Logger from 'js-logger'

const app = Vue.createApp(App)

app.use(AsyncComputed)

// app.use(asyncComputed, {})

const reactivableStoreData = {}
const reactivableStore = new Proxy(reactivableStoreData, {
  set(target, key, value) {
    if (value === undefined) {
      localStorage.removeItem(key)
      try { delete reactivableStoreData[key] } catch {  }
      return true
    } else {
      localStorage.setItem(key, JSON.stringify(value))
      reactivableStoreData[key] = value
      return true
    }
  },
  get(target, key) {
    if (typeof key == 'symbol') return reactivableStoreData[key]
  // try {
    const v = localStorage.getItem(key)
    return v === null ? v : JSON.parse(v)
  // } catch (e) {
  //   console.error(e)
  //   return reactivableStoreData[key]
  // }
  }
})

app.mixin({
  // plugins: [ AsyncComputed ],
  data() {
    return {
      Server: `//${new URL(location.href).hostname}:5000`,
      Store: reactivableStore,
      shared_link_metadata: {}
    }
  },
  methods: {
    async $fetchLinkMetadata(url) {
      if (this.shared_link_metadata[url]) {
        return this.shared_link_metadata[url]
      }

      await fetch(`${this.Server}/generic/getSiteMeta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ url: url })
      })
      .then(resp => resp.json())
      .then(json => {
        this.shared_link_metadata[url] = json
      })

      return this.shared_link_metadata[url]
    },
    $post(url, body, exheaders) {
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(exheaders || {})
        },
        body: JSON.stringify(body)
      })
    },
    $postJson(url, body, exheaders) {
      return this.$post(url, body, exheaders)
        .then(resp => resp.json())
    }
  },
  computed: {
    $logger() {
      return Logger.get(this.$options.name)
    },
    // $store() {
    //   return new Proxy({}, {
    //     set(target, key, value) {
    //       if (value === undefined) {
    //         localStorage.removeItem(key)
    //         return true
    //       } else {
    //         localStorage.setItem(key, JSON.stringify(value))
    //         return true
    //       }
    //     },
    //     get(target, key) {
    //       const v = localStorage.getItem(key)
    //       return v === undefined ? v : JSON.parse(v)
    //     }
    //   })
    // }
  }
})

// app.use(createPinia())
app.use(router)


app.mount('#app')
window.vm = app
