<script>
import PostComposer from './components/PostComposer.vue'
import PosterMastodon from './components/PosterMastodon.vue'
import PosterBluesky from './components/PosterBluesky.vue'
import PosterTumblr from './components/PosterTumblr.vue'
import PosterTwitter from './components/PosterTwitter.vue'

import secrets from './secrets.js'

import Logger from 'js-logger'
Logger.useDefaults()

export default {
  components: {
    PostComposer,
    PosterMastodon,
    PosterBluesky,
    PosterTumblr,
    PosterTwitter
  },
  data() {
    return {
      secrets,
      blank_draft: {
        body: "",
        link: ""
      }
    }
  },
  methods: {
    onDraftUpdate(new_draft) {
      this.Store.draft = new_draft
    }
  }
}
</script>

<template>
  <div class='row maindeck'>
    <PostComposer @update="onDraftUpdate" style="
      position: sticky;
      left: 0;
      z-index: 1;
    "/>
    <PosterTwitter :input="this.Store.draft"
    />
    <PosterTumblr :input="this.Store.draft"
      :consumer_key="secrets.TUMBLR_API_KEY"
      :consumer_secret="secrets.TUMBLR_API_SECRET"
      style="background: #36465d; color: white;"
    />
    <PosterBluesky :input="this.Store.draft"
      :BSKY_HOST="secrets.BSKY_HOST"
      style="background: azure;"
    />
    <PosterMastodon :input="this.Store.draft"
      style="background: cornflowerblue; color: white;"
      :MASTO_HOST="secrets.MASTO_HOST"
      :CLIENT_ID="secrets.MASTO_CLIENT_ID"
      :CLIENT_SECRET="secrets.MASTO_CLIENT_SECRET"
    />
  </div>
</template>

<style lang="scss">
@import './assets/base.css';

body, textarea, input {
  line-height: 1.6;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
}

pre {
  white-space: pre-wrap;
  overflow: auto;
}

.pointer {
  cursor: pointer;
}

.row {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
}
.col, .preview {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.preview .media {
  display: flex;
  > * {
    max-width: 100%;
    flex-shrink: 1;
  }
}

.maindeck > article {
  position: relative;
  width: 400px;
  padding: 1em;

  max-height: calc(100vh - 20px);
  overflow-y: auto;
  overflow-x: clip;

  justify-content: space-between;

  border: 1px solid black;
  background: white;
  & + article {
    border-left: none;
  }

  textarea { resize: vertical; }

  section {
    padding: 1em 0;
    border-bottom: 1px solid black;
    // &.login {
    //   position: absolute;
    //   bottom: 0;
    //   width: calc(400px - 2em);
    // }
    &.preview {
      flex: auto;
    }
  }

  input[type="text"], textarea {
    display: block;
    width: -webkit-fill-available;
  }

  .debug {
    font-size: 0.8em;
  }

  button .doPost {
    display: block;
    font-size: 2em;
    width: 100%;
  }
}
</style>

<style scoped>

</style>
