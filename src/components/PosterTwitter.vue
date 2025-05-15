<template>
  <article class="twitter col">
    <h2>Twitter</h2>

    <section class="preview">
      <h3>Preview</h3>
      <blockquote>
        <!-- <div v-if="payload.media_ids" class="media">
          <img class="debug"
            v-for="o, i in payload.media_ids"
            :key="i"
            :src="imageForId(o)?.url || 'UNLOADED!'" />
        </div> -->
        <span v-text="payload.text" style="white-space: pre-wrap;" />
      </blockquote>
      <span>{{payload.text.length}} / {{character_limit}}</span>
      <!-- <button class="doPost" :disabled="isPreloaded" @click="preloadPost">Preload</button>
      <button class="doPost" :disabled="!validated" @click="submitPost">Post!</button> -->
      <input type="text" v-model="in_reply_to" placeholder="Thread ID" />
      <PopupLink :href="intentUrl">Post w/ intent</PopupLink>
    </section>

    <!-- <section class="result" v-if="last_post_srcdoc">
      <h3>Your Last CHANGEME</h3>
      <div v-html="last_post_srcdoc" />
    </section>

    <section class="login">
      <div v-if="Store.CHANGEME_token">
        Logged in.
        <button @click="Store.CHANGEME_token = undefined">Log out</button>
      </div>
      <div v-else class="col">
        <a :href="oauth_url" target="_blank">Click here to get OAuth</a>
        <input v-model="oauth_code" @keydown.enter="onSubmitOauth" />
        <button @click="onSubmitOauth">Submit</button>
      </div>
    </section> -->

    <span v-text="feedback" />
    <section class="debug">
      <h3>State</h3>
      <pre class="code" v-text="payload" />
      <!-- <pre class="code" v-text="{oauth_url, mastodon_token: Store.mastodon_token, oauth_code}" /> -->
    </section>
  </article>
</template>

<style lang="scss">

</style>

<style lang="scss" scoped>
.preview blockquote {

}
</style>

<script>
import PosterCommon from './PosterCommon.vue'

import PopupLink from './PopupLink.vue'

export default {
  name: "PosterTwitter",
  shortname: "tw",
  components: {PopupLink},
  extends: PosterCommon,
  props: ['input'],
  data () {
    return {
      oauth_code: "",
      oauth_url: undefined,
      in_reply_to: "",
      character_limit: 280
    }
  },
  computed: {
    intentUrl() {
      const params = new URLSearchParams(this.payload)
      return `https://twitter.com/intent/tweet?${params}`
    },
    payload() {
      let text_str = `${this.input.body}`
      if (this.tagstr) {
        text_str += " " + this.tagstr
      }
      return {
        // format: 'json',
        text: text_str,
        url: this.relLink,
        in_reply_to: (this.input.thread ? this.in_reply_to : undefined)
      }
    },
    tagstr() {
      return this.input.tags
        .map(t => `#${t}`)
        .join(' ')
    },
    validated() {
      if (!this.isPreloaded) return false
      if (!this.payload.status) return false
      if (this.payload.status.length > this.character_limit) return false

      return true
    }
  },
  methods: {
    // Auth
    async getOauthUrl() {
      const resp = await fetch(`${this.Server}/CHANGEME/generateAuthUrl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: this.MASTO_HOST,
          clientId: this.CLIENT_ID,
          clientSecret: this.CLIENT_SECRET,
          options: {
            scope: ['read', 'write']
          }
        })
      })
      this.oauth_url = await resp.text()
    },
    onSubmitOauth() {
      fetch(`${this.Server}/CHANGEME/fetchAccessToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          host: this.MASTO_HOST,
          clientId: this.CLIENT_ID,
          clientSecret: this.CLIENT_SECRET,
          oauthCode: this.oauth_code
        })
      })
      .then(resp => resp.json())
      .then(json => {
        if (json['error']) {
          this.feedback = json
        }
        else {
          this.feedback = "OK"
          this.Store.changeme_token = json
        }
      })
    },

    // Lifecycle
    async preloadPost() {
      // for (const base64src of this.input.images) {
      //   this.images[base64src] || await this.uploadImage(base64src)
      // }
    },

    // Lookup
    // imageForId(media_id){
    //   try {
    //     return Object.entries(this.images).filter((a => a[1].id == media_id))[0][1]
    //   } catch {
    //     return undefined
    //   }
    // },

    // Submit
    async uploadImage(base64src) {
      // var resp = await fetch(`${this.MASTO_HOST}/api/v2/media`, {
      //   "headers": {
      //     // "Content-Type": "multipart/form-data",
      //     "authorization": `${this.Store.mastodon_token.token_type} ${this.Store.mastodon_token.access_token}`,
      //   },
      //   "method": "POST",
      //   "body": formData
      // })
      // this.images[base64src] = await resp.json()
    },
    submitPost() {
      // fetch(`${this.MASTO_HOST}/api/v1/statuses`, {
      //   "headers": {
      //     "Content-Type": "application/json",
      //     "authorization": `${this.Store.mastodon_token.token_type} ${this.Store.mastodon_token.access_token}`,
      //   },
      //   "method": "POST",
      //   "body": JSON.stringify(this.payload)
      // })
      // .then(resp => resp.json())
      // .then(json => {
      //   if (json['error']) {
      //     this.feedback = json
      //   }
      //   else {
      //     this.feedback = "OK"
      //     this.Store.mastodon_last_sent = json
      //   }
      // });
    }
  }
}

</script>