<!--
TODO:
- Hashtags
- Images (broken)
-->

<template>
  <article class="bluesky col">
    <h2>Bluesky</h2>

    <section class="preview" v-if="payload">
      <h3>Preview</h3>
      <blockquote>
        <div v-if="payload.embed && payload.embed.images" class="media">
          <pre class="debug"
            v-for="o, i in payload.embed.images"
            :key="i"
            v-text="o.image.ref" />
        </div>
        <div v-if="payload.embed && payload.embed.external" class="media">
          <a :href="payload.embed.external.uri" v-text="payload.embed.external.title" /><span v-text="payload.embed.external.description" />
        </div>
        <span v-text="payload.text" style="white-space: pre-wrap;" />
      </blockquote>
      <span>{{ payload._length }}/ {{character_limit}}</span>

      <label>Force jpg?
        <input type="checkbox" v-model="force_jpg" /></label>
      <button class="doPost" :disabled="isPreloaded" @click="preloadPost">Preload</button>
      <button class="doPost" :disabled="!validated" @click="submitPost">Post!</button>
    </section>

    <section class="result" v-if="Store.bsky_last_sent">
      <h3>Your Last Skeet</h3>
      <a v-if="last_post_meta" target="_blank"
        :href="`https://bsky.app/profile/${last_post_meta.author.handle}/post/${last_post_meta.uri.split('/').slice(-1)[0]}`"
        v-text="last_post_meta.uri" />
      <pre class="debug" v-if="last_post_meta" v-text="last_post_meta.record" />
      <pre class="debug" v-else v-text="Store.bsky_last_sent" />
      <!-- <div v-html="last_post_meta" /> -->
    </section>

    <section class="login">
      <div v-if="logged_in">
        Logged in.
        <button @click="logged_in = false">Log out</button>
      </div>
      <div v-else class="col">
        <!-- <a :href="oauth_url" target="masto_auth">Click here to get OAuth</a> -->
        <input v-model="Store.bsky_identifier" @keydown.enter="submitLogin" />
        <input v-model="Store.bsky_password" @keydown.enter="submitLogin" />
        <button @click="submitLogin">Submit</button>
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
  padding: 1em;
  background: white;
  border: 1px solid rgb(224, 217, 217);
  border-radius: 8px;
}
</style>

<script>
import { RichText, BskyAgent } from '@atproto/api'
import { Buffer } from 'buffer'

import PosterCommon from './PosterCommon.vue'

