<!--
TODO:
- Hashtags
-->

<template>
  <article class="mastodon col">
    <h2>Mastodon</h2>

    <section class="preview">
      <h3>Preview</h3>
      <blockquote>
        <div v-if="payload.media_ids" class="media">
          <img class="debug"
            v-for="o, i in payload.media_ids"
            :key="i"
            :src="imageForId(o)?.url || 'UNLOADED!'" />
        </div>
        <span v-text="payload.status" style="white-space: pre-wrap;" />
      </blockquote>
      <span>{{payload.status.length}}/ {{character_limit}}</span>
      <button class="doPost" :disabled="isPreloaded" @click="preloadPost">Preload</button>
      <button class="doPost" :disabled="!validated" @click="submitPost">Post!</button>
    </section>

    <section class="result" v-if="Store.mastodon_last_sent">
      <h3>Your Last Toot</h3>
      <div v-html="last_post_srcdoc" />
    </section>

    <section class="login">
      <div v-if="Store.mastodon_token">
        Logged in.
        <button @click="Store.mastodon_token = undefined">Log out</button>
      </div>
      <div v-else class="col">
        <a :href="oauth_url" target="masto_auth">Click here to get OAuth</a>
        <input v-model="oauth_code" @keydown.enter="onSubmitOauth" />
        <button @click="onSubmitOauth">Submit</button>
      </div>
    </section>

    <span v-text="feedback" />
    <section class="debug">
      <h3>State</h3>
      <pre class="code" v-text="payload" />
      <!-- <pre class="code" v-text="{oauth_url, mastodon_token: Store.mastodon_token, oauth_code}" /> -->
    </section>
  </article>
</template>

<style lang="scss">
  section.result {
    iframe {
      height: 240px;
    }
  }
</style>

<style lang="scss" scoped>
.preview blockquote {
  background: #282c37;
  color: white;
  padding: 1em;
}
</style>

<script>

import PosterCommon from './PosterCommon.vue'

export default {
  name: "PosterMastodon",
  extends: PosterCommon,
  props: ['input', 'CLIENT_ID', 'CLIENT_SECRET', 'MASTO_HOST'],
  data () {
    return {
      oauth_code: "",
      oauth_url: undefined,
      character_limit: 500
    }
  },
  created() {
    this.$nextTick(_ => {
      if (!this.Store.mastodon_token) {
        this.getOauthUrl()
      }
    })
  },
  computed: {
    payload() {
      let text = this.input.body
      if (this.tagstr) {
        text += " " + this.tagstr
      }
      if (this.relLink) {
        text += ` ${this.relLink}`
      }
      return {
        "status": text.trim(),
        "sensitive": this.input.hide,
        "spoiler_text": this.input.label,
        "media_ids": this.input.images.map(base64src => {
          return this.images[base64src]
            ? this.images[base64src].id
            : "UNLOADED!"
        }),
        "in_reply_to_id": this.input.thread
          ? this.Store.mastodon_last_sent.id
          : undefined
      }
    },
    tagstr() {
      return this.input.tags
        .map(t => `#${t}`)
        .join(' ')
    },
    validated() {
      if (!this.isPreloaded) return false
      // if (!this.payload.status) return false
      if (this.payload.status.length > this.character_limit) return false
      // if (this.Store.mastodon_last_sent) {
      //   if (this.Store.mastodon_last_sent.content.includes(this.payload.status)) {
      //     // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      //     this.feedback = "Duplicate post!"
      //     return false
      //   }
      // }
      return true
    }
  },
  methods: {
    // Auth
    async getOauthUrl() {
      const resp = await fetch(`${this.Server}/mastodon/generateAuthUrl`, {
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
      fetch(`${this.Server}/mastodon/fetchAccessToken`, {
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
          this.Store.mastodon_token = json
        }
      })
    },

    // Lifecycle
    async preloadPost() {
      for (const base64src of this.input.images) {
        this.images[base64src] || await this.uploadImage(base64src)
      }
    },

    // Lookup
    imageForId(media_id){
      try {
        return Object.entries(this.images).filter((a => a[1].id == media_id))[0][1]
      } catch {
        return undefined
      }
    },

    // Submit
    async uploadImage(base64src) {
      // const [_, mimeType, bytes] = /data:(.+?);base64,(.+)$/.exec(base64src)
      // const file = Buffer.from(base64src, 'base64')
      const formData = new FormData()
      formData.append("file", base64src)
      var resp = await fetch(`${this.MASTO_HOST}/api/v2/media`, {
        "headers": {
          // "Content-Type": "multipart/form-data",
          "authorization": `${this.Store.mastodon_token.token_type} ${this.Store.mastodon_token.access_token}`,
        },
        "method": "POST",
        "body": formData
      })
      this.images[base64src] = await resp.json()
    },
    submitPost() {
      fetch(`${this.MASTO_HOST}/api/v1/statuses`, {
        "headers": {
          "Content-Type": "application/json",
          "authorization": `${this.Store.mastodon_token.token_type} ${this.Store.mastodon_token.access_token}`,
        },
        "method": "POST",
        "body": JSON.stringify(this.payload)
      })
      .then(resp => resp.json())
      .then(json => {
        if (json['error']) {
          this.feedback = json
        }
        else {
          this.feedback = "OK"
          this.Store.mastodon_last_sent = json
        }
      })
    }
  },
  watch: {
    'Store.mastodon_last_sent': {
      immediate: true,
      handler(to) {
        if (!to) return
        fetch(`${this.MASTO_HOST}/api/oembed?url=${to.url}`)
        .then(resp => resp.json())
        .then(json => {
          this.$logger.info(json)
          this.last_post_srcdoc = json.html
          this.$logger.info(this.last_post_srcdoc)
        })
      }
    }
  },
}

</script>