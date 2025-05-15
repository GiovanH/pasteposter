<!--
TODO:
- Hashtags
- Images
- Spoiler
-->

<template>
  <article class="tumblr col">
    <h2>Tumblr</h2>

    <section class="preview">
      <h3>Preview</h3>
      <blockquote v-if="payload.type == 'link'">
        <h2><a v-text="payload.title" :src="payload.url" /></h2>
        <span v-text="payload.description" style="white-space: pre-wrap;" />
        <span v-text="tagpreview" class="tags" style="white-space: pre-wrap;" />
      </blockquote>
      <blockquote v-else-if="payload.type == 'text'">
        <span v-text="payload.body" style="white-space: pre-wrap;" />
        <span v-text="tagpreview" class="tags" style="white-space: pre-wrap;" />
      </blockquote>
      <pre class="code" v-text="payload" />
      <span>{{payload.body?.length}} / {{character_limit}}</span>

      <button class="doPost" :disabled="isPreloaded" @click="preloadPost">Preload</button>
      <button class="doPost" :disabled="!validated" @click="submitPost">Post!</button>
    </section>

    <section class="result" v-if="Store.tumblr_last_sent">
      <h3>Your Last Post</h3>
      <a @click="last_post_oembed = null">Clear</a>
      <iframe v-if="last_post_oembed" :srcdoc="last_post_oembed.html" />
      <pre v-else class="debug" v-text="Store.tumblr_last_sent" />
      <!-- <pre class="debug" v-text="last_post_oembed" /> -->
      <!-- <div v-html="last_post_meta" /> -->
    </section>

    <section class="options" v-if="user_info">
      <div class="blogselect">
        <label
          v-for="blog in user_info.user.blogs"
          :key="blog.uuid"
          class="col"
          style="display: inline-block;">
          <img
            :src="blog.avatar.slice(-1)[0].url"
            :class="{disabled: !Store.tumblr_blogs.includes(blog.uuid)}"/>
          <span class="row">
            <input
              type="checkbox"
              :value="blog.uuid"
              v-model="Store.tumblr_blogs"/>
            {{ blog.name }}
          </span>
        </label>
      </div>
    </section>

    <section class="login">
      <div v-if="Store.tumblr_token && Store.tumblr_token.access_token && user_info">
        Logged in.
        <button @click="Store.tumblr_token = undefined">Log out</button>
      </div>
      <div v-else class="col">
        <PopupLink :href="oauth_url" target="_blank">Click here to get OAuth</PopupLink>
        <input
          v-model="oauth_code"
          placeholder="Paste entire result here"
          @keydown.enter="onSubmitOauth" />
        <button @click="onSubmitOauth">Submit</button>
      </div>
    </section>

    <span v-text="feedback" />
    <section class="debug">
      <h3>State</h3>
      <!-- <pre class="code" v-text="{user_info}" /> -->
    </section>
  </article>
</template>

<style lang="scss">
</style>

<style lang="scss" scoped>
.preview blockquote {
  padding: 1em;
  background: white;
  border: 1px solid rgb(224, 217, 217);
  border-radius: 4px;
  color: black;
  span.tags {
    display: block;
  }
}
a {
  color: white;
}
section.result {
  iframe {
    height: 240px;
    width: 100%;
  }
}
.blogselect {
  label {
    display: inline-block;
  }
  img.disabled {
    filter: grayscale(100%);
  }
}
</style>

<script>
import PosterCommon from './PosterCommon.vue'
import PopupLink from './PopupLink.vue'

// https://gist.github.com/gerbz/3514224
function convertForTumblr(imgURI,sep){
  function base64_decode(input){
    var output = new Array();
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    var orig_input = input;
    input = input.replace(/[^A-Za-z0-9+/=]/g, "");
    if (orig_input != input)
        console.error("Warning! Characters outside Base64 range in input string ignored.");
    if (input.length % 4) {
        console.error("Error: Input length is not a multiple of 4 bytes.");
        return "";
    }

    var j=0;
    while (i < input.length) {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output[j++] = chr1;
      if (enc3 != 64)
        output[j++] = chr2;
      if (enc4 != 64)
        output[j++] = chr3;

    }
    return output;
  }

  const hD = '0123456789ABCDEF';
  function dec2hex(d){
    var h = hD.substr(d & 15,1);
    while (d > 15) {
      d >>= 4;
      h = hD.substr(d & 15,1) + h;
    }
    return h;
  }

  // takes hex data with no seperator
  function convert(data){

    // Now that we have raw hex data lets convert it
    // Each hex value is 2 characters
    var newhex = '';
    for(var i=0; i < data.length; i+=2){

      var substr = data.substr(i, 2);
      var val = parseInt(substr, 16);

      if ((val <=46 && val >= 45) || (val <=57 && val >= 48) || (val <=90 && val >= 65) || (val == 95) || (val <=122 && val >= 97)) {
        newhex += String.fromCharCode(val);
      }else{
        newhex += '%' + substr.toUpperCase();
      }

    }

    // dont convert tildes
    newhex = newhex.replace(/\%7E/g,'~');

    return newhex;
  }

  var output = base64_decode(imgURI);
  var separator = "";
  if (sep) {separator = "\\x";}

  var hexText = "";
  for (let i = 0; i < output.length; i++) {
    hexText = hexText + separator + (output[i] < 16 ? "0" : "") + dec2hex(output[i]);
  }

  var tumblrImage = convert(hexText);

  return tumblrImage;

}