export default {
  name: "PosterBluesky",
  shortname: "bsky",
  extends: PosterCommon,
  props: ['input', 'BSKY_HOST'],
  data () {
    return {
      images: {},
      payload: {},
      logged_in: false,
      feedback: "",
      last_post_meta: "",
      last_post_oembed: "",
      character_limit: 300,
      identifier: "",
      password: "",
      max_blob_size: 1_000_000,
      force_jpg: false
    }
  },
  computed: {
    isPreloaded(){
      if (!this.payload) return false
      if (!this.payload.text && !this.payload.embed) return false
      if (this.payload._length > this.character_limit) return false
      return (!JSON.stringify(this.payload).includes("UNLOADED"))
    },
    validated() {
      if (!this.isPreloaded) return false
      // if (this.payload.text == this.last_post_meta.record.text) return
      return true
    },
    agent() {
      const agent = new BskyAgent({
        service: this.BSKY_HOST,
        persistSession: (e, session_data) => {
          this.Store.bsky_session = session_data
        },
      })
      window.bskyagent = agent
      return agent
    },
  },
  asyncComputed: {
    payload: {
      default: null,
      async get() {

        const payload = {
          $type: 'app.bsky.feed.post',
          createdAt: new Date().toISOString(),
        }

        let text_str = `${this.input.body}`

        if (this.input.thread) {
            payload["reply"] = {
              "root": this.Store.bsky_last_root || this.Store.bsky_last_sent,
              "parent": this.Store.bsky_last_sent
            }
        }

        if (this.relLink) {
          if (false) {
            // TODO: If link is a bsky post
            // https://bsky.app/profile/neilhimself.neilgaiman.com/post/3k6woj3z2l32c
            // embed it as a quote:
            // https://atproto.com/blog/create-post#quote-posts
          }
          // TODO: Fetch and embed link card
          else if (!this.input.images || this.input.images.length == 0) {
            var resp;
            try {
              const { title, description } = await this.$fetchLinkMetadata(this.relLink)
              payload["embed"] = {
                "$type": "app.bsky.embed.external",
                "external": {
                  "uri": this.relLink,
                  "title": title,
                  "description": description || "",
                  // TODO THUMB
                  // "thumb": {
                  //   "$type": "blob",
                  //   "ref": {
                  //     "$link": "bafkreiash5eihfku2jg4skhyh5kes7j5d5fd6xxloaytdywcvb3r3zrzhu"
                  //   },
                  //   "mimeType": "image/png",
                  //   "size": 23527
                  // }
                }
              }
            } catch (e) {
              this.$logger.warn(resp, e)
              text_str += ` ${this.relLink}`
            }
          }
          else {
            text_str += ` ${this.relLink}`
          }
        }
        const rt = new RichText({
          text: text_str,
        })
        payload.text = rt.text
        payload._length = rt.length

        await rt.detectFacets(this.agent).then(_ => payload.facets = rt.facets)
        // this.$logger.info(rt.text)

        if (this.input.images.length > 0) {
          payload["embed"] = {
            "$type": "app.bsky.embed.images",
            "images": this.input.images.map(base64src => ({
              "alt": "",
              "image": this.images[base64src]
                ? {
                    ...this.images[base64src].data.blob.toJSON()
                  }
                : "UNLOADED!"
            }))
          }
        }
        return payload
      }
    }
  },
  methods: {
    // Auth
    async resumeSession() {
      try {
        await this.agent.resumeSession(this.Store.bsky_session)
        this.$logger.info("Resumed bluesky session.")
        this.logged_in = true
      } catch (e) {
        if (this.Store.bsky_password && this.Store.bsky_identifier) {
          this.submitLogin()
          this.logged_in = true
        } else {
          this.$logger.error(e)
        }
      }
    },
    async submitLogin() {
      await this.agent.login({
        identifier: this.Store.bsky_identifier,
        password: this.Store.bsky_password
      })
      this.$logger.info("Logged in with credentials.")
      this.logged_in = true
    },

    // Lifecycle
    async preloadPost() {
      for (const base64src of this.input.images) {
        this.images[base64src] || this.uploadImage(base64src)
      }
    },

    // Submit
    uploadImage(base64src) {
      if (this.force_jpg) {
        this.dataurlToJpg(base64src).then(file => {
          this.agent.uploadBlob(file, {encoding: "image/jpeg"})
            .then(resp => {
              this.images[base64src] = resp
              this.$asyncComputed.payload.update()
              this.$logger.info(resp)
            })
        })
      } else {
        const [_, mimeType, bytes] = /data:(.+?);base64,(.+)$/.exec(base64src)
        const file = Buffer.from(bytes, 'base64')
        this.agent.uploadBlob(file, {encoding: mimeType})
          .then(resp => {
            this.images[base64src] = resp
            this.$asyncComputed.payload.update()
            this.$logger.info(resp)
          })
      }
    },
    dataurlToJpg(base64src) {
      const quality_step = 0.02
      return new Promise((resolve, reject) => {
        try {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          var image = new Image()
          image.onload = () => {
            canvas.width = image.width
            canvas.height = image.height
            ctx.drawImage(image, 0, 0)

            let quality = 1.0
            const mimetypejpg = "image/jpeg"
            let file

            do {
              const dataurl = canvas.toDataURL(mimetypejpg, quality)
              const [_, mimeType, bytes] = /data:(.+?);base64,(.+)$/.exec(dataurl)
              file = Buffer.from(bytes, 'base64')
              this.$logger.info(file.byteLength, quality)
              quality -= quality_step
              if (quality < 0.5) {
                this.$logger.error(image, canvas, file)
                throw Error("Downsample loop")
              }
            }
            while (file.byteLength > this.max_blob_size)

            // this.$logger.info(image, canvas, file, file.bytelength, quality)

            resolve(file)
          }
          image.src = base64src
        } catch (e) {
          reject(e)
        }
      })
    },
    submitPost() {
      this.agent.post(this.payload)
        .then(resp => {
          this.$logger.info(resp)
          this.Store.bsky_last_sent = resp
          if (!this.input.thread) {
            this.Store.bsky_last_root = resp
          }
        })
        .catch(err => this.$logger.info(err))
    }
  },
  created() {
    if (this.Store.bsky_session) {
      try {
        this.resumeSession()
      } catch {}
    }
    window.vm_bsky = this;
  },
  watch: {
    'Store.bsky_last_sent': {
      immediate: true,
      handler(to) {
        if (!to) return
        if (!this.agent) {
          this.$logger.error("No agent!")
          return
        }
        this.agent.getPostThread({"uri": to.uri}).then(resp => {
          this.last_post_meta = resp.data.thread.post

        })
        // fetch(`${this.MASTO_HOST}/api/oembed?url=${to.url}`)
        // .then(resp => resp.json())
        // .then(json => {
        //   this.$logger.info(json)
        //   this.last_post_meta = json.html
        //   this.$logger.info(this.last_post_meta)
        // })
      }
    }
  },
}

</script>