module.exports = {
  variants: {
    users: {
      //keepNames: true,
      resize: {
        large : "255x230"
      }
    }
  },

  storage: {
    Local: {
      path: './packages/users/public/assets/img/userImages/',
      mode: 0777
    },

/*    Rackspace: {
      username: 'USERNAME',
      apiKey: 'API_KEY',
      // authUrl: "https://lon.auth.api.rackspacecloud.com",
      container: 'CONTAINER'
    },
 *//*
    S3: {
      key: '',
      secret: '',
      bucket: '',
      //cdn: 'http://CDN_URL', // (optional)
      //storageClass: 'REDUCED_REDUNDANCY' // (optional)
      // set `secure: false` if you want to use buckets with characters like '.' (dot)
    },*/
  },
  debug: true
}