export default {
  name: "PosterTumblr",
  shortname: "tu",
  components: {PopupLink},
  extends: PosterCommon,
  props: ['input', 'consumer_key', 'consumer_secret'],
  data () {
    return {
      link_metadata: {},
      oauth_code: "",
      user_info: {},
      last_post_oembed: null,
      last_post_reblog_key: null,
      refresh_timeout: null
    }
  },
  asyncComputed: {
    async user_info() {
      if (!this.Store.tumblr_token?.access_token) {
        return null
      }
      var resp = await fetch(`https://api.tumblr.com/v2/user/info`, {
        "method": "GET",
        "headers": {
          "authorization": `Bearer ${this.Store.tumblr_token.access_token}`,
        }
      })
      const body = await resp.json()
      if (body.meta.msg == "OK") { return body.response }
      else {
        this.feedback = body.meta
        this.refreshOauthToken()
      }
    },
    async last_post_oembed() {
      if (!this.Store.tumblr_last_sent?.display_text) return null
      if (!this._isMounted) return null
      try {
        const blog = this.Store.tumblr_last_sent.blog_name

        const oembed_url = `https://${blog}.tumblr.com/post/${this.Store.tumblr_last_sent.id_string}`

        const params = new URLSearchParams({
          url: oembed_url
        })

        var json = await this.$postJson(`${this.Server}/generic/fetchJson`, {
          url: `https://www.tumblr.com/oembed/1.0?${params}`,
          options: {
            method: "GET"
          }
        })

        this.$logger.info(json)
        if (Object.keys(json).length == 0) {
          throw Error(`Response body was empty for oembed ${oembed_url} https://www.tumblr.com/oembed/1.0?${params}`)
        }
        return json
      } catch (e) {
        this.$logger.error(e)
        this.feedback = e
        return null
      }
    },
    async last_post_reblog_key() {
      if (!this.Store.tumblr_last_sent) return null
      if (!this._isMounted) return null
      const blog = this.Store.tumblr_last_sent.uuid

      var resp = await fetch(`https://api.tumblr.com/v2/blog/${blog}/posts/${this.Store.tumblr_last_sent.id_string}`, {
        "headers": {
          "Content-Type": "application/json",
          "authorization": `Bearer ${this.Store.tumblr_token.access_token}`,
        },
        method: "GET"
      })
      const body = await resp.json()

      if (body.meta.msg == "OK") {
        this.feedback = body.response
        return body.response.reblog_key
      }
      else {
        this.feedback = body.meta
        return
      }
    }
  },
  computed: {
    payload() {
      let payload = {
        '_endpoint': 'post',
        'tags': this.input.tags
      }
      let text = this.input.body

      if (this.input.thread && this.Store.tumblr_last_sent) {
        // Reblog
        payload._endpoint = "post/reblog"
        payload.id = this.Store.tumblr_last_sent.id_string
        payload.reblog_key = this.last_post_reblog_key
        payload.comment = text
      // } else if (this.input.video) {
      //   payload.type = "video"
      //   payload.caption = text
      //   payload.data = data

      } else if (this.input.images.length > 0) {
        // Image
        if (this.input.images.length > 1) {
          this.$logger.error("Multiple images are not yet supported")
          return {}
        }
        // const file = Buffer.from(base64src, 'base64')
        payload.type = "photo"
        payload.data64 = this.input.images.map(base64src => {
          // eslint-disable-next-line no-unused-vars
          const [_, mimeType, bytes] = /data:(.+?);base64,(.+)$/.exec(base64src)
          return bytes
        })[0]
        // payload.data = this.input.images.map(base64src => {
        //   const [_, mimeType, bytes] = /data:(.+?);base64,(.+)$/.exec(base64src)
        //   const file = Buffer.from(base64src, 'base64')
        //   return file
        //   // return convertForTumblr(bytes)
        // })
        // this.input.images.map(convertForTumblr)
        payload.link = this.relLink
        payload.caption = text
      }
      else if (this.relLink) {

        payload.type = "link"
        payload.title = this.link_metadata[this.input.link]?.title || undefined
        payload.url = this.relLink

        payload.excerpt = this.link_metadata[this.input.link]?.description || undefined
        payload.thumbnail = this.link_metadata[this.input.link]?.image_icon || undefined

        payload.description = text
      } else {
        payload.type = "text"
        payload.format = "markdown"
        payload.body = text
      }
      return payload
    },
    tagpreview() {
      return this.payload.tags
        .map(t => `#${t}`)
        .join(' ')
    },
    oauth_url() {
      const params = new URLSearchParams({
        client_id: this.consumer_key,  // Your OAuth consumer key n/a Yes
        response_type: "code", // String  Always code n/a Yes
        scope: "basic write offline_access", //  A space delimited list of scopes  n/a Yes
        state: "idempotent",
        redirect_uri: `${this.Server}/tumblr/printOauth`
      })
      return `https://www.tumblr.com/oauth2/authorize?${params}`
    },
    validated() {
      if (!this.isPreloaded) return false
      // if (this.payload.text == this.last_post_meta?.record?.text) return
      // if (!this.payload.body) return false
      // if (this.payload.body.length > this.character_limit) return false

      return true
    }
  },
  methods: {
    onSubmitOauth() {
      const code = new URLSearchParams(this.oauth_code).get('code')

      this.$postJson(`https://api.tumblr.com/v2/oauth2/token`, {
        grant_type: "authorization_code", //  String  Always authorization_code n/a Yes
        code: code, //  String  The code recieved at your OAuth2 redirect Url n/a Yes
        client_id: this.consumer_key, // String  Your OAuth consumer key n/a Yes
        client_secret: this.consumer_secret, // String  Your OAuth consumer secret  n/a Yes
        redirect_uri: `${this.Server}/tumblr/printOauth`, //  String  A redirect URI (if it was included in the authorization request)  n/a No
      })
      .then(json => {
        if (json['error']) {
          this.feedback = json
        }
        else {
          this.feedback = "OK"
          this.Store.tumblr_token = json
        }
      })
    },

    refreshOauthToken() {
      if (!this.Store.tumblr_token?.refresh_token) {
        throw Error("Can't refresh token without refresh_token in tumblr_token")
      }

      this.$postJson(`https://api.tumblr.com/v2/oauth2/token`, {
        grant_type: "refresh_token",
        client_id: this.consumer_key, // String  Your OAuth consumer key n/a Yes
        client_secret: this.consumer_secret, // String  Your OAuth consumer secret  n/a Yes
        refresh_token: this.Store.tumblr_token.refresh_token, //  String  A redirect URI (if it was included in the authorization request)  n/a No
      })
      .then(json => {
        if (json['error']) {
          this.feedback = json
        }
        else {
          this.feedback = "OK"
          this.Store.tumblr_token = json
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

    // Submit
    // async uploadImage(base64src) {
    // },

    async submitPost() {
      for (const uuid of this.Store.tumblr_blogs) {
        var body = await this.$postJson(
          `https://api.tumblr.com/v2/blog/${uuid}/${this.payload._endpoint}`,
          this.payload,
          {
            "authorization": `Bearer ${this.Store.tumblr_token.access_token}`,
          }
        )
        if (body.meta.msg == "Created") {
          this.feedback = body.response
          this.Store.tumblr_last_sent = {
            uuid: uuid,
            blog_name: body.response.display_text.replace('Posted to ', ''),
            ...body.response
          }
        }
        else {
          this.feedback = body.meta
          return
        }
      }
    }
  },
  watch: {
    'input.link'(to) {
      if (!this.link_metadata[to]) {
        this.$fetchLinkMetadata(to).then(metadata => {
          this.link_metadata[to] = metadata
        })
      }
    },
    'Store.tumblr_token.refresh_token'(to){
      const json = this.Store.tumblr_token
      if (json?.expires_in && json.refresh_token) {
        if (this.refresh_timeout) clearTimeout(this.refresh_timeout)
        this.refresh_timeout = setTimeout(this.refreshOauthToken, (json.expires_in * 95/100) * 1000)
        this.$logger.info("Queued refresh in", json.expires_in, json.expires_in * 95/100, this.refresh_timeout)
      }
    }
  },
  created() {
    if (!this.Store.tumblr_blogs) {
      this.Store.tumblr_blogs = []
    }
  },
}

</script>